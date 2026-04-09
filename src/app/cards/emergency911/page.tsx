"use client";

import { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { generatePDFReport } from "@/app/utils/pdfGenerator";
import { unlockWebAudioOnUserGesture } from "@/utils/webAudioUnlock";
import { playAudioFromObjectUrl } from "@/utils/playAudioFromUrl";
import AudioTestStrip from "@/app/components/scenarioChat/AudioTestStrip";

export default function Emergency911() {
  const [callActive, setCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const INITIAL_TIME = 75; // 45 seconds for emergency call simulation
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [aiReply, setAiReply] = useState("");
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const {
    transcript = "",
    interimTranscript = "",
    finalTranscript = "",
    resetTranscript,
    listening,
  } = useSpeechRecognition();

  const isProcessingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const finalMessagePlayingRef = useRef(false);
  const router = useRouter();

  // Helper function to check if error is meaningful
  const isEmptyError = (err: any): boolean => {
    return !err ||
      (typeof err === 'object' && Object.keys(err).length === 0) ||
      err.toString() === '[object Object]' ||
      err.toString() === '{}';
  };

  // Preprocess text for better TTS pronunciation
  const preprocessTextForTTS = (text: string): string => {
    return text
      // Replace 911 with "nine one one" for proper pronunciation
      .replace(/\b911\b/g, 'nine one one')
      // Replace other emergency numbers if needed
      .replace(/\b9-1-1\b/g, 'nine one one')
      // Replace dispatcher-specific terms
      .replace(/\bdispatcher\b/gi, 'dispatcher')
      .replace(/\bemergency\b/gi, 'emergency')
      // Replace common address numbers that might be misread
      .replace(/\b(\d)-(\d)-(\d)\b/g, '$1 $2 $3')
      // Replace phone number patterns to be read digit by digit for clarity
      .replace(/\b(\d{3})-(\d{3})-(\d{4})\b/g, (match, area, prefix, number) => {
        return `${area.split('').join(' ')} ${prefix.split('').join(' ')} ${number.split('').join(' ')}`;
      })
      // Replace other common emergency/medical patterns that need special pronunciation
      .replace(/\bCPR\b/gi, 'C P R')
      .replace(/\bEMS\b/gi, 'E M S')
      .replace(/\bEMT\b/gi, 'E M T')
      .replace(/\bETA\b/gi, 'E T A')
      .replace(/\bDOA\b/gi, 'D O A')
      // Address common numbers that might be misread
      .replace(/\b(\d{1,4})\s+(st|nd|rd|th)\b/gi, (match, num, suffix) => {
        return `${num} ${suffix}`;
      })
      // Handle street names with numbers
      .replace(/\b(\d+)(st|nd|rd|th)\s+street\b/gi, (match, num, suffix) => {
        return `${num} ${suffix} street`;
      });
  };

  // ✅ Load completion state from localStorage
  useEffect(() => {
    const completed = localStorage.getItem("Emergency911(easy)_Completed") === "true";
    if (completed) {
      setShowCompletion(true);
    }
  }, []);

  // 🔊 Play final message when completion screen shows (from timer end)
  useEffect(() => {
    if (showCompletion && !localStorage.getItem("Emergency911(easy)_Completed_Before") && !finalMessagePlayingRef.current) {
      // This is a fresh completion, play the final message
      const finalMessage = "Help is on the way, they will arrive very soon";
      setAiReply(finalMessage);

      // Mark that we've shown this completion to avoid replaying on refresh
      localStorage.setItem("Emergency911(easy)_Completed_Before", "true");
      finalMessagePlayingRef.current = true;

      // Play final message after a short delay to ensure screen is shown
      setTimeout(async () => {
        try {
          await playFinalMessage(finalMessage);
        } catch (error) {
          console.error("Error playing final message:", error);
        } finally {
          finalMessagePlayingRef.current = false;
        }
      }, 500);
    }
  }, [showCompletion]);

  // 🔊 Start/Stop call
  const toggleCall = async () => {
    if (callActive) {
      // Manual end call - stop everything immediately
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.onended = null;
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }
      finalMessagePlayingRef.current = false;
      endCall();
    } else {
      if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
        alert(
          "Your browser does not support speech recognition. Please use Chrome."
        );
        return;
      }
      unlockWebAudioOnUserGesture();
      const permissionGranted = await getMicPermission();
      if (!permissionGranted) return;

      setCallActive(true);
      setTimeLeft(INITIAL_TIME);
      setConversationHistory([]);
      setQuestionCount(0);
      setMuted(true); // Start muted, will unmute after first AI response
      setShowCompletion(false); // Ensure completion screen is hidden

      // Clear the completion marker for fresh final message
      localStorage.removeItem("Emergency911(easy)_Completed_Before");
      finalMessagePlayingRef.current = false;

      const greeting = "911, what's your emergency?"; // Will be processed to "nine one one" by TTS preprocessing
      handleAiReply(greeting);
      setConversationHistory([{ role: "assistant", content: greeting, speaker: "911 Dispatcher" }]);
    }
  };

  const endCall = () => {
    setCallActive(false);
    SpeechRecognition.stopListening();
    resetTranscript();

    // Only stop audio if we're not showing completion (final message might be playing)
    if (!showCompletion && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
  };

  // 🕒 Timer 
  useEffect(() => {
    if (!callActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Complete the call when time is up
          handleCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callActive, questionCount]);


  // ✅ Completion handler
  const handleCompletion = () => {
    console.log("✅ Emergency 911 completed. Stopping all audio and showing completion screen.");

    // Stop any ongoing audio immediately
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }

    // Stop mic and processing
    setMuted(true);
    SpeechRecognition.stopListening();
    isProcessingRef.current = false;
    setCallActive(false);

    // Mark scenario as completed
    localStorage.setItem("Emergency911(easy)_Completed", "true");

    // Show completion screen immediately
    const completedBefore = localStorage.getItem("Emergency911(easy)_Completed") === "true";
    if (!completedBefore) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    setShowCompletion(true);
    // Final message will be played by useEffect when showCompletion becomes true
  };

  // Generate and download PDF report
  const handleDownloadPDF = () => {
    const reportData = {
      title: "Emergency 911 Report",
      scenario: "Emergency Dispatcher Simulation",
      completionDate: new Date().toLocaleDateString(),
      conversationHistory: conversationHistory,
      feedback: `You completed the emergency 911 dispatcher simulation. You successfully practiced emergency communication during the ${INITIAL_TIME} second simulation.`,
    };

    generatePDFReport(reportData);
  };

  // 🎙️ When user stops talking - automatic like parking ticket
  useEffect(() => {
    if (!callActive || listening || !transcript.trim()) return;
    processUserInput(transcript.trim());
    resetTranscript();
  }, [listening, transcript, callActive]);

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

    // Stop mic while processing
    setMuted(true);
    SpeechRecognition.stopListening();

    setConversationHistory((prev) => [
      ...prev,
      { role: "user", content: text },
    ]);

    try {
      // Add timeout for API request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

      const res = await fetch("/api/emergency911/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          conversationHistory: [
            ...conversationHistory,
            { role: "user", content: text },
          ],
          questionCount: questionCount,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.conversation?.text) {
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.conversation.text, speaker: data.conversation.speaker },
        ]);

        // Update question count
        setQuestionCount(prev => prev + 1);

        // Play the AI response - mic will be re-enabled in handleAiReply after audio finishes
        await handleAiReply(data.conversation.text);
      } else {
        // If no response, restart mic anyway with longer delay
        setTimeout(() => {
          if (callActive) {
            setMuted(false);
            SpeechRecognition.startListening({
              continuous: true,
              interimResults: false,
              language: "en-US"
            });
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Error sending to /respond:", err);
      if (err instanceof Error && err.name === 'AbortError') {
        console.log("API request timed out");
      }
      // Restart mic on error with longer delay
      setTimeout(() => {
        if (callActive) {
          setMuted(false);
          SpeechRecognition.startListening({
            continuous: true,
            interimResults: false,
            language: "en-US"
          });
        }
      }, 2000);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleAiReply = async (text: string) => {
    setAiReply(text);

    // Stop any previous audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }

    try {
      // Preprocess text for better TTS pronunciation
      const processedText = preprocessTextForTTS(text);
      console.log("🗣️ TTS text processed:", text, "→", processedText);

      // Add timeout for TTS request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch("/api/emergency911/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: processedText }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`TTS failed: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      try {
        await playAudioFromObjectUrl(url, currentAudioRef);
        console.log("🔊 AI finished speaking, will restart mic after delay");
      } catch (e) {
        if (!isEmptyError(e)) {
          console.error("Audio play failed:", e);
        }
      }

      setTimeout(() => {
        if (callActive) {
          console.log("🎙️ Restarting microphone after AI speech");
          setMuted(false);
          SpeechRecognition.startListening({
            continuous: true,
            interimResults: false,
            language: "en-US",
          });
        }
      }, 2500);
    } catch (err) {
      // Only log meaningful errors
      if (err && err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log("🔊 TTS request aborted (expected during call end)");
        } else {
          console.error("TTS error:", err.message || err);
        }
      } else if (!isEmptyError(err)) {
        console.error("TTS error:", err);
      } else {
        console.log("🔊 TTS interrupted (expected during call end)");
      }
      // Don't auto-restart mic here - handled in processUserInput
    }
  };

  // Play final message without restarting mic
  const playFinalMessage = async (text: string): Promise<void> => {
    console.log("🔊 Playing final emergency message:", text);

    // Ensure no other audio is playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }

    try {
      // Preprocess final message text for better TTS pronunciation
      const processedText = preprocessTextForTTS(text);
      console.log("🗣️ Final message TTS text processed:", text, "→", processedText);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("/api/emergency911/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: processedText }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Final TTS failed: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      try {
        await playAudioFromObjectUrl(url, currentAudioRef);
        console.log("✅ Final emergency message completed");
      } catch (e) {
        if (!isEmptyError(e)) {
          console.error("Final message play failed:", e);
        }
      }
    } catch (err) {
      // Only log meaningful errors for final message
      if (err && err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log("🔊 Final message TTS aborted");
        } else {
          console.error("Final message TTS error:", err.message || err);
        }
      } else if (!isEmptyError(err)) {
        console.error("Final message TTS error:", err);
      } else {
        console.log("🔊 Final message TTS interrupted");
      }
    }
  };

  const handleMuteAndSend = () => {
    // Always send transcript if there's content
    if (transcript.trim()) {
      processUserInput(transcript.trim());
      resetTranscript();
    }

    // Stop listening and set muted state
    SpeechRecognition.stopListening();
    setMuted(true);
  };

  // ================= RETURN ==================
  return (
    <div className="relative w-full min-h-screen  text-white bg-black">
      {/* Layer 2 - Enhanced modern background extension */}
      <div className="absolute inset-0 z-0 opacity-70 overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/backgrounds/emergencyBg.png')",
            filter: 'blur(3px) brightness(1.1)',
            transform: 'scale(1.1)'
          }}
        ></div>
      </div>
      {showCompletion ? (
        <div
          className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
          style={{
            backgroundImage: "url('/cards/emergency-911.png')",
          }}
        >
          {/* Dark overlay - responsive for desktop/laptop */}
          <div className="absolute inset-0 bg-black/80 md:bg-black/68 lg:bg-black/68 xl:bg-black/68 z-0"></div>

          {/* Confetti */}
          <Confetti className="w-full h-full z-10" />

          {/* Content */}
          <div className="relative z-20 max-w-2xl w-full px-4">
            <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-4">
              🎉 Emergency Call Completed!
            </h2>

            {/* Simple completion message */}
            <div className="mb-6 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">📞 Call Summary</h3>
              <div className="text-center">
                <div className="text-lg text-gray-300 mb-4">
                  You successfully completed your emergency 911 call simulation.
                </div>
                <div className="text-sm text-gray-400">
                  Questions exchanged: {questionCount}
                </div>
                <div className="text-sm text-gray-400">
                  Call duration: {INITIAL_TIME} seconds
                </div>
              </div>
            </div>

            <p className="text-sm sm:text-lg text-white mb-6">
              Great job! You've finished the emergency 911 simulation. Thank you for participating! 😁
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
                onClick={() => router.push("/dashboard")}
              >
                End Session
              </button>

            </div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-screen overflow-hidden">


          {/* 🚨 Animated siren overlay - above everything */}
          <div className="absolute inset-0 z-[3] animate-backgroundPulse bg-[linear-gradient(270deg,_#dc2626,_#4f46e5,_#dc2626)] bg-[length:600%_600%] opacity-30 mix-blend-overlay pointer-events-none"></div>

          <div className="relative z-[2] flex flex-col items-center justify-center min-h-screen gap-8 text-white font-mono">

            {/* 🚔 Floating content - no background */}
            <div className="relative z-[4] max-w-2xl w-[90%] flex flex-col gap-6 items-center justify-center transition-all duration-500">

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

              {/* 💬 AI Reply with Dispatcher Avatar */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 rounded-xl bg-gradient-to-br from-red-900/40 to-blue-900/40 backdrop-blur-sm border border-white/20 shadow-xl text-white w-full"
              >
                <div className="flex items-start gap-4">
                  {/* Dispatcher Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-red-400 bg-white shadow-md overflow-hidden">
                      <Image
                        src="/avatars/emergency-young-woman.png"
                        alt="911 Dispatcher"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-red-300 font-semibold">
                      911 Dispatcher
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 text-left">
                    {aiReply ? (
                      <p className="text-lg font-medium leading-relaxed">{aiReply}</p>
                    ) : (
                      <p className="italic text-gray-300">Dispatcher is waiting...</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* 🎙️ Listening indicator */}
              <div className="flex items-center gap-3 text-lg text-white">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white ${listening && !muted ? "bg-green-400 animate-ping" : "bg-red-600"
                    }`}
                />
                <span>🎙️ Microphone: {
                  currentAudioRef.current ? "🔊 AI Speaking" :
                    listening && !muted ? "✅ Listening" : "❌ Muted"
                }</span>
              </div>

              {/* 📝 Transcript en vivo (mismo patrón que otros escenarios) */}
              <div className="max-w-md rounded-xl border border-rose-500/35 bg-black/30 px-4 py-3 text-center text-sm text-white">
                {listening && !muted && (finalTranscript || interimTranscript) ? (
                  <p>
                    <span>{finalTranscript}</span>
                    {interimTranscript ? <span className="italic text-rose-100/90"> {interimTranscript}</span> : null}
                  </p>
                ) : transcript ? (
                  <p className="italic text-gray-200">&quot;{transcript}&quot;</p>
                ) : currentAudioRef.current ? (
                  <p className="text-gray-300">AI is speaking, please wait…</p>
                ) : muted ? (
                  <p className="text-gray-300">Waiting for dispatcher…</p>
                ) : (
                  <p className="text-gray-300">You can speak now…</p>
                )}
              </div>

              {/* Progress indicator */}
              {callActive && (
                <div className="text-center">
                  <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full mb-2">
                    Questions: {questionCount}
                  </div>
                  <div className="text-white text-xs bg-blue-500/70 px-2 py-1 rounded-full">
                    Call in progress...
                  </div>
                </div>
              )}

              <div className="w-full max-w-md">
                <AudioTestStrip />
              </div>

              {/* 🔘 Buttons */}
              <div className="flex w-full flex-wrap justify-center gap-4">
                <button
                  onClick={toggleCall}
                  className="px-6 py-3 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold rounded-xl shadow-md transition transform hover:scale-105 duration-300"
                >
                  {callActive ? "🚨 End Call" : "📞 Start Emergency Call"}
                </button>

                {callActive && (
                  <>
                    {!muted ? (
                      <button
                        onClick={handleMuteAndSend}
                        className="px-6 py-3 bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white font-semibold rounded-xl shadow-md transition transform hover:scale-105 duration-300"
                      >
                        🔇 Mute & Send
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMuted(false);
                          SpeechRecognition.startListening({ continuous: true, language: "en-US" });
                        }}
                        className="px-6 py-3 bg-gradient-to-br from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-semibold rounded-xl shadow-md transition transform hover:scale-105 duration-300"
                        disabled={currentAudioRef.current !== null}
                      >
                        🔊 Unmute
                      </button>
                    )}
                  </>
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
        </div>
      )}
    </div>
  );
}
