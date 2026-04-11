"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Loader from "@/app/components/loader/page";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import SoundWave from "@/app/components/soundWave/page";
import { generatePDFReport } from "@/app/utils/pdfGenerator";
import { saveScenarioScore } from "@/utils/scoreManager";
import { unlockWebAudioOnUserGesture } from "@/utils/webAudioUnlock";
import { cancelBrowserSpeech, playTtsAudioOrBrowser } from "@/utils/playTtsWithBrowserFallback";
import ScenarioChatLayout from "@/app/components/scenarioChat/ScenarioChatLayout";
import AudioTestStrip from "@/app/components/scenarioChat/AudioTestStrip";
import ScenarioWelcomeModal from "@/app/components/scenarioChat/ScenarioWelcomeModal";

export default function EasyWeeklyManager() {
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

  // Manager data
  const manager = {
    name: "David Chen",
    title: "Team Manager",
    avatar: "/avatars/weekly-manager-old-man.png",
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
      console.log("🤖 Getting AI follow-up based on user's weekly update...");
      await getAIFollowUpQuestion(response);
      setQuestionNumber(2);
    } else if (questionNumber === 2) {
      // Second answer - end with thank you message (no API call)
      console.log("🎉 Weekly check-in complete, showing thank you message...");
      await showThankYouMessage();
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
    "Good morning! How has your week been going so far? I'd love to hear about what you've been working on.",
    "Hi there! Let's do our weekly check-in. Can you walk me through what you've accomplished this week?",
    "Hello! Time for our weekly update. What have been your main focus areas this week?",
    "Hey! Ready for our weekly sync? Tell me about the projects you've been involved in this week."
  ];

  const startConversation = async () => {
    // Mismo gesto de clic que el usuario: desbloquear audio ANTES de cualquier await
    // (si no, el navegador bloquea audio.play() tras el TTS).
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
    
    // Start with random initial question (no API call)
    const randomQuestion = initialQuestions[Math.floor(Math.random() * initialQuestions.length)];
    console.log(`🎤 Starting with random question: ${randomQuestion}`);
    
    const initialMessage = {
      role: "assistant",
      content: randomQuestion,
      speaker: manager.name,
      timestamp: Date.now(),
    };

    setHistory([initialMessage]);
    await playVoice(randomQuestion, manager.name);
    
    // Enable mic for user response
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  // Get AI follow-up question based on user's weekly update (single API call)
  const getAIFollowUpQuestion = async (userAnswer: string) => {
    console.log(`🤖 Getting AI follow-up for weekly update: ${userAnswer}`);
    
    try {
      const res = await fetch("/api/easyWeeklyManager/respond", {
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

      if (reply.trim()) {
        const followUpMessage = {
          role: "assistant",
          content: reply,
          speaker: manager.name,
          timestamp: Date.now(),
        };

        setHistory(prev => [...prev, followUpMessage]);
        await playVoice(reply, manager.name);
        
        // Enable mic for final user response
        setMicActive(true);
        SpeechRecognition.startListening({ continuous: true });
      }
    } catch (error) {
      console.error("Error getting AI follow-up question:", error);
    }
  };

  // Show thank you message (no API call)
  const showThankYouMessage = async () => {
    const thankYouMessage = "Great work this week! Thanks for the update. Keep up the excellent progress and let me know if you need any support.";
    console.log(`🎉 Ending with: ${thankYouMessage}`);
    
    const finalMessage = {
      role: "assistant",
      content: thankYouMessage,
      speaker: manager.name,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, finalMessage]);
    await playVoice(thankYouMessage, manager.name);
  };

  // Play audio from TTS
  const playVoice = async (text: string, speaker: string) => {
    console.log(`🎵 Starting TTS for ${speaker}:`, text);
    
    // Stop mic while manager speaks
    SpeechRecognition.stopListening();
    setMicActive(false);
    
    try {
      setSpeakingIndex(0);
      await playTtsAudioOrBrowser(text, currentAudioRef, () =>
        fetch("/api/easyWeeklyManager/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: manager.voice }),
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
    const participationScore = Math.min(20, Math.max(5, score + 10)); // Bonus for completing check-in
    setScore(participationScore);
    
    // Generate final feedback
    const finalFeedback = {
      feedback: `Excellent work with your weekly check-in! You provided clear updates about your work and engaged professionally with your manager. This demonstrates strong communication skills and workplace professionalism.`,
      score: participationScore,
      maxScore: 20
    };
    
    setFeedback(finalFeedback);
    setShowCompletion(true);

    // Save the score
    try {
      saveScenarioScore({
        cardId: "Easy Weekly Manager Check",
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
      title: "Easy Weekly Manager Check Report",
      scenario: "Weekly Check-in Practice",
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
            backgroundImage: "url('/backgrounds/weeklyBg.png')",
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
          imageSrc="/cards/weekly-manager.png"
          imageAlt="Weekly Manager Check"
          title="Weekly Check-in with Your Manager"
          description={
            <>
              This is a simple weekly check-in conversation with your manager David.
              You&apos;ll have a brief, friendly conversation about how your week is going.
              Perfect for practicing workplace communication!
            </>
          }
          bulletPoints={[
            "Brief check-in conversation",
            "Friendly workplace environment",
            "Practice professional communication",
            "Share how your week is going",
          ]}
          ctaLabel="Start Weekly Check-in"
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
              <div className="mx-auto flex w-full max-w-2xl shrink-0 flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
                <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-md">
                  Score: {score}/{maxScore}
                </span>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                    <Image
                      src={manager.avatar}
                      alt={manager.name}
                      width={64}
                      height={64}
                      className={`h-full w-full rounded-full object-cover ring-2 ${
                        speakingIndex === 0 ? "animate-pulse ring-green-400" : "ring-white/40"
                      } transition-all`}
                    />
                    {speakingIndex === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <SoundWave speaking={true} />
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-white sm:text-lg">{manager.name}</h3>
                    <p className="text-xs text-blue-200 sm:text-sm">{manager.title}</p>
                  </div>
                </div>
              </div>
            }
            hintText={
              micActive
                ? "🎤 Speak naturally — transcription updates above as you talk."
                : "👂 Unmute the microphone to respond."
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
                      src={manager.avatar}
                      alt={manager.name}
                      width={28}
                      height={28}
                      className="shrink-0 rounded-full"
                    />
                  )}
                  <div className="min-w-0 flex-1 text-center">
                    <p className="mb-1 text-xs font-semibold opacity-90">
                      {message.role === "assistant" ? manager.name : "You"}
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
                 backgroundImage: "url('/backgrounds/weeklyBg.png')",
               }}>
            {/* Dark overlay for better readability */}
            <div className="absolute inset-0 bg-black/70 z-0"></div>
            
            {/* Confetti */}
            <Confetti className="w-full h-full z-10" />
            
            {/* Content */}
            <div className="relative z-20 max-w-4xl w-full px-4">
              <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-6">🎉 Great Check-in!</h2>
              
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
                  <p className="text-3xl font-bold text-white">✅</p>
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
