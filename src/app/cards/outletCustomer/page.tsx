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
import { unlockWebAudioOnUserGesture } from "@/utils/webAudioUnlock";
import { playTtsAudioOrBrowser } from "@/utils/playTtsWithBrowserFallback";
import ScenarioChatLayout from "@/app/components/scenarioChat/ScenarioChatLayout";
import AudioTestStrip from "@/app/components/scenarioChat/AudioTestStrip";

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

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    unlockWebAudioOnUserGesture();
    audioUnlockedRef.current = true;
    console.log("🔓 Audio context unlocked");
  };

  // Start conversation
  const startConversation = async () => {
    unlockAudio();
    setShowIntroPopup(false);
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

  const playVoice = async (text: string, speaker: string) => {
    setSpeakingIndex(0);
    try {
      await playTtsAudioOrBrowser(text, currentAudioRef, () =>
        fetch("/api/outletCustomer/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, speaker }),
        })
      );
      console.log(`✅ Finished speaking: ${speaker}`);
    } catch (e) {
      console.error("playVoice error:", e);
    } finally {
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

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history, interimTranscript, finalTranscript]);

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
                backgroundImage: "url('/cards/outlet-customer.png')",
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
                    onClick={() => router.push("/dashboard")}
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
                <div className="relative w-full min-h-screen bg-gray-100">
                  <div className="absolute inset-0 z-[0] opacity-70 overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: "url('/backgrounds/outletBg.png')",
                        filter: "blur(3px) brightness(1.1)",
                        transform: "scale(1.1)",
                      }}
                    />
                  </div>

                  {!conversationStarted ? (
                    <div className="relative z-[2] flex min-h-screen flex-col items-center justify-center px-4 py-12">
                      <div className="mb-8 flex flex-col items-center">
                        <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-green-500 bg-white shadow-md sm:h-44 sm:w-44">
                          <Image
                            src={cashier.image}
                            alt={cashier.name}
                            width={176}
                            height={176}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="mt-3 rounded-full bg-black px-4 py-2 text-lg font-medium text-white ring-2 ring-white">
                          {cashier.name} — Cashier
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={startConversation}
                        className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-green-700"
                      >
                        Approach Cashier
                      </button>
                    </div>
                  ) : (
                    <div className="relative z-[2] w-full">
                    <ScenarioChatLayout
                      chatScrollRef={chatScrollRef}
                      finalTranscript={finalTranscript}
                      interimTranscript={interimTranscript}
                      listening={listening}
                      micActive={micActive}
                      headerSlot={
                        <div className="mx-auto flex w-full max-w-2xl shrink-0 flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md sm:text-sm">
                              Q: {questionCount}/12
                            </span>
                            <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-green-300 backdrop-blur-md sm:text-sm">
                              Score: {score}/{maxScore}
                            </span>
                            <span className="rounded-full bg-blue-500/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md sm:text-sm">
                              Issues: {resolvedCount}/4
                            </span>
                            {currentQuestionScore > 0 && (
                              <span className="animate-pulse rounded-full bg-emerald-500/80 px-2 py-1 text-[10px] font-semibold text-white sm:text-xs">
                                +{currentQuestionScore} pt
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                              <Image
                                src={cashier.image}
                                alt={cashier.name}
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
                              <h3 className="text-base font-bold text-white sm:text-lg">{cashier.name}</h3>
                              <p className="text-xs text-blue-200 sm:text-sm">Cashier</p>
                            </div>
                          </div>
                        </div>
                      }
                      hintText={
                        micActive
                          ? "Speak naturally — transcription updates above as you talk."
                          : "Unmute the microphone to respond."
                      }
                      audioHelpSlot={<AudioTestStrip />}
                      controlsSlot={
                        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
                          {micActive && <SoundWave speaking={listening} />}
                          <button
                            type="button"
                            onClick={handleMute}
                            className="relative z-10 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                          >
                            {micActive ? "Mute" : "Unmute"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStopConversation(false)}
                            className="relative z-10 rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                          >
                            Leave store
                          </button>
                        </div>
                      }
                    >
                      {history.map((message: { role: string; content: string }, idx: number) => (
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
                                src={cashier.image}
                                alt={cashier.name}
                                width={28}
                                height={28}
                                className="shrink-0 rounded-full"
                              />
                            )}
                            <div className="min-w-0 flex-1 text-center">
                              <p className="mb-1 text-xs font-semibold opacity-90">
                                {message.role === "assistant" ? cashier.name : "You"}
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
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
