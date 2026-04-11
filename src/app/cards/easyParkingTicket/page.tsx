"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Loader from "@/app/components/loader/page";
import SoundWave from "@/app/components/soundWave/page";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { generatePDFReport } from "@/app/utils/pdfGenerator";
import { saveScenarioScore } from "@/utils/scoreManager";
import { unlockWebAudioOnUserGesture } from "@/utils/webAudioUnlock";
import { cancelBrowserSpeech, playTtsAudioOrBrowser } from "@/utils/playTtsWithBrowserFallback";
import ScenarioChatLayout from "@/app/components/scenarioChat/ScenarioChatLayout";
import AudioTestStrip from "@/app/components/scenarioChat/AudioTestStrip";
import ScenarioWelcomeModal from "@/app/components/scenarioChat/ScenarioWelcomeModal";

export default function EasyParkingTicket() {
  const [phase, setPhase] = useState<"intro" | "conversation" | "completed">("intro");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(20); // Updated for 2-question format
  const [explanationGiven, setExplanationGiven] = useState(false);
  const [feedback, setFeedback] = useState<{ feedback: string; score: number; maxScore: number } | null>(null);
  const router = useRouter();

  const {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();
  const audioUnlockedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Officer data
  const officer = {
    name: "Officer Martinez",
    title: "Parking Enforcement",
    avatar: "/avatars/parking-police-man.png",
    voice: "onyx"
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      console.warn("Browser doesn't support speech recognition.");
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        SpeechRecognition.stopListening();
        if (SpeechRecognition.abortListening) {
          SpeechRecognition.abortListening();
        }
      } catch {
        /* ignore */
      }
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.onended = null;
          currentAudioRef.current.pause();
          currentAudioRef.current.src = "";
          currentAudioRef.current.load();
        } catch {
          /* ignore */
        }
        currentAudioRef.current = null;
      }
    };
  }, []);

  // Handle user response automatically
  const processUserResponse = useCallback(async (response: string) => {
    console.log("🗣️ User responded:", response);
    console.log("🎯 Current question number:", questionNumber);
    
    SpeechRecognition.stopListening();
    setMicActive(false);

    const userMessage = {
      role: "user",
      content: response,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, userMessage]);

    if (questionNumber === 1) {
      // First answer - get AI follow-up question (single API call)
      console.log("🤖 Getting AI follow-up based on user's parking explanation...");
      await getAIFollowUpQuestion(response);
      setQuestionNumber(2);
    } else if (questionNumber === 2) {
      // Second answer - end with ticket message (no API call)
      console.log("🎫 Ending with ticket notice...");
      await showTicketMessage();
      endConversation();
    }
  }, [questionNumber]);

  // Auto-process user response when they stop speaking
  useEffect(() => {
    console.log("🔍 useEffect triggered:", { conversationStarted, micActive, listening, transcript: transcript.substring(0, 50) });
    if (!conversationStarted) {
      console.log("⚠️ Not processing: conversationStarted=", conversationStarted);
      return;
    }
    if (!listening && transcript.trim() && transcript.trim().length > 3) {
      console.log("🎤 Processing user response:", transcript);
      processUserResponse(transcript);
      resetTranscript();
    } else {
      console.log("⏳ Waiting - listening:", listening, "transcript length:", transcript.length);
    }
  }, [listening, transcript, conversationStarted, processUserResponse]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [history, interimTranscript, finalTranscript]);

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    unlockWebAudioOnUserGesture();
    audioUnlockedRef.current = true;
    console.log("🔓 Audio context unlocked");
  };

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("🎤 Microphone permission granted");
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("❌ Microphone permission denied:", error);
      return false;
    }
  };

  // Random initial questions - no API call needed
  const initialQuestions = [
    "I need to issue you a parking ticket. This is a no-parking zone. Can you explain why you parked here?",
    "Excuse me, you're parked illegally in this area. Do you have a reason for parking in this no-parking zone?",
    "I'm writing you a citation for parking in a restricted area. Can you tell me why you chose to park here?",
    "You're in violation of parking regulations here. What's your explanation for parking in this prohibited zone?"
  ];

  const startConversation = async () => {
    unlockAudio();
    const micPermission = await requestMicrophonePermission();
    if (!micPermission) {
      console.log("❌ Cannot start conversation without microphone permission");
      return;
    }
    setShowIntroPopup(false);
    setConversationStarted(true);
    setPhase("conversation");
    setQuestionNumber(1);
    
    // Clear old data
    resetTranscript();
    setHistory([]);
    setFeedback(null);
    setScore(0);
    setExplanationGiven(false);
    
    // Start with random initial question (no API call)
    const randomQuestion = initialQuestions[Math.floor(Math.random() * initialQuestions.length)];
    console.log(`🎤 Starting with random question: ${randomQuestion}`);
    
    const initialMessage = {
      role: "assistant",
      content: randomQuestion,
      speaker: officer.name,
      timestamp: Date.now(),
    };

    setHistory([initialMessage]);
    await playVoice(randomQuestion, officer.name);
    
    // Enable mic for user response
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  // Get AI follow-up question based on user's parking explanation (single API call)
  const getAIFollowUpQuestion = async (userAnswer: string) => {
    console.log(`🤖 Getting AI follow-up for parking explanation: ${userAnswer}`);
    
    try {
      const res = await fetch("/api/easyParkingTicket/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userAnswer,
          conversationHistory: history,
          questionNumber: 2, // This indicates it's the follow-up question
        }),
      });

      const data = await res.json();
      console.log(`🤖 AI follow-up response:`, data);

      const reply = data?.conversation?.text || data.text || data.reply || "";
      
      // Store score data if provided
      if (data.score) {
        setScore(prev => prev + data.score.points);
        console.log("📊 Received score:", data.score);
      }

      // Update explanation status
      if (data.explanationGiven !== undefined) {
        setExplanationGiven(data.explanationGiven);
      }

      if (reply.trim()) {
        const followUpMessage = {
          role: "assistant",
          content: reply,
          speaker: officer.name,
          timestamp: Date.now(),
        };

        setHistory(prev => [...prev, followUpMessage]);
        await playVoice(reply, officer.name);
        
        // Enable mic for final user response
        setMicActive(true);
        SpeechRecognition.startListening({ continuous: true });
      }
    } catch (error) {
      console.error("Error getting AI follow-up question:", error);
    }
  };

  // Show ticket message (no API call)
  const showTicketMessage = async () => {
    const ticketMessage = "I understand your situation, but I still have to give you the ticket. Please be more careful about parking regulations in the future.";
    console.log(`🎫 Ending with: ${ticketMessage}`);
    
    const finalMessage = {
      role: "assistant",
      content: ticketMessage,
      speaker: officer.name,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, finalMessage]);
    await playVoice(ticketMessage, officer.name);
  };

  // Play audio from TTS
  const playVoice = async (text: string, speaker: string) => {
    console.log(`🎵 Starting TTS for ${speaker}:`, text);
    
    // Stop mic while officer speaks
    SpeechRecognition.stopListening();
    setMicActive(false);
    
    try {
      setSpeakingIndex(0);
      await playTtsAudioOrBrowser(text, currentAudioRef, () =>
        fetch("/api/easyParkingTicket/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: officer.voice }),
        })
      );
      console.log(`✅ Audio finished for ${speaker}`);
    } catch (error) {
      console.error(`❌ playVoice error for ${speaker}:`, error);
    } finally {
      setSpeakingIndex(null);
    }
  };


  // Handle mute/unmute
  const handleMute = () => {
    if (micActive) {
      SpeechRecognition.stopListening();
      setMicActive(false);
    } else {
      SpeechRecognition.startListening({ 
        continuous: true,
        interimResults: false,
        language: 'en-US'
      });
      setMicActive(true);
    }
  };

  // Complete audio and microphone shutdown
  const completeAudioShutdown = () => {
    cancelBrowserSpeech();
    // Stop speech recognition completely
    SpeechRecognition.stopListening();
    if (SpeechRecognition.abortListening) {
      SpeechRecognition.abortListening(); // Force kill recognition session
    }
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.src = "";
      currentAudioRef.current.load(); // Force reset of audio element
      currentAudioRef.current = null;
    }
    
    // Reset all mic-related states
    setMicActive(false);
    setSpeakingIndex(null);
    resetTranscript();
  };

  // Stop conversation
  const handleStopConversation = () => {
    completeAudioShutdown();
    setConversationStarted(false);
    endConversation();
  };

  const endConversation = async () => {
    // Ensure complete audio shutdown when ending conversation
    completeAudioShutdown();
    
    setPhase("completed");
    setConversationStarted(false);
    
    // Calculate score based on participation (simple scoring for easy level)
    const participationScore = Math.min(20, Math.max(5, score + 10)); // Bonus for completing conversation
    setScore(participationScore);
    
    // Generate final feedback
    const finalFeedback = {
      feedback: `Good job handling this parking situation! You communicated respectfully with the officer and ${explanationGiven ? 'provided a clear explanation for your parking' : 'engaged professionally throughout the interaction'}. This demonstrates good conflict resolution skills.`,
      score: participationScore,
      maxScore: 20
    };
    
    setFeedback(finalFeedback);
    setShowCompletion(true);

    // Save the score
    try {
      saveScenarioScore({
        cardId: "Easy Parking Ticket",
        score: participationScore,
        maxScore: 20
      });
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const generateReport = () => {
    if (!feedback) return;
    
    const reportData = {
      title: "Easy Parking Ticket Report",
      scenario: "Parking Violation Practice",
      completionDate: new Date().toLocaleDateString(),
      score: score,
      maxScore: maxScore,
      feedback: feedback.feedback,
      conversationHistory: history,
    };

    generatePDFReport(reportData);
  };

  if (loading) {
    return (
      <div className="bg-white">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gray-100">
      {/* Background layer */}
      <div className="absolute inset-0 z-[0] opacity-70 overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/backgrounds/parkingBg.png')",
            filter: 'blur(3px) brightness(1.1)',
            transform: 'scale(1.1)'
          }}
        ></div>
      </div>
      
      <div className="relative z-[2]">
        
        {showCompletion && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
          />
        )}

        <ScenarioWelcomeModal
          open={showIntroPopup}
          imageSrc="/cards/parking-ticket.png"
          imageAlt="Parking Ticket"
          title="Parking Ticket Explanation"
          description={
            <>
              You&apos;ve just received a parking ticket and the parking officer is approaching you.
              You need to explain that you couldn&apos;t find any available parking spots. This is a
              simple conversation to practice explaining a common situation.
            </>
          }
          bulletPoints={[
            "You were looking for parking for 15 minutes",
            "All legal spots were taken",
            "You had an important appointment",
            "Explain your situation respectfully",
          ]}
          ctaLabel="Talk to Officer"
          onStart={startConversation}
        />

        {conversationStarted && !showCompletion && (
          <ScenarioChatLayout
            chatScrollRef={chatScrollRef}
            finalTranscript={finalTranscript}
            interimTranscript={interimTranscript}
            listening={listening}
            micActive={micActive}
            headerSlot={
              <div className="mx-auto w-full max-w-2xl shrink-0 space-y-3">
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md sm:text-sm">
                    Question: {questionNumber}/2
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md sm:text-sm">
                    Score: {score}/{maxScore}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md sm:text-sm ${
                      explanationGiven
                        ? "bg-green-500/20 text-green-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    Explanation: {explanationGiven ? "✅ Given" : "⏳ Needed"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                      <Image
                        src={officer.avatar}
                        alt={officer.name}
                        width={64}
                        height={64}
                        className={`h-full w-full rounded-full object-cover ring-2 ${
                          speakingIndex === 0
                            ? "animate-pulse ring-green-400"
                            : "ring-white/40"
                        } transition-all`}
                      />
                      {speakingIndex === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <SoundWave speaking={true} />
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-white sm:text-lg">{officer.name}</h3>
                      <p className="text-xs text-blue-200 sm:text-sm">{officer.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            }
            hintText={
              micActive
                ? "🎤 Speak naturally — transcription updates above in real time."
                : "👂 Unmute to respond to the officer."
            }
            audioHelpSlot={<AudioTestStrip />}
            controlsSlot={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleMute}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                >
                  {micActive ? "🔇 Mute" : "🎤 Unmute"}
                </button>
                <button
                  type="button"
                  onClick={handleStopConversation}
                  className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                >
                  🛑 End conversation
                </button>
              </div>
            }
          >
            {history.map((message, idx) => (
              <div
                key={idx}
                className={`mx-auto w-full max-w-lg rounded-2xl px-4 py-3 text-center shadow-sm ${
                  message.role === "assistant"
                    ? "bg-blue-600/35 text-white ring-1 ring-blue-400/25"
                    : "bg-emerald-600/35 text-white ring-1 ring-emerald-400/25"
                }`}
              >
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
                  {message.role === "assistant" && (
                    <Image
                      src={officer.avatar}
                      alt={officer.name}
                      width={28}
                      height={28}
                      className="shrink-0 rounded-full"
                    />
                  )}
                  <div className="min-w-0 flex-1 text-center">
                    <p className="mb-1 text-xs font-semibold opacity-90">
                      {message.role === "assistant" ? officer.name : "You"}
                    </p>
                    <p className="text-sm leading-relaxed sm:text-[15px]">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                      You
                    </div>
                  )}
                </div>
              </div>
            ))}
          </ScenarioChatLayout>
        )}

        {/* Completion Screen */}
        {showCompletion && feedback && (
          <div className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
               style={{
                 backgroundImage: "url('/backgrounds/parkingBg.png')",
               }}>
            {/* Dark overlay for better readability */}
            <div className="absolute inset-0 bg-black/70 z-0"></div>
            
            {/* Confetti */}
            <Confetti className="w-full h-full z-10" />
            
            {/* Content */}
            <div className="relative z-20 max-w-4xl w-full px-4">
              <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-6">
                {explanationGiven ? '🎉 Well Explained!' : '👍 Good Effort!'}
              </h2>
              
              {/* Score Grid - Standardized design */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-6 border border-green-400/20">
                  <h3 className="text-2xl font-bold text-green-300 mb-2">Score</h3>
                  <p className="text-3xl font-bold text-white">{score}/{maxScore}</p>
                </div>
                <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-400/20">
                  <h3 className="text-2xl font-bold text-blue-300 mb-2">Percentage</h3>
                  <p className="text-3xl font-bold text-white">{Math.round((score/maxScore) * 100)}%</p>
                </div>
                <div className="bg-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
                  <h3 className="text-2xl font-bold text-purple-300 mb-2">Communication</h3>
                  <p className="text-3xl font-bold text-white">{explanationGiven ? '✅' : '⏳'}</p>
                </div>
              </div>

              {/* Feedback Display */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">📊 Your Performance</h3>
                <p className="text-white text-sm leading-relaxed">{feedback.feedback}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={generateReport}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg border border-blue-400/30"
                >
                  📄 Download Report
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg border border-green-400/30"
                >
                  🏠 Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
