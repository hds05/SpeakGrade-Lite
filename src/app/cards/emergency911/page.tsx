"use client";

import { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import { generatePDFReport } from "@/app/utils/pdfGenerator";

export default function Emergency911() {
  const [callActive, setCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const INITIAL_TIME = 3 * 60; // 3 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [aiReply, setAiReply] = useState("");
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const {
    transcript = "",
    resetTranscript,
    listening,
  } = useSpeechRecognition();

  const isProcessingRef = useRef(false);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const router = useRouter();

  // ✅ Load completion state from localStorage
  useEffect(() => {
    const completed = localStorage.getItem("Emergency911(easy)_Completed") === "true";
    if (completed) {
      setShowCompletion(true);
    }
  }, []);

  // 🔊 Start/Stop call
  const toggleCall = async () => {
    if (callActive) {
      endCall();
    } else {
      if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
        alert(
          "Your browser does not support speech recognition. Please use Chrome."
        );
        return;
      }
      const permissionGranted = await getMicPermission();
      if (!permissionGranted) return;

      setCallActive(true);
      setTimeLeft(INITIAL_TIME);
      setConversationHistory([]);
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });

      const greeting = "911, what's your emergency?";
      handleAiReply(greeting);
      setConversationHistory([{ role: "assistant", content: greeting }]);
    }
  };

  const endCall = () => {
    setCallActive(false);
    SpeechRecognition.stopListening();
    resetTranscript();
  };

  // 🎤 Restart listening if dropped
  useEffect(() => {
    if (callActive && !listening) {
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    }
  }, [listening, callActive]);

  // 🕒 Timer
  useEffect(() => {
    if (!callActive) return;
  
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    return () => clearInterval(interval);
  }, [callActive]);
  

  // ✅ Completion handler
  const handleCompletion = () => {
    const completedBefore = localStorage.getItem("Emergency911(easy)_Completed") === "true";

    if (!completedBefore) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      localStorage.setItem("Emergency911(easy)_Completed", "true");
    }

    setShowCompletion(true);
    endCall();
  };

  // Generate and download PDF report
  const handleDownloadPDF = () => {
    const reportData = {
      title: "Emergency 911 Report",
      scenario: "Emergency Dispatcher Simulation",
      completionDate: new Date().toLocaleDateString(),
      conversationHistory: conversationHistory,
      feedback: "You have successfully completed the emergency 911 dispatcher simulation. This demonstrates your ability to communicate effectively in emergency situations.",
    };
    
    generatePDFReport(reportData);
  };

  // 🎙️ When user stops talking
  useEffect(() => {
    if (!callActive || listening || !transcript.trim()) return;
    processUserInput(transcript.trim());
    resetTranscript();
  }, [listening, transcript]);

  const getMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.error("Mic denied:", err);
      alert("Microphone access is required.");
      return false;
    }
  };

  const processUserInput = async (text: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setConversationHistory((prev) => [
      ...prev,
      { role: "user", content: text },
    ]);

    try {
      const res = await fetch("/api/emergency911/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          conversationHistory: [
            ...conversationHistory,
            { role: "user", content: text },
          ],
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        handleAiReply(data.reply);
      }
    } catch (err) {
      console.error("Error sending to /respond:", err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleAiReply = async (text: string) => {
    setAiReply(text);
    try {
      const res = await fetch("/api/emergency911/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        audioQueueRef.current.shift();
        if (audioQueueRef.current.length > 0) {
          audioQueueRef.current[0].play();
        }
      };

      audioQueueRef.current.push(audio);
      if (audioQueueRef.current.length === 1 && !muted) {
        audio.play();
      }
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  const handleMuteAndSend = () => {
    if (transcript.trim()) processUserInput(transcript.trim());
    resetTranscript();

    if (!muted) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    }
    setMuted((prev) => !prev);
  };
  // ================= RETURN ==================
  return (
    <div className="relative w-full min-h-screen  text-white bg-black">
      {showCompletion ? (
        <div
          className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
          style={{
            backgroundImage:
              "url('https://cdn.prod.website-files.com/61a05ff14c09ecacc06eec05/6720e94e1cd203b14c045522_%20Interview-Notes.jpg')",
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/80 z-0"></div>

          {/* Confetti */}
          <Confetti className="w-full h-full z-10" />

          {/* Content */}
          <div className="relative z-20 max-w-2xl w-full px-4">
            <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-4">
              🎉 Conversation Completed!
            </h2>
            <p className="text-sm sm:text-lg text-white mb-6">
              Great job! You’ve finished Emergency 911.😁
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full transition duration-300 shadow-lg hover:bg-blue-700"
                onClick={handleDownloadPDF}
              >
                📄 Download Report
              </button>
              <button
                className="px-6 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-violet-500 hover:text-white"
                onClick={() => router.push("/")}
              >
                End
              </button>
            </div>
          </div>
        </div>
      ) : (
<>
  <div  className="flex flex-col items-center justify-center min-h-screen gap-8 text-white relative overflow-hidden font-mono rounded-full"
  style={{
    backgroundImage:
      'url("/emergency-911.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}>
    {/* 🚨 Animated siren background */}
    <div className="absolute inset-0 z-0 animate-backgroundPulse bg-[linear-gradient(270deg,_#dc2626,_#4f46e5,_#dc2626)] bg-[length:600%_600%] opacity-100 mix-blend-overlay"></div>

    {/* 🚔 Glassmorphism container */}
    <div className="relative z-10 backdrop-blur-xl bg-white/10 border-2 border-white/20 shadow-[0_0_60px_rgba(255,0,0,0.4)] rounded-3xl p-8 max-w-2xl w-[90%] flex flex-col gap-6 items-center justify-center transition-all duration-500">

      {/* ⏱ Timer */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-md sm:text-3xl font-bold tracking-widest text-white"
      >
        ⏱ Time Left:{" "}
        <span className={timeLeft < 10 ? "text-red-400 animate-pulse" : "text-green-400"}>
          {timeLeft}s
        </span>
      </motion.div>

      {/* 💬 AI Reply */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 rounded-xl bg-gradient-to-br from-red-900 to-blue-900 border border-white/30 shadow-xl text-white text-center w-full"
      >
        {aiReply ? (
          <p className="text-lg font-medium leading-relaxed">{aiReply}</p>
        ) : (
          <p className="italic text-gray-300">Dispatcher is waiting...</p>
        )}
      </motion.div>

      {/* 🎙️ Listening indicator */}
      <div className="flex items-center gap-3 text-lg text-white">
        <div
          className={`w-4 h-4 rounded-full border-2 border-white ${
            listening ? "bg-green-400 animate-ping" : "bg-red-600"
          }`}
        />
        <span>🎙️ Listening: {listening ? "✅ Yes" : "❌ No"}</span>
      </div>

      {/* 📝 Transcript */}
      <div className="text-gray-200 text-sm italic text-center max-w-md">
        {transcript ? `"${transcript}"` : "You can speak now..."}
      </div>

      {/* 🔘 Buttons */}
      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={toggleCall}
          className="px-6 py-3 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold rounded-xl shadow-md transition transform hover:scale-105 duration-300"
        >
          {callActive ? "🚨 End Call" : "📞 Start Emergency Call"}
        </button>

        {callActive && (
          <button
            onClick={handleMuteAndSend}
            className="px-6 py-3 bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white font-semibold rounded-xl shadow-md transition transform hover:scale-105 duration-300"
          >
            {muted ? "🔊 Unmute" : "🔇 Mute & Send"}
          </button>
        )}
      </div>
    </div>
  </div>

  {/* 🌈 Add style inside your component */}
  <style jsx>{`
    @keyframes backgroundPulse {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    .animate-backgroundPulse {
      animation: backgroundPulse 6s ease-in-out infinite;
    }
  `}</style>
</>

      )}
    </div>
  );
}
