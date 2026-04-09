"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import SoundWave from "@/app/components/soundWave/page";
import { unlockWebAudioOnUserGesture } from "@/utils/webAudioUnlock";
import { playAudioFromObjectUrl } from "@/utils/playAudioFromUrl";
import ScenarioChatLayout from "@/app/components/scenarioChat/ScenarioChatLayout";
import AudioTestStrip from "@/app/components/scenarioChat/AudioTestStrip";

const mike = {
  name: "Mike",
  title: "Cashier",
  avatar: "/avatars/fastFood-young-man.png",
};

export default function OrderMixUp() {
  const [phase, setPhase] = useState<"intro" | "main">("intro");
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [issuesResolved, setIssuesResolved] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const router = useRouter();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const audioUnlockedRef = useRef(false);
  const historyRef = useRef(conversationHistory);
  const endingConversationRef = useRef(false);

  const {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();

  historyRef.current = conversationHistory;

  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Browser doesn't support speech recognition.");
    }
  }, []);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [conversationHistory, interimTranscript, finalTranscript]);

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    unlockWebAudioOnUserGesture();
    audioUnlockedRef.current = true;
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      alert("Microphone permission is required. Please allow access and try again.");
      return false;
    }
  };

  const completeAudioShutdown = () => {
    SpeechRecognition.stopListening();
    if (SpeechRecognition.abortListening) {
      SpeechRecognition.abortListening();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.src = "";
      currentAudioRef.current.load();
      currentAudioRef.current = null;
    }
    setMicActive(false);
    setSpeakingIndex(null);
    resetTranscript();
  };

  const playMikeResponse = async (text: string) => {
    SpeechRecognition.stopListening();
    setMicActive(false);
    try {
      setSpeakingIndex(0);
      const response = await fetch("/api/orderMixUp/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error("TTS failed:", await response.text());
        return;
      }

      const audioBlob = await response.blob();
      if (audioBlob.size < 100) {
        console.error("TTS blob invalid; check ElevenLabs / API key");
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      await playAudioFromObjectUrl(audioUrl, currentAudioRef);
    } catch (e) {
      console.error("Error playing audio:", e);
    } finally {
      setSpeakingIndex(null);
    }
  };

  const saveScore = (scoreOverride?: number) => {
    const scoreToSave = scoreOverride ?? currentScore;
    try {
      const scoreData = {
        cardId: "Order Mix-Up",
        score: scoreToSave,
        maxScore: 100,
        percentage: Math.round((scoreToSave / 100) * 100),
        completed: true,
        lastUpdated: new Date().toISOString(),
      };

      const existingScores = JSON.parse(
        localStorage.getItem("speakGrade_scores") || "[]"
      );
      const scoreIndex = existingScores.findIndex(
        (s: { cardId: string }) => s.cardId === scoreData.cardId
      );

      if (scoreIndex >= 0) {
        existingScores[scoreIndex] = scoreData;
      } else {
        existingScores.push(scoreData);
      }

      localStorage.setItem("speakGrade_scores", JSON.stringify(existingScores));
      window.dispatchEvent(
        new CustomEvent("scoresUpdated", { detail: scoreData })
      );
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const handleUserInput = useCallback(
    async (userMessage: string) => {
      if (endingConversationRef.current || isLoading || !userMessage.trim())
        return;

      setIsLoading(true);
      SpeechRecognition.stopListening();
      setMicActive(false);

      const prev = historyRef.current;
      const newHistory = [...prev, { role: "user", content: userMessage }];
      setConversationHistory(newHistory);

      try {
        const response = await fetch("/api/orderMixUp/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory: newHistory,
            currentScore,
            questionCount,
            issuesResolved,
          }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const data = await response.json();
        const nextIssues = data.issuesResolved || issuesResolved;
        const nextQ = data.questionCount ?? questionCount + 1;
        const nextScore = data.score ?? currentScore;

        setConversationHistory((h) => [
          ...h,
          { role: "assistant", content: data.response },
        ]);
        setCurrentScore(nextScore);
        setQuestionCount(nextQ);
        setIssuesResolved(nextIssues);

        await playMikeResponse(data.response);

        const done =
          data.conversationComplete ||
          nextIssues.length >= 4 ||
          nextQ >= 9;

        if (done) {
          endingConversationRef.current = true;
          SpeechRecognition.stopListening();
          setMicActive(false);
          setTimeout(() => {
            completeAudioShutdown();
            setShowCompletion(true);
            saveScore(nextScore);
          }, 2000);
        } else {
          setMicActive(true);
          SpeechRecognition.startListening({
            continuous: true,
            interimResults: false,
            language: "en-US",
          });
        }
      } catch (error) {
        console.error("Error in conversation:", error);
        setMicActive(true);
        SpeechRecognition.startListening({
          continuous: true,
          interimResults: false,
          language: "en-US",
        });
      } finally {
        setIsLoading(false);
        resetTranscript();
      }
    },
    [
      isLoading,
      currentScore,
      questionCount,
      issuesResolved,
      resetTranscript,
    ]
  );

  useEffect(() => {
    if (
      !conversationStarted ||
      showCompletion ||
      isLoading ||
      endingConversationRef.current
    )
      return;
    if (!listening && transcript.trim() && transcript.trim().length > 3) {
      void handleUserInput(transcript);
    }
  }, [
    listening,
    transcript,
    conversationStarted,
    showCompletion,
    isLoading,
    handleUserInput,
  ]);

  const handleStart = async () => {
    unlockAudio();
    const ok = await requestMicrophonePermission();
    if (!ok) return;

    setShowIntroPopup(false);
    setConversationStarted(true);
    setPhase("main");
    resetTranscript();

    const greeting = "Hi there—what can I help you with today?";
    setConversationHistory([{ role: "assistant", content: greeting }]);
    await playMikeResponse(greeting);

    setMicActive(true);
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: false,
      language: "en-US",
    });
  };

  const handleMute = () => {
    if (micActive) {
      SpeechRecognition.stopListening();
      setMicActive(false);
    } else {
      SpeechRecognition.startListening({
        continuous: true,
        interimResults: false,
        language: "en-US",
      });
      setMicActive(true);
    }
  };

  const handleStopConversation = () => {
    completeAudioShutdown();
    setConversationStarted(false);
    saveScore();
    setShowCompletion(true);
  };

  if (showCompletion) {
    return (
      <div
        className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-10 text-center sm:py-20 animate__animated animate__fadeInUp"
        style={{
          backgroundImage: "url('/backgrounds/fastFoodBg.png')",
        }}
      >
        <div className="absolute inset-0 z-0 bg-black/70"></div>

        <Confetti className="z-10 h-full w-full" />

        <div className="relative z-20 w-full max-w-4xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-green-400 sm:text-4xl">
            Order issue resolved
          </h2>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-green-400/20 bg-green-500/20 p-6 backdrop-blur-md">
              <h3 className="mb-2 text-2xl font-bold text-green-300">Score</h3>
              <p className="text-3xl font-bold text-white">
                {currentScore}/100
              </p>
            </div>
            <div className="rounded-xl border border-blue-400/20 bg-blue-500/20 p-6 backdrop-blur-md">
              <h3 className="mb-2 text-2xl font-bold text-blue-300">
                Percentage
              </h3>
              <p className="text-3xl font-bold text-white">
                {Math.round((currentScore / 100) * 100)}%
              </p>
            </div>
            <div className="rounded-xl border border-purple-400/20 bg-purple-500/20 p-6 backdrop-blur-md">
              <h3 className="mb-2 text-2xl font-bold text-purple-300">
                Issues fixed
              </h3>
              <p className="text-3xl font-bold text-white">
                {issuesResolved.length}/4
              </p>
            </div>
          </div>

          <div className="mb-8 rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-xl font-semibold text-white">
              Your performance
            </h3>
            <p className="text-sm leading-relaxed text-white">
              Great job handling the drive-thru mix-up professionally. You
              addressed {issuesResolved.length} out of 4 order issues.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border border-green-400/30 bg-gradient-to-r from-green-600 to-green-700 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-green-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gray-100 text-gray-800">
      <div className="absolute inset-0 z-[0] overflow-hidden opacity-70">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/backgrounds/fastFoodBg.png')",
            filter: "blur(3px) brightness(1.1)",
            transform: "scale(1.1)",
          }}
        />
      </div>

      {showIntroPopup && phase === "intro" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="mx-4 w-full max-w-2xl rounded-2xl bg-white p-8 text-center shadow-2xl">
            <h2 className="mb-4 text-3xl font-bold text-gray-800">
              Order mix-up at Burger Express
            </h2>
            <div className="mb-6 space-y-4 text-left text-sm text-gray-700">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="mb-2 font-semibold text-red-800">
                  Your order is wrong
                </h3>
                <ul className="space-y-1 text-xs">
                  <li>Burger has onions (you ordered no onions)</li>
                  <li>Small fries (you ordered medium)</li>
                  <li>Diet Coke (you ordered regular)</li>
                  <li>Missing onion rings from your coupon</li>
                </ul>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-800">Your goal</h3>
                <ul className="space-y-1 text-xs">
                  <li>Explain each problem clearly</li>
                  <li>Be specific about what is wrong</li>
                  <li>Show your receipt and coupon when asked</li>
                  <li>Get all 4 issues fixed professionally</li>
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleStart()}
              className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105"
            >
              Start drive-thru conversation
            </button>
          </div>
        </div>
      )}

      {conversationStarted && !showCompletion && (
        <div className="relative z-[2] w-full">
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
                    Score: {currentScore}/100
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md sm:text-sm">
                    Q: {questionCount}/10
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-green-300 backdrop-blur-md sm:text-sm">
                    Issues: {issuesResolved.length}/4
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                      <Image
                        src={mike.avatar}
                        alt={mike.name}
                        width={64}
                        height={64}
                        className={`h-full w-full rounded-full object-cover ring-2 ${
                          speakingIndex === 0
                            ? "animate-pulse ring-orange-400"
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
                      <h3 className="text-base font-bold text-white sm:text-lg">
                        {mike.name}
                      </h3>
                      <p className="text-xs text-blue-200 sm:text-sm">
                        {mike.title}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
            hintText={
              micActive
                ? "Speak naturally — your words appear above in real time."
                : "Unmute the microphone to speak."
            }
            audioHelpSlot={<AudioTestStrip />}
            controlsSlot={
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
                {micActive && <SoundWave speaking={listening} />}
                <button
                  type="button"
                  onClick={handleMute}
                  disabled={isLoading}
                  className="relative z-10 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  {micActive ? "Mute" : "Unmute"}
                </button>
                <button
                  type="button"
                  onClick={handleStopConversation}
                  disabled={isLoading}
                  className="relative z-10 rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                >
                  End conversation
                </button>
              </div>
            }
          >
            {conversationHistory.map((message, idx) => (
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
                      src={mike.avatar}
                      alt={mike.name}
                      width={28}
                      height={28}
                      className="shrink-0 rounded-full"
                    />
                  )}
                  <div className="min-w-0 flex-1 text-center">
                    <p className="mb-1 text-xs font-semibold opacity-90">
                      {message.role === "assistant" ? mike.name : "You"}
                    </p>
                    <p className="text-sm leading-relaxed sm:text-[15px]">
                      {message.content}
                    </p>
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

      <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 transform">
        <p className="text-xs font-light tracking-wide text-gray-600">
          speakgrade © 2025 B&B Global. All rights reserved.
        </p>
      </div>
    </div>
  );
}
