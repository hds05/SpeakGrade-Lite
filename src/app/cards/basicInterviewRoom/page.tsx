"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
import { scoreInterviewResponse } from "@/app/utils/scoringUtils";

export default function BasicInterviewRoom() {
  const [phase, setPhase] = useState<"intro" | "interview" | "completed">("intro");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [feedback, setFeedback] = useState<{ feedback: string; score: number; maxScore: number } | null>(null);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(20); // Max 20 points for easy interview
  const router = useRouter();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const audioUnlockedRef = useRef(false);

  // Simplified interviewer data - just one interviewer for simplicity
  const interviewer = {
    name: "Sarah Johnson",
    title: "HR Manager",
    avatar: "/avatars/interview-older-woman.png",
    voice: "nova"
  };

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
      stream.getTracks().forEach(track => track.stop()); // Stop the stream
      return true;
    } catch (error) {
      console.error("❌ Microphone permission denied:", error);
      return false;
    }
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

  // Handle user answer automatically
  const processUserAnswer = useCallback(async (answer: string) => {
    console.log("🗣️ User answered:", answer);
    console.log("🎯 Current question number:", questionNumber);
    
    SpeechRecognition.stopListening();
    setMicActive(false);

    setHistory((prev) => [...prev, { role: "user", content: answer }]);

    if (questionNumber === 1) {
      // First answer - get AI follow-up question (single API call)
      console.log("🤖 Getting AI follow-up based on user's answer...");
      await getAIFollowUpQuestion(answer);
      setQuestionNumber(2);
    } else if (questionNumber === 2) {
      // Second answer - end with thank you message (no API call)
      console.log("🎉 Interview complete, showing thank you message...");
      await showThankYouMessage();
      endInterview();
    }
  }, [questionNumber]);

  // Auto-process user response when they stop speaking
  useEffect(() => {
    console.log("🔍 useEffect triggered:", { interviewStarted, micActive, listening, transcript: transcript.substring(0, 50) });
    if (!interviewStarted) {
      console.log("⚠️ Not processing: interviewStarted=", interviewStarted);
      return;
    }
    if (!listening && transcript.trim() && transcript.trim().length > 3) {
      console.log("🎤 Processing user answer:", transcript);
      processUserAnswer(transcript);
      resetTranscript();
    } else {
      console.log("⏳ Waiting - listening:", listening, "transcript length:", transcript.length);
    }
  }, [listening, transcript, interviewStarted, processUserAnswer]);


  // Random initial questions - no API call needed
  const initialQuestions = [
    "Tell me about yourself and your professional background.",
    "How would you describe yourself as a professional?",
    "Walk me through your career journey so far.",
    "What brings you here today? Tell me about yourself."
  ];

  const startInterview = async () => {
    // Request microphone permission first
    const micPermission = await requestMicrophonePermission();
    if (!micPermission) {
      console.log("❌ Cannot start interview without microphone permission");
      return;
    }

    unlockAudio();
    setShowIntroPopup(false);
    setInterviewStarted(true);
    setPhase("interview");
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
      speaker: interviewer.name,
      timestamp: Date.now(),
    };

    setHistory([initialMessage]);
    await playVoice(randomQuestion, interviewer.name);
    
    // Enable mic for user response
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  // Get AI follow-up question based on user's answer (single API call)
  const getAIFollowUpQuestion = async (userAnswer: string) => {
    console.log(`🤖 Getting AI follow-up for: ${userAnswer}`);
    
    try {
      const res = await fetch("/api/basicInterviewRoom/respond", {
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
          speaker: interviewer.name,
          timestamp: Date.now(),
        };

        setHistory(prev => [...prev, followUpMessage]);
        await playVoice(reply, interviewer.name);
        
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
    const thankYouMessage = "Thank you for interviewing with us today. We'll be in touch soon!";
    console.log(`🎉 Ending with: ${thankYouMessage}`);
    
    const finalMessage = {
      role: "assistant",
      content: thankYouMessage,
      speaker: interviewer.name,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, finalMessage]);
    await playVoice(thankYouMessage, interviewer.name);
  };

  // Play audio from TTS
  const playVoice = async (text: string, speaker: string) => {
    console.log(`🎵 Starting TTS for ${speaker}:`, text);
    
    // Stop mic while interviewer speaks
    SpeechRecognition.stopListening();
    setMicActive(false);
    
    try {
      setSpeakingIndex(0);
      
      const res = await fetch("/api/basicInterviewRoom/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "nova" }),
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

  // Stop interview
  const handleStopInterview = () => {
    SpeechRecognition.stopListening();
    setInterviewStarted(false);
    setMicActive(false);
    endInterview();
  };

  const endInterview = async () => {
    setPhase("completed");
    
    // Calculate score based on participation (simple scoring for easy level)
    const participationScore = Math.min(20, Math.max(5, score + 10)); // Bonus for completing interview
    setScore(participationScore);
    
    // Generate final feedback
    const finalFeedback = {
      feedback: `Excellent work completing your first interview! You demonstrated good communication skills by introducing yourself and engaging with follow-up questions. This shows great preparation and confidence for future interviews.`,
      score: participationScore,
      maxScore: 20
    };
    
    setFeedback(finalFeedback);
    setShowCompletion(true);

    // Save the score
    try {
      saveScenarioScore({
        cardId: "Basic Interview Room",
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
      title: "Basic Interview Room Report",
      scenario: "Easy Interview Practice",
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
      {/* Background layer matching interview room */}
      <div className="absolute inset-0 z-[0] opacity-70 overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/backgrounds/interviewBg.png')",
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
                src="/cards/interview-room.png"
                alt="Basic Interview"
                width={200}
                height={150}
                className="mx-auto rounded-xl"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to Your First Interview!
            </h2>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              This is a simplified interview experience perfect for beginners. 
              You'll answer just <strong>2 general questions</strong> from our friendly HR manager. 
              Take your time and speak clearly when responding.
            </p>
            <div className="bg-blue-50 p-4 rounded-xl mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">What to expect:</h3>
              <ul className="text-blue-700 text-left space-y-1">
                <li>• 2 simple interview questions</li>
                <li>• Friendly, supportive environment</li>
                <li>• Practice your speaking skills</li>
                <li>• Receive helpful feedback</li>
              </ul>
            </div>
            <button
              onClick={startInterview}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
            >
              Start My First Interview
            </button>
          </div>
        </div>
      )}

        {/* Main Interview Interface - Using Intermediate Style */}
        {interviewStarted && !showCompletion && (
          <div className="relative z-[2] flex flex-col items-center justify-evenly min-h-screen">
            {/* Progress indicator */}
            <div className="absolute top-4 left-4 z-[200]">
              <div className="bg-black/70 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-white/30">
                <div className="text-white text-center">
                  <div className="text-sm text-gray-300 mb-1">📝 Progress</div>
                  <div className="text-lg font-bold text-green-400">
                    Question {questionNumber} of 2
                  </div>
                </div>
              </div>
            </div>

            {/* Score Display */}
            <div className="absolute top-4 right-4 z-[200]">
              <div className="bg-black/70 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-white/30">
                <div className="text-white text-center">
                  <div className="text-sm text-gray-300 mb-1">🎯 Score</div>
                  <div className="text-lg font-bold text-green-400">
                    {score}/{maxScore}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Interviewer */}
            <div className="flex flex-col items-center z-[100]">
              <div className="w-32 h-32 rounded-full border-4 border-green-400 bg-white shadow-md overflow-hidden">
                <Image
                  src={interviewer.avatar}
                  alt={interviewer.name}
                  width={144}
                  height={144}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                {interviewer.name}
              </span>
              <SoundWave speaking={speakingIndex === 0} />
            </div>

            {/* You */}
            <div className="flex flex-col items-center z-[100] mt-8">
              {micActive && <SoundWave speaking={listening} />}
              <div className="w-28 h-28 mt-2 rounded-full border-4 border-green-400 bg-white shadow-md overflow-hidden">
                <Image
                  src="/avatars/user-avatar.png"
                  alt="You"
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                You
              </span>
              
              {/* Microphone Controls */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleMute}
                  className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors"
                >
                  {micActive ? "🔇 Mute" : "🎤 Unmute"}
                </button>
                <button
                  onClick={handleStopInterview}
                  className="px-6 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors"
                >
                  🛑 End Interview
                </button>
              </div>

              {/* Microphone Status */}
              <div className="mt-2 text-center">
                <div className={`text-xs px-2 py-1 rounded-full ${
                  micActive 
                    ? 'bg-green-600 text-white animate-pulse' 
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {micActive ? '🎤 Listening...' : '🔇 Mic Off'}
                </div>
              </div>

              {/* Debug Info */}
              <div className="mt-2 text-center">
                <div className="text-white text-xs bg-purple-600/70 px-2 py-1 rounded-full">
                  Listening: {listening ? 'Yes' : 'No'}
                </div>
                {transcript && (
                  <div className="text-white text-xs bg-blue-600/70 px-2 py-1 rounded-full mt-1">
                    "{transcript.substring(0, 50)}{transcript.length > 50 ? '...' : ''}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Completion Screen */}
      {showCompletion && feedback && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8">
              <h2 className="text-4xl font-bold text-white mb-6">🎉 Interview Complete!</h2>
              
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
                  <h3 className="text-2xl font-bold text-purple-300 mb-2">Questions</h3>
                  <p className="text-3xl font-bold text-white">2/2</p>
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
