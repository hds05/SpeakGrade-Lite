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

export default function EasyFastFood() {
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
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [feedback, setFeedback] = useState<{ feedback: string; score: number; maxScore: number } | null>(null);
  const router = useRouter();

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const audioUnlockedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fast food worker data
  const worker = {
    name: "Alex Johnson",
    title: "Cashier",
    avatar: "/avatars/fastFood-young-man.png",
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
      // First answer - get general follow-up question (single API call)
      console.log("🤖 Getting follow-up about the order...");
      await getAIFollowUpQuestion(response);
      setQuestionNumber(2);
    } else if (questionNumber === 2) {
      // Second answer - complete the order (no API call)
      console.log("🍟 Completing the order...");
      await showOrderCompletionMessage();
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
    "Hi there! Welcome to FastBite! What can I get started for you today?",
    "Hey! Thanks for choosing FastBite. What would you like to order?",
    "Good afternoon! Welcome in. What sounds good to you today?",
    "Hi! Welcome to FastBite. How can I help you with your order today?"
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
    setOrderPlaced(false);
    
    // Start with random initial question (no API call)
    const randomQuestion = initialQuestions[Math.floor(Math.random() * initialQuestions.length)];
    console.log(`🎤 Starting with random question: ${randomQuestion}`);
    
    const initialMessage = {
      role: "assistant",
      content: randomQuestion,
      speaker: worker.name,
      timestamp: Date.now(),
    };

    setHistory([initialMessage]);
    await playVoice(randomQuestion, worker.name);
    
    // Enable mic for user response
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  // Get AI follow-up question (single API call)
  const getAIFollowUpQuestion = async (userAnswer: string) => {
    console.log(`🤖 Getting follow-up for fast food order: ${userAnswer}`);
    
    try {
      const res = await fetch("/api/easyFastFood/respond", {
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
          speaker: worker.name,
          timestamp: Date.now(),
        };

        setHistory(prev => [...prev, followUpMessage]);
        await playVoice(reply, worker.name);
        
        // Enable mic for final user response
        setMicActive(true);
        SpeechRecognition.startListening({ continuous: true });
      }
    } catch (error) {
      console.error("Error getting AI follow-up question:", error);
      // Fallback to a random follow-up
      const fallbackFollowUps = [
        "Great choice! Would you like to make that a combo with fries and a drink?",
        "Awesome! Any sides or drinks to go with that?",
        "Perfect! Will that be for here or to go?",
        "Nice! Would you like anything else with your order?",
        "Excellent! How about a drink to go with that?"
      ];
      const fallbackMessage = fallbackFollowUps[Math.floor(Math.random() * fallbackFollowUps.length)];
      
      const followUpMessage = {
        role: "assistant",
        content: fallbackMessage,
        speaker: worker.name,
        timestamp: Date.now(),
      };

      setHistory(prev => [...prev, followUpMessage]);
      await playVoice(fallbackMessage, worker.name);
      
      setMicActive(true);
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  // Show order completion message (no API call)
  const showOrderCompletionMessage = async () => {
    const completionMessage = "Perfect! I've got your order ready. Your total is $8.50. Thank you for choosing FastBite!";
    console.log(`🍟 Completing order: ${completionMessage}`);
    
    // Mark the order as placed
    setOrderPlaced(true);
    
    const finalMessage = {
      role: "assistant",
      content: completionMessage,
      speaker: worker.name,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, finalMessage]);
    await playVoice(completionMessage, worker.name);
  };

  // Play audio from TTS
  const playVoice = async (text: string, speaker: string) => {
    console.log(`🎵 Starting TTS for ${speaker}:`, text);
    
    // Stop mic while worker speaks
    SpeechRecognition.stopListening();
    setMicActive(false);
    
    try {
      setSpeakingIndex(0);
      
      const res = await fetch("/api/easyFastFood/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: worker.voice }),
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
            resolve();
          };

          audio.onerror = (err) => {
            console.error(`❌ Audio error for ${speaker}:`, err);
            setSpeakingIndex(null);
            reject(err);
          };

          audio.play().catch((err) => {
            console.error(`❌ Audio play error for ${speaker}:`, err);
            setSpeakingIndex(null);
            reject(err);
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

  // Complete audio and microphone shutdown
  const completeAudioShutdown = () => {
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
    const participationScore = Math.min(20, Math.max(5, score + 12)); // Bonus for completing order
    setScore(participationScore);
    
    // Generate final feedback
    const finalFeedback = {
      feedback: `Great job with your fast food order! You communicated clearly with the cashier and ${orderPlaced ? 'successfully placed your order' : 'engaged professionally throughout the interaction'}. This demonstrates good customer service communication skills.`,
      score: participationScore,
      maxScore: 20
    };
    
    setFeedback(finalFeedback);
    setShowCompletion(true);

    // Save the score
    try {
      saveScenarioScore({
        cardId: "Easy Fast Food",
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
      title: "Easy Fast Food Report",
      scenario: "Fast Food Ordering Practice",
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
            backgroundImage: "url('/backgrounds/fastFoodBg.png')",
            filter: 'blur(3px) brightness(1.1)',
            transform: 'scale(1.1)'
          }}
        ></div>
      </div>

      {/* Intro Screen */}
      {showIntroPopup && phase === "intro" && (
        <div className="relative z-[2] min-h-screen flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mx-4 max-w-2xl">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-6">🍟 Easy Fast Food Order</h1>
              <p className="text-blue-200 text-lg mb-8 leading-relaxed">
                Practice ordering food at a fast food restaurant! This is an easy conversation where you'll:
              </p>
              <ul className="text-blue-200 text-left mb-8 space-y-2">
                <li>• Order your favorite fast food items</li>
                <li>• Answer simple follow-up questions</li>
                <li>• Complete your order successfully</li>
              </ul>
            </div>
            <button
              onClick={startConversation}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Ordering
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
              orderPlaced ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              Order: {orderPlaced ? '✅ Placed' : '⏳ In Progress'}
            </span>
          </div>

          {/* Fast Food Worker */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8">
              <div className="text-center">
                <div className="relative mb-6">
                  <Image
                    src={worker.avatar}
                    alt={worker.name}
                    width={120}
                    height={120}
                    className={`mx-auto rounded-full ring-4 ${
                      speakingIndex === 0 ? 'ring-green-400 animate-pulse' : 'ring-white/30'
                    } transition-all`}
                  />
                  {speakingIndex === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <SoundWave speaking={true} />
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{worker.name}</h3>
                <p className="text-blue-200 text-lg">{worker.title}</p>
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
                        ? "bg-blue-500/20 text-blue-100 mr-8" 
                        : "bg-green-500/20 text-green-100 ml-8"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {message.role === "assistant" && (
                        <Image
                          src={worker.avatar}
                          alt={worker.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1">
                          {message.role === "assistant" ? worker.name : "You"}
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
                <h3 className="text-xl font-semibold text-white mb-2">Your Order</h3>
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
                    🛑 End Order
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Screen */}
      {showCompletion && feedback && (
        <div className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
             style={{
               backgroundImage: "url('/backgrounds/fastFoodBg.png')",
             }}>
          {/* Dark overlay for better readability */}
          <div className="absolute inset-0 bg-black/70 z-0"></div>
          
          {/* Confetti */}
          <Confetti className="w-full h-full z-10" />
          
          {/* Content */}
          <div className="relative z-20 max-w-4xl w-full px-4">
            <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-6">🍟 Order Complete!</h2>
            
            {/* Score Grid - Combined from easy level design */}
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
                <p className="text-3xl font-bold text-white">{orderPlaced ? '✅' : '⏳'}</p>
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
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg border border-green-400/30"
              >
                🏠 Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

