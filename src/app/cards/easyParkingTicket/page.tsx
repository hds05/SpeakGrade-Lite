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

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const audioUnlockedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

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

  // Unlock audio context on first user interaction
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    const dummy = new Audio();
    dummy.src = "";
    dummy.play().catch(() => {});
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
    // Request microphone permission first
    const micPermission = await requestMicrophonePermission();
    if (!micPermission) {
      console.log("❌ Cannot start conversation without microphone permission");
      return;
    }

    unlockAudio();
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
      
      const res = await fetch("/api/easyParkingTicket/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: officer.voice }),
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        return new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            console.log(`✅ Audio finished for ${speaker}`);
            setSpeakingIndex(null);
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            resolve();
          };

          audio.onerror = (e) => {
            console.error(`❌ Audio error for ${speaker}:`, e);
            setSpeakingIndex(null);
            if (currentAudioRef.current === audio) reject(e);
          };

          audio.play().catch((e) => {
            console.error(`❌ Audio play failed for ${speaker}:`, e);
            if (currentAudioRef.current === audio) reject(e);
          });
        });
      }
    } catch (error) {
      console.error(`❌ playVoice error for ${speaker}:`, error);
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

  // Stop conversation
  const handleStopConversation = () => {
    SpeechRecognition.stopListening();
    setConversationStarted(false);
    setMicActive(false);
    endConversation();
  };

  const endConversation = async () => {
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

        {/* Intro Popup */}
        {showIntroPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 text-center shadow-2xl">
              <div className="mb-6">
                <Image
                  src="/cards/parking-ticket.png"
                  alt="Parking Ticket"
                  width={200}
                  height={150}
                  className="mx-auto rounded-xl"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Parking Ticket Explanation
              </h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                You've just received a parking ticket and the parking officer is approaching you. 
                You need to explain that you couldn't find any available parking spots. 
                This is a simple conversation to practice explaining a common situation.
              </p>
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Your situation:</h3>
                <ul className="text-blue-700 text-left space-y-1">
                  <li>• You were looking for parking for 15 minutes</li>
                  <li>• All legal spots were taken</li>
                  <li>• You had an important appointment</li>
                  <li>• Explain your situation respectfully</li>
                </ul>
              </div>
              <button
                onClick={startConversation}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
              >
                Talk to Officer
              </button>
            </div>
          </div>
        )}

        {/* Main Conversation Interface */}
        {conversationStarted && !showCompletion && (
          <div className="container mx-auto px-4 py-8">
            {/* Status indicators */}
            <div className="mb-8 flex justify-center gap-4">
              <span className="bg-white/20 backdrop-blur-md rounded-full px-6 py-2 text-white font-semibold">
                Question: {questionNumber}/2
              </span>
              <span className="bg-white/20 backdrop-blur-md rounded-full px-6 py-2 text-white font-semibold">
                Score: {score}/{maxScore}
              </span>
              <span className={`backdrop-blur-md rounded-full px-6 py-2 font-semibold ${
                explanationGiven ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                Explanation: {explanationGiven ? '✅ Given' : '⏳ Needed'}
              </span>
            </div>

            {/* Officer */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Image
                      src={officer.avatar}
                      alt={officer.name}
                      width={120}
                      height={120}
                      className={`mx-auto rounded-full ring-4 ${
                        speakingIndex === 0 ? 'ring-green-400 animate-pulse' : 'ring-white/30'
                      } transition-all`}
                    />
                    {speakingIndex === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <SoundWave />
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{officer.name}</h3>
                  <p className="text-blue-200 text-lg">{officer.title}</p>
                </div>
              </div>

              {/* Conversation History */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-8 max-h-96 overflow-y-auto">
                <h3 className="text-xl font-semibold text-white mb-4">Conversation</h3>
                <div className="space-y-4">
                  {history.map((message, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl ${
                        message.role === "assistant"
                          ? "bg-blue-600/30 text-white ml-0 mr-8"
                          : "bg-green-600/30 text-white ml-8 mr-0"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {message.role === "assistant" && (
                          <Image
                            src={officer.avatar}
                            alt={officer.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-sm mb-1">
                            {message.role === "assistant" ? officer.name : "You"}
                          </p>
                          <p>{message.content}</p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">You</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Interface */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Your Response</h3>
                  <p className="text-blue-200">Use the controls below to manage your microphone</p>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  {/* Microphone Controls */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleMute}
                      className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors"
                    >
                      {micActive ? "🔇 Mute" : "🎤 Unmute"}
                    </button>
                    <button
                      onClick={handleStopConversation}
                      className="px-6 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors"
                    >
                      🛑 End Conversation
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-white text-lg font-semibold mb-2">
                      {micActive ? "🎤 Speak naturally - I'm listening!" : "👂 Microphone is muted"}
                    </p>
                    {transcript && (
                      <div className="bg-white/20 rounded-xl p-4 mb-4">
                        <p className="text-white">"{transcript}"</p>
                      </div>
                    )}
                    {loading && (
                      <p className="text-blue-200 animate-pulse">Processing your response...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Screen */}
        {showCompletion && feedback && (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8">
                <h2 className="text-4xl font-bold text-white mb-6">
                  {explanationGiven ? '🎉 Well Explained!' : '👍 Good Effort!'}
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-green-500/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-green-300 mb-2">Score</h3>
                    <p className="text-3xl font-bold text-white">{score}/{maxScore}</p>
                  </div>
                  <div className="bg-blue-500/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-blue-300 mb-2">Percentage</h3>
                    <p className="text-3xl font-bold text-white">{Math.round((score/maxScore) * 100)}%</p>
                  </div>
                  <div className="bg-purple-500/20 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-purple-300 mb-2">Communication</h3>
                    <p className="text-3xl font-bold text-white">{explanationGiven ? '✅' : '⏳'}</p>
                  </div>
                </div>

                <div className="bg-white/20 rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Feedback</h3>
                  <p className="text-blue-100 leading-relaxed">{feedback.feedback}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={generateReport}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
                  >
                    📄 Download Report
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🏠 Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
