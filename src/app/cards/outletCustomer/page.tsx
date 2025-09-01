"use client";
import { useState, useEffect, useRef } from "react";
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

export default function OutletCustomer() {
  const [phase, setPhase] = useState<"intro" | "briefing" | "main">("intro");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [currentQuestionScore, setCurrentQuestionScore] = useState(0);
  const [issuesResolved, setIssuesResolved] = useState({
    return: false,
    clearance: false,
    giftCard: false,
    priceMatch: false,
  });
  const router = useRouter();

  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const audioUnlockedRef = useRef(false);

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
  useEffect(() => {
    const completed =
      localStorage.getItem("OutletCustomer(easy)_Completed") === "true";
    if (completed) {
      setShowCompletion(true);
    }
  }, []);

  // Completion handler
  const handleCompletion = () => {
    console.log("✅ Outlet Customer completed. Saving to localStorage.");
    
    // Save score using the utility function
    saveScenarioScore({
      cardId: "Outlet Customer Service",
      score: score,
      maxScore: maxScore
    });
    
    setShowCompletion(true);
  };

  // Generate and download PDF report
  const handleDownloadPDF = () => {
    const reportData = {
      title: "Outlet Customer Service Report",
      scenario: "Retail Customer Service Encounter",
      completionDate: new Date().toLocaleDateString(),
      conversationHistory: history,
      score: score,
      maxScore: maxScore,
      feedback: `You completed the retail customer service simulation with a score of ${score}/${maxScore}. This demonstrates your ability to handle customer inquiries professionally.`,
    };

    generatePDFReport(reportData);
  };

  const cashier = { name: "Ryan", image: "/avatars/outlet-young-male.png" };

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

    const cashierGreeting = "Hi there—what can I help you with today?";

    // Add cashier's greeting to the conversation history
    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: cashierGreeting, speaker: "Sarah" },
    ]);

    // Play cashier's greeting voice
    await playVoice(cashierGreeting, "Sarah");

    // Enable mic for user's first response
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });

    // Set time limit (7 minutes for retail encounter)
    conversationTimerRef.current = setTimeout(() => {
      console.log("🛑 Conversation time limit reached. Stopping conversation.");
      handleStopConversation(true);
    }, 7 * 60 * 1000); // 7 minutes
  };

  // Fetch cashier's response
  const getCashierResponse = async (userMessage?: string) => {
    // Don't make API calls if conversation has ended
    if (!conversationStarted) {
      console.log("🛑 Conversation already ended, skipping API call");
      return;
    }

    setLoading(true);
    console.log(`🎤 Getting cashier response for: ${userMessage}`);
    try {
      const res = await fetch("/api/outletCustomer/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMessage || "",
          conversationHistory: history,
          questionCount: questionCount,
          issuesResolved: issuesResolved,
        }),
      });

      const data = await res.json();
      console.log(`🤖 Cashier responded:`, data);

      const reply = data?.conversation?.text || data.text || data.reply || "";
      const scoreData = data?.score || {
        points: 0,
        maxPoints: 1,
        feedback: "",
      };
      const updatedIssues = data?.issuesResolved || issuesResolved;

      if (reply.trim()) {
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: reply, speaker: "Sarah" },
        ]);
        await playVoice(reply, "Sarah");

        // Update scores and issues
        setScore((prev) => prev + scoreData.points);
        setMaxScore((prev) => prev + scoreData.maxPoints);
        setCurrentQuestionScore(scoreData.points);
        setQuestionCount((prev) => prev + 1);
        setIssuesResolved(updatedIssues);

        // Clear current question score after showing it for a moment
        if (scoreData.points > 0) {
          setTimeout(() => setCurrentQuestionScore(0), 3000);
        }

        // Check if conversation should end (after ~10-12 questions or all issues resolved)
        const allResolved = Object.values(updatedIssues).every(
          (resolved) => resolved
        );
        if (allResolved) {
          // Immediately stop conversation when all issues are resolved
          console.log("🎉 All issues resolved! Ending conversation.");
          handleStopConversation(true);
          return; // Don't continue with voice playback or mic activation
        } else if (questionCount >= 11) {
          setTimeout(() => {
            handleStopConversation(true);
          }, 3000); // Normal timeout delay
        }
      } else {
        console.warn("⚠️ No valid text to speak.");
      }

      // Enable mic for user's answer
      setMicActive(true);
      SpeechRecognition.startListening({ continuous: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Play audio from TTS
  const playVoice = async (text: string, speaker: string) => {
    setSpeakingIndex(0); // Only one cashier
    try {
      const res = await fetch("/api/outletCustomer/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speaker }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          console.log(`✅ Finished speaking: ${speaker}`);
          setSpeakingIndex(null);
          resolve();
        };
        audio.onerror = reject;
        audio.play().catch((err) => {
          console.warn("Autoplay blocked, user interaction required:", err);
          setSpeakingIndex(null);
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
    if (!listening && transcript.trim()) {
      processUserAnswer(transcript);
      resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  // Handle user answer
  const processUserAnswer = async (answer: string) => {
    console.log("🗣️ User answered:", answer);
    SpeechRecognition.stopListening();
    setMicActive(false);

    setHistory((prev) => [...prev, { role: "user", content: answer }]);

    // Get cashier's response
    await getCashierResponse(answer);
  };

  // Mute mic manually
  const handleMute = () => {
    if (micActive) {
      SpeechRecognition.stopListening();
      setMicActive(false);
    } else {
      SpeechRecognition.startListening({ continuous: true });
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

    if (isTimeUp || questionCount >= 10) {
      handleCompletion();
      setShowCompletion(true);
    } else {
      // Reset everything for a manual restart
      setShowIntroPopup(true);
      setHistory([]);
      setQuestionCount(0);
      setScore(0);
      setMaxScore(0);
      setCurrentQuestionScore(0);
      setIssuesResolved({
        return: false,
        clearance: false,
        giftCard: false,
        priceMatch: false,
      });
      setPhase("intro");
    }
  };

  const factParagraph = `At around 2:30 PM today, you arrived at the register with: a pair of jeans you purchased last week (you have the receipt), a T-shirt marked down to $15 that scanned at $25, a $20 gift card you want to apply, and a screenshot showing the same jacket at $15 less on the store's website.`;

  const resolvedCount = Object.values(issuesResolved).filter(Boolean).length;

  return (
    <div className="relative w-full min-h-screen  bg-black text-white">

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
                  "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')",
              }}
            >
              {/* Dark overlay - responsive for desktop/laptop */}
              <div className="absolute inset-0 bg-black/80 md:bg-black/68 lg:bg-black/68 xl:bg-black/68 z-0"></div>

              {/* Confetti */}
              {resolvedCount >= 3 && (
                <Confetti className="w-full h-full z-10" />
              )}

              {/* Content */}
              <div className="relative z-20 max-w-2xl w-full px-4">
                <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-4">
                  {resolvedCount === 4
                    ? "🎉 All Issues Resolved!"
                    : "🛒 Shopping Complete!"}
                </h2>

                {/* Score Display */}
                <div className="mb-6 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    🏆 Your Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {score}/{maxScore}
                      </div>
                      <div className="text-sm text-gray-300">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {maxScore > 0
                          ? Math.round((score / maxScore) * 100)
                          : 0}
                        %
                      </div>
                      <div className="text-sm text-gray-300">Accuracy</div>
                    </div>
                  </div>

                  {/* Issues resolved */}
                  <div className="mt-4 p-3 rounded-lg border-2 border-dashed">
                    <h4 className="text-white font-semibold mb-2">
                      Issues Resolved: {resolvedCount}/4
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div
                        className={`${
                          issuesResolved.return
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {issuesResolved.return ? "✅" : "❌"} Jeans Return
                      </div>
                      <div
                        className={`${
                          issuesResolved.clearance
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {issuesResolved.clearance ? "✅" : "❌"} T-shirt Price
                        Fix
                      </div>
                      <div
                        className={`${
                          issuesResolved.giftCard
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {issuesResolved.giftCard ? "✅" : "❌"} Gift Card
                        Applied
                      </div>
                      <div
                        className={`${
                          issuesResolved.priceMatch
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {issuesResolved.priceMatch ? "✅" : "❌"} Price Match
                      </div>
                    </div>
                  </div>

                  {/* Performance feedback */}
                  <div className="mt-4 text-center">
                    {(() => {
                      if (resolvedCount === 4)
                        return (
                          <div className="text-green-300">
                            🌟 Perfect! Excellent customer service
                            communication!
                          </div>
                        );
                      if (resolvedCount === 3)
                        return (
                          <div className="text-green-300">
                            ✨ Great job! Most issues handled successfully!
                          </div>
                        );
                      if (resolvedCount === 2)
                        return (
                          <div className="text-yellow-300">
                            👍 Good work! Some issues still need attention!
                          </div>
                        );
                      if (resolvedCount === 1)
                        return (
                          <div className="text-orange-300">
                            📚 Room for improvement. Be more specific!
                          </div>
                        );
                      return (
                        <div className="text-red-300">
                          💪 Keep practicing! Focus on clear explanations!
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <p className="text-sm sm:text-lg text-white mb-6">
                  {resolvedCount >= 3
                    ? "Excellent customer service skills! You handled the retail situation professionally! 🛍️"
                    : "Keep practicing! Clear communication is key in retail situations. 💪"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full transition duration-300 shadow-lg hover:bg-blue-700"
                    onClick={handleDownloadPDF}
                  >
                    📄 Download Report
                  </button>
                  <button
                    className="px-6 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-green-500 hover:text-white"
                    onClick={() => router.push("/")}
                  >
                    Finish Shopping
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
                      🛒 Fashion Outlet Customer Service
                    </h2>
                    <div className="text-left mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">
                        🎭 Your Role:
                      </h3>
                      <p className="text-gray-700 text-sm mb-4">
                        You're a customer at Fashion Outlet with multiple issues
                        that need to be resolved at checkout.
                      </p>

                      <h3 className="font-semibold text-gray-800 mb-2">
                        🛍️ Your Shopping Situation:
                      </h3>
                      <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 mb-4">
                        {factParagraph}
                      </div>

                      <h3 className="font-semibold text-gray-800 mb-2">
                        📋 Your Tasks:
                      </h3>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        <li>Return jeans from last week (have receipt)</li>
                        <li>Fix T-shirt price (marked $15, scanned $25)</li>
                        <li>Apply your $20 gift card to purchase</li>
                        <li>
                          Request price match for jacket (have screenshot)
                        </li>
                        <li>Be clear and organized with your requests</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setShowIntroPopup(false);
                        setPhase("main");
                      }}
                      className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 mr-4"
                    >
                      Start Shopping
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-br from-violet-400 via-blue-300 to-pink-200">
                <div
                  className="relative w-full min-h-screen bg-gray-100"
                >
                  {/* Layer 2 - Enhanced modern background extension */}
                  <div className="absolute inset-0 z-[0] opacity-70 overflow-hidden">
                    <div 
                      className="w-full h-full bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: "url('/backgrounds/outletBg.png')",
                        filter: 'blur(3px) brightness(1.1)',
                        transform: 'scale(1.1)'
                      }}
                    ></div>
                  </div>

                  {/* Layer 1 - Main background (90% size on desktop) */}
                  <div className="absolute inset-0 z-[1] flex items-center justify-center">
                    <div 
                      className="w-[70%] h-full md:w-[80%] lg:w-[85%] xl:w-[85%] bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: "url('/backgrounds/outletBg.png')",
                        minHeight: '100vh'
                      }}
                    ></div>
                  </div>
                  <div className="relative z-[2] flex flex-col items-center justify-evenly min-h-screen">
                    {/* Cashier */}
                    <div className="flex flex-col items-center z-[100] mt-8">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-green-500 bg-white shadow-md overflow-hidden">
                        <Image
                          src={cashier.image}
                          alt={cashier.name}
                          width={160}
                          height={160}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <span className="mt-2 text-lg font-medium text-white bg-black rounded-full px-4 py-2 ring-2 ring-white">
                        {cashier.name} - Cashier 🛒
                      </span>
                      <SoundWave speaking={speakingIndex === 0} />
                    </div>

                    {/* You (Customer) */}
                    <div className="flex flex-col items-center z-[100] mt-8">
                      {micActive && <SoundWave speaking={listening} />}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 mt-2 rounded-full border-4 border-blue-400 bg-white shadow-md overflow-hidden">
                        <Image
                          src="/avatars/self-icon.png"
                          alt="You"
                          width={112}
                          height={112}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                        You - Customer 🛍️
                      </span>

                      {/* Controls */}
                      <div className="flex gap-3 mt-4">
                        {!conversationStarted ? (
                          <button
                            onClick={startConversation}
                            className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg"
                          >
                            Approach Cashier
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
                              Leave Store
                            </button>
                          </>
                        )}
                      </div>

                      {/* Progress indicator */}
                      {conversationStarted && (
                        <div className="mt-4 text-center">
                          <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full mb-2">
                            Questions: {questionCount}/12
                          </div>
                          <div className="text-white text-sm bg-green-600/70 px-3 py-1 rounded-full mb-2">
                            Score: {score}/{maxScore} points
                          </div>
                          <div className="text-white text-xs bg-blue-500/70 px-2 py-1 rounded-full mb-2">
                            Issues Resolved: {resolvedCount}/4
                          </div>
                          {currentQuestionScore > 0 && (
                            <div className="text-green-300 text-xs mt-1 animate-pulse">
                              +{currentQuestionScore} point
                              {currentQuestionScore !== 1 ? "s" : ""}!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
