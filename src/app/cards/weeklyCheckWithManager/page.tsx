"use client";
import React, { useState, useEffect, useRef } from "react";
import Header from "@/app/components/header/page";
import Loader from "@/app/components/loader/page";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import SoundWave from "@/app/components/soundWave/page";
import { generatePDFReport } from "@/app/utils/pdfGenerator";
import { saveScenarioScore } from "@/utils/scoreManager";

interface Message {
  role: "user" | "assistant";
  content: string;
  speaker: string;
}

interface ScoreData {
  points: number;
  maxPoints: number;
  feedback: string;
}

export default function WeeklyCheck() {
  const [phase, setPhase] = useState<string>("intro");
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showIntroPopup, setShowIntroPopup] = useState<boolean>(true);
  const [conversationStarted, setConversationStarted] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [showCompletion, setShowCompletion] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [currentQuestionScore, setCurrentQuestionScore] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const router = useRouter();

  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const audioUnlockedRef = useRef<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Browser doesn't support speech recognition.");
    }
  }, []);

  // Load completion state from localStorage
//   useEffect(() => {
//     const completed = localStorage.getItem("WeeklyCheck_Completed") === "true";
//     if (completed) {
//       setShowCompletion(true);
//     }
//   }, []);

  // Completion handler
  const handleCompletion = () => {
    console.log("✅ Weekly Check with Manager completed. Saving to localStorage.");
    
    // Save score using the utility function
    saveScenarioScore({
      cardId: "Weekly Check with Manager",
      score: score,
      maxScore: maxScore
    });
    
    setShowCompletion(true);
  };

  // Generate and download PDF report
  const handleDownloadPDF = () => {
    const reportData = {
      title: "Weekly Check Report",
      scenario: "Weekly Manager Check-in",
      completionDate: new Date().toLocaleDateString(),
      conversationHistory: history,
      score: score,
      maxScore: maxScore,
      feedback: `You completed the weekly check-in simulation with a score of ${score}/${maxScore}. This demonstrates your ability to communicate effectively with your manager.`,
    };
    
    generatePDFReport(reportData);
  };

  const manager = { name: "Charlie", image: "/old-man-avatar.png" };

  // Unlock audio context on first user interaction
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    const dummy = new Audio();
    dummy.src = "";
    dummy.play().catch(() => {});
    audioUnlockedRef.current = true;
    console.log("🔓 Audio context unlocked");
  };

  // Start conversation
  const startConversation = async () => {
    unlockAudio();
    setConversationStarted(true);
    setMicActive(false);
    setPhase("main");

    const managerIntro =
      "Good morning! I hope you had a productive week. Let's go through your weekly update. What did you work on this week related to ads?";

    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: managerIntro, speaker: "Charlie" },
    ]);

    await playVoice(managerIntro, "Charlie");

    // Wait a bit before starting speech recognition
    setTimeout(() => {
      setMicActive(true);
      SpeechRecognition.startListening({ 
        continuous: true,
        interimResults: false,
        language: 'en-US'
      });
    }, 2000);

    conversationTimerRef.current = setTimeout(() => {
      console.log("🛑 Conversation time limit reached. Stopping conversation.");
      handleStopConversation(true);
    }, 2 * 60 * 1000); // Increased to 2 minutes
  };

  // Fetch manager's response
  const getManagerResponse = async (userMessage: string) => {
    if (!conversationStarted) {
      console.log("🛑 Conversation already ended, skipping API call");
      return;
    }

    setLoading(true);
    console.log(`🎤 Getting manager response for: ${userMessage}`);
    try {
      const res = await fetch("/api/weeklyCheckWithManager/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMessage || "",
          conversationHistory: history,
          questionCount: questionCount,
        }),
      });

      if (!res.ok) {
        throw new Error(`API call failed: ${res.status}`);
      }

      const data = await res.json();
      console.log(`🤖 Manager responded:`, data);

      const reply = data?.conversation?.text || data.text || data.reply || "";
      const scoreData: ScoreData = data?.score || { points: 0, maxPoints: 1, feedback: "" };

      if (reply.trim()) {
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: reply, speaker: "Charlie" },
        ]);
        
        // Play the response first
        await playVoice(reply, "Charlie");

        // Update scoring
        setScore((prev) => prev + scoreData.points);
        setMaxScore((prev) => prev + scoreData.maxPoints);
        setCurrentQuestionScore(scoreData.points);
        setQuestionCount((prev) => prev + 1);

        // Show score feedback
        if (scoreData.points > 0) {
          setTimeout(() => setCurrentQuestionScore(0), 3000);
        }

        // Check if conversation should end
        if (questionCount >= 5) { // Changed to 5 since we increment after
          setTimeout(() => {
            handleStopConversation(true);
          }, 3000);
        } else {
          // Restart listening for next question
          setTimeout(() => {
            setMicActive(true);
            SpeechRecognition.startListening({ 
              continuous: true,
              interimResults: false,
              language: 'en-US'
            });
          }, 1000); // Small delay to ensure audio finished
        }
      } else {
        console.warn("⚠️ No valid text to speak.");
        // Restart listening even if no response
        setMicActive(true);
        SpeechRecognition.startListening({ 
          continuous: true,
          interimResults: false,
          language: 'en-US'
        });
      }
    } catch (err) {
      console.error("Error getting manager response:", err);
      // Restart listening on error
      setMicActive(true);
      SpeechRecognition.startListening({ 
        continuous: true,
        interimResults: false,
        language: 'en-US'
      });
    } finally {
      setLoading(false);
    }
  };

  // Play audio from TTS
  const playVoice = async (text: string, speaker: string) => {
    // Stop any currently playing audio first
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    
    setSpeakingIndex(0);
    try {
      console.log(`🎙️ Playing voice for ${speaker}:`, text.substring(0, 50) + "...");
      
      const res = await fetch("/api/weeklyCheckWithManager/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speaker }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`TTS failed: ${res.status} - ${errorText}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      // Store reference to current audio
      currentAudioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          console.log(`✅ Finished speaking: ${speaker}`);
          setSpeakingIndex(null);
          URL.revokeObjectURL(url);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          resolve();
        };
        audio.onerror = (e) => {
          console.error("Audio error:", e);
          setSpeakingIndex(null);
          URL.revokeObjectURL(url);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch((err) => {
          console.warn("Autoplay blocked, user interaction required:", err);
          setSpeakingIndex(null);
          URL.revokeObjectURL(url);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          reject(err);
        });
      });
    } catch (e) {
      console.error("playVoice error:", e);
      setSpeakingIndex(null);
    }
  };

  // When user stops speaking
  useEffect(() => {
    if (!listening && transcript.trim() && transcript.trim().length > 3 && !isProcessing) {
      console.log("🎤 Processing transcript:", transcript);
      setIsProcessing(true);
      processUserAnswer(transcript);
      resetTranscript();
    }
  }, [listening, transcript]);

  // Handle user answer
  const processUserAnswer = async (answer: string) => {
    if (!answer.trim() || answer.trim().length < 3) return;
    
    console.log("🗣️ User answered:", answer);
    SpeechRecognition.stopListening();
    setMicActive(false);

    setHistory((prev) => [...prev, { role: "user", content: answer, speaker: "You" }]);

    try {
      await getManagerResponse(answer);
    } finally {
      setIsProcessing(false);
    }
  };

  // Mute mic manually
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

  // Stop entire conversation
  const handleStopConversation = (isTimeUp = false) => {
    SpeechRecognition.stopListening();
    setConversationStarted(false);
    setMicActive(false);

    if (conversationTimerRef.current) {
      clearTimeout(conversationTimerRef.current);
      conversationTimerRef.current = null;
    }

    if (isTimeUp || questionCount >= 4) { // Reduced from 6 to 4 questions
      handleCompletion();
      setShowCompletion(true);
    } else {
      setShowIntroPopup(true);
      setHistory([]);
      setQuestionCount(0);
      setScore(0);
      setMaxScore(0);
      setCurrentQuestionScore(0);
      setPhase("intro");
    }
  };

  const weeklyUpdateParagraph = `This week I made three Facebook ads for our new clothing campaign. I worked with the design team to choose pictures and write short texts for each ad. I also posted four photos on Instagram to promote our summer sale. I checked how last week's ads performed — one ad had 25% more clicks than usual. I did a short survey online to see what styles people liked most, and I found that bright colors were the top choice. On Friday, I made a short two-page report with these results for the manager.`;

  return (
    <div className="relative w-full min-h-screen bg-black text-white">
      {loading && !conversationStarted ? (
        <div className="bg-white">
          <Loader />
        </div>
      ) : (
        <>
          {showCompletion ? (
            <div
              className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80')",
              }}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/80 z-0"></div>

              {/* Confetti */}
              <Confetti className="w-full h-full z-10" />

              {/* Content */}
              <div className="relative z-20 max-w-2xl w-full px-4">
                <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-4">
                  🎉 Weekly Check-in Completed!
                </h2>
                
                {/* Score Display */}
                <div className="mb-6 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <h3 className="text-xl font-semibold text-white mb-4">📊 Your Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {score}/{maxScore}
                      </div>
                      <div className="text-sm text-gray-300">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-300">Accuracy</div>
                    </div>
                  </div>
                  
                  {/* Performance feedback */}
                  <div className="mt-4 text-center">
                    {(() => {
                      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                      if (percentage >= 90) return <div className="text-green-300">🌟 Excellent! Outstanding workplace communication!</div>;
                      if (percentage >= 75) return <div className="text-green-300">✨ Great job! Strong professional communication!</div>;
                      if (percentage >= 60) return <div className="text-yellow-300">👍 Good work! Keep practicing for improvement!</div>;
                      if (percentage >= 40) return <div className="text-orange-300">📚 Room for improvement. Review the details more carefully!</div>;
                      return <div className="text-red-300">💪 Keep practicing! Focus on the specific work details!</div>;
                    })()}
                  </div>
                </div>

                <p className="text-sm sm:text-lg text-white mb-6">
                  Excellent work! You've completed your workplace conversation practice. Your communication skills are improving! 👔
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full transition duration-300 shadow-lg hover:bg-blue-700"
                    onClick={handleDownloadPDF}
                  >
                    📄 Download Report
                  </button>
                  <button
                    className="px-6 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-blue-500 hover:text-white"
                    onClick={() => router.push("/")}
                  >
                    End Session
                  </button>

                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Intro Popup */}
              {showIntroPopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
                  <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 text-center max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl text-gray-700 font-bold mb-4">
                      💼 Weekly Check-in with Your Manager
                    </h2>
                    <div className="text-left mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">📋 Your Role:</h3>
                      <p className="text-gray-700 text-sm mb-4">
                        You are a marketing employee. Your manager wants to discuss your weekly update.
                      </p>
                      
                      <h3 className="font-semibold text-gray-800 mb-2">📝 Your Weekly Update:</h3>
                      <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 mb-4">
                        {weeklyUpdateParagraph}
                      </div>
                      
                      <h3 className="font-semibold text-gray-800 mb-2">🎯 Instructions:</h3>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        <li>Read and remember the details from your weekly update above</li>
                        <li>Answer your manager's questions based on this information</li>
                        <li>Your manager will ask follow-up questions about your work</li>
                        <li>Be professional but natural in your responses</li>
                      </ul>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowIntroPopup(false);
                        setPhase("main");
                      }}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 mr-4"
                    >
                      I'm Ready
                    </button>
                  </div>
                </div>
              )}

              <div
                className="relative bg-contain bg-no-repeat bg-center w-full bg-gray-100
                       bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80')]
                       bg-cover"
              >
                <div className="absolute bg-black/40 w-full h-full z-[1]" />
                <div className="flex flex-col items-center justify-evenly min-h-screen">
                  {/* Manager */}
                  <div className="flex flex-col items-center z-[100] mt-8">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-blue-400 bg-white shadow-md overflow-hidden">
                      <img
                        src={manager.image}
                        alt={manager.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="mt-2 text-lg font-medium text-white bg-black rounded-full px-4 py-2 ring-2 ring-white">
                      {manager.name} - Your Manager
                    </span>
                    <SoundWave speaking={speakingIndex === 0} />
                  </div>

                  {/* You */}
                  <div className="flex flex-col items-center z-[100] mt-8">
                    {micActive && <SoundWave speaking={listening} />}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 mt-2 rounded-full border-4 border-green-400 bg-white shadow-md overflow-hidden">
                      <img
                        src="/self-icon.png"
                        alt="You"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-2 ring-2 ring-white">
                      You - Marketing Employee
                    </span>

                    {/* Controls */}
                    <div className="flex gap-3 mt-4">
                      {!conversationStarted ? (
                        <button
                          onClick={startConversation}
                          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg"
                        >
                          Start Check-in
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleMute}
                            className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
                          >
                            {micActive ? "Mute" : "Unmute"}
                          </button>
                          <button
                            onClick={() => handleStopConversation(false)}
                            className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                          >
                            End Check-in
                          </button>
                        </>
                      )}
                    </div>

                    {/* Progress indicator */}
                    {conversationStarted && (
                      <div className="mt-4 text-center">
                        <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full mb-2">
                          Questions: {questionCount}/6
                        </div>
                        <div className="text-white text-sm bg-green-600/70 px-3 py-1 rounded-full">
                          Score: {score}/{maxScore} points
                        </div>
                        {currentQuestionScore > 0 && (
                          <div className="text-green-300 text-xs mt-1 animate-pulse">
                            +{currentQuestionScore} point{currentQuestionScore !== 1 ? 's' : ''}!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
