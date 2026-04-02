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
import { playAudioFromObjectUrl } from "@/utils/playAudioFromUrl";
import ScenarioChatLayout from "@/app/components/scenarioChat/ScenarioChatLayout";
import AudioTestStrip from "@/app/components/scenarioChat/AudioTestStrip";

interface Message {
  role: "assistant" | "user";
  content: string;
  speaker?: string;
}

interface Officer {
  name: string;
  image: string;
}

export default function ParkingTicket(): React.JSX.Element {
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
  const [ticketOutcome, setTicketOutcome] = useState<string>("pending");
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const router = useRouter();

  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();
  const audioUnlockedRef = useRef<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(4 * 60); // 6 minutes in seconds

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Browser doesn't support speech recognition.");
    }
  }, []);

  // When user stops speaking
  useEffect(() => {
    if (!listening && transcript.trim() && transcript.trim().length > 3 && !isProcessing) {
      console.log("🎤 Processing transcript:", transcript);
      setIsProcessing(true);
      processUserAnswer(transcript);
      resetTranscript();
    }
  }, [listening, transcript]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history, interimTranscript, finalTranscript]);

  // Monitor question count changes
  useEffect(() => {
    console.log(`📊 Question count updated: ${questionCount}/8`);
  }, [questionCount]);

  // Load completion state from localStorage
  // useEffect(() => {
  //   const completed = localStorage.getItem("ParkingTicket(easy)_Completed") === "true";
  //   if (completed) {
  //     setShowCompletion(true);
  //   }
  // }, []);

  // Completion handler
  const handleCompletion = (): void => {
    console.log("✅ Parking Ticket completed. Saving to localStorage.");
    
    // Save score using the utility function
    saveScenarioScore({
      cardId: "Parking Ticket Encounter",
      score: score,
      maxScore: maxScore
    });
    
    setShowCompletion(true);
  };

  // Generate and download PDF report
  const handleDownloadPDF = (): void => {
    const reportData = {
      title: "Police Encounter Report",
      scenario: "Parking Ticket Encounter",
      completionDate: new Date().toLocaleDateString(),
      conversationHistory: history,
      score: score,
      maxScore: maxScore,
      outcome: ticketOutcome,
      feedback: `You completed the police encounter simulation with a score of ${score}/${maxScore}. The outcome was: ${ticketOutcome}.`,
    };
    
    generatePDFReport(reportData);
  };

  const officer: Officer = { name: "Officer Davis", image: "/avatars/parking-police-man.png" };

  const unlockAudio = (): void => {
    if (audioUnlockedRef.current) return;
    unlockWebAudioOnUserGesture();
    audioUnlockedRef.current = true;
    console.log("🔓 Audio context unlocked");
  };

    // Start conversation timer with countdown
  const startConversationTimer = (): void => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          console.log("🛑 Conversation time limit reached. Stopping conversation.");
          handleStopConversation(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Store the interval reference
    conversationTimerRef.current = timer as any;
  };

  // Start conversation
  const startConversation = async (): Promise<void> => {
    unlockAudio();
    setConversationStarted(true);
    setMicActive(false);
    setPhase("main");
    setTimeRemaining(4 * 60); // Reset timer to 6 minutes
    setQuestionCount(1); // Start with question 1 (officer's opening)
    setDuplicateCount(0); // Reset duplicate counter

    const officerOpening = "Here's your ticket. This is a no-parking zone. How long have you been parked here?";

    // Add officer's opening to the conversation history
    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: officerOpening, speaker: "Officer Davis" },
    ]);

    // Play officer's opening voice
    await playVoice(officerOpening, "Officer Davis");

    // Enable mic for user's first response
    setTimeout(() => {
      setMicActive(true);
      SpeechRecognition.startListening({ 
        continuous: true,
        interimResults: false,
        language: 'en-US'
      });
    }, 2000);

    // Start the conversation timer
    startConversationTimer();
  };

  // Fetch officer's response
  const getOfficerResponse = async (userMessage: string): Promise<void> => {
    setLoading(true);
    console.log("🎤 Asking officer for response...");
    try {
      console.log("📤 Sending to API:", {
        userMessage: userMessage || "",
        questionCount: questionCount,
        historyLength: history.length,
        lastMessages: history.slice(-3) // Last 3 messages for context
      });

      const res = await fetch("/api/policeTicket/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMessage || "",
          conversationHistory: history,
          questionCount: questionCount, 
        }),
      });

      const data = await res.json();
      console.log("🤖 Officer responded:", data);
      console.log("🔍 Response structure:", {
        hasConversation: !!data.conversation,
        hasScore: !!data.score,
        hasProgress: !!data.progress,
        hasTicketOutcome: !!data.ticketOutcome
      });

              // Update progress from API response
        if (data.progress && typeof data.progress.current === 'number') {
          setQuestionCount(data.progress.current);
          console.log(`📊 Progress updated from API: ${data.progress.current}/${data.progress.total}`);
        } else {
          // If no progress data, increment manually
          setQuestionCount(prev => {
            const newCount = Math.min(prev + 1, 8);
            console.log(`📊 Progress incremented manually: ${prev} → ${newCount}/8`);
            return newCount;
          });
        }
              const reply = data?.conversation?.text || data.text || data.reply || "";
        const actualSpeaker = data?.conversation?.speaker || "Officer Davis";

        // Check if this is a duplicate question
        const lastQuestion = history.filter(msg => msg.role === "assistant").pop();
        if (lastQuestion && lastQuestion.content === reply) {
          const newDuplicateCount = duplicateCount + 1;
          setDuplicateCount(newDuplicateCount);
          console.warn(`⚠️ Duplicate question detected (${newDuplicateCount}/3), skipping...`);
          
          // Increment question count even for duplicates to prevent getting stuck
          setQuestionCount(prev => Math.min(prev + 1, 8));
          console.log(`📊 Question count incremented due to duplicate: ${questionCount + 1}/8`);
          
          // If too many duplicates, force completion
          if (newDuplicateCount >= 3) {
            console.warn("🚨 Too many duplicates, forcing completion");
            setTimeout(() => {
              handleStopConversation(true);
            }, 2000);
            return;
          }
          
          // Restart listening for next question
          setTimeout(() => {
            setMicActive(true);
            SpeechRecognition.startListening({ 
              continuous: true,
              interimResults: false,
              language: 'en-US'
            });
          }, 1000);
          return;
        }

                if (reply.trim()) {
          setHistory((prev) => [
            ...prev,
            { role: "assistant", content: reply, speaker: actualSpeaker },
          ]);
          
          // Ensure question count is incremented for this response
          if (data.progress && typeof data.progress.current === 'number') {
            // API provided progress, use it
            console.log(`📊 Using API progress: ${data.progress.current}/8`);
          } else {
            // Force increment if API didn't provide progress
            setQuestionCount(prev => {
              const newCount = Math.min(prev + 1, 8);
              console.log(`📊 Forced increment: ${prev} → ${newCount}/8`);
              return newCount;
            });
          }
          
          // Play the response first
          await playVoice(reply, actualSpeaker);

        // Update scoring if available
        if (data.score && typeof data.score.points === 'number') {
          const newScore = score + data.score.points;
          const newMaxScore = maxScore + data.score.maxPoints;
          
          setScore(newScore);
          setMaxScore(newMaxScore);
          setCurrentQuestionScore(data.score.points);

          console.log(`💰 Score updated: ${newScore}/${newMaxScore} (+${data.score.points})`);
          console.log(`📝 Feedback: ${data.score.feedback}`);

          if (data.score.points > 0) {
            setTimeout(() => setCurrentQuestionScore(0), 3000);
          }
        }

        // Check if conversation should end
        if (data.ticketOutcome && data.ticketOutcome !== "pending") {
          console.log("🎯 Conversation ending due to ticket outcome:", data.ticketOutcome);
          setTimeout(() => {
            handleStopConversation(true);
          }, 3000);
        } else if (questionCount >= 8) {
          // Force completion after 8 questions
          console.log("🎯 Maximum questions reached, forcing completion");
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
          }, 1000);
        }
              } else {
          console.warn("⚠️ No valid text to speak.");
          // Increment question count even if no response to prevent getting stuck
          setQuestionCount(prev => Math.min(prev + 1, 8));
          // Restart listening even if no response
          setMicActive(true);
          SpeechRecognition.startListening({ 
            continuous: true,
            interimResults: false,
            language: 'en-US'
          });
        }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playVoice = async (text: string, speaker: string): Promise<void> => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    setSpeakingIndex(0);
    try {
      console.log(`🎙️ Playing voice for ${speaker}:`, text.substring(0, 50) + "...");

      const res = await fetch("/api/policeTicket/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speaker }),
      });

      if (!res.ok) {
        console.error("TTS failed:", await res.text());
        setSpeakingIndex(null);
        return;
      }

      const blob = await res.blob();
      if (blob.size < 100) {
        console.error("TTS inválido; revisa ELEVENLABS_API_KEY");
        setSpeakingIndex(null);
        return;
      }

      const url = URL.createObjectURL(blob);
      await playAudioFromObjectUrl(url, currentAudioRef);
      console.log(`✅ Finished speaking: ${speaker}`);
      setSpeakingIndex(null);
    } catch (e) {
      console.error("playVoice error:", e);
      setSpeakingIndex(null);
    }
  };

  // Handle no answer
  const handleNoAnswer = async (): Promise<void> => {
    if (!conversationStarted) return;
    const lastAssistant = history.find((msg) => msg.role === "assistant");
    if (!lastAssistant) return;

    console.log("🤐 User gave no response, officer will repeat.");
    SpeechRecognition.stopListening();
    setMicActive(false);

    const repeatPrompt = "It seems you didn't respond. Would you like me to repeat the question?";

    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: repeatPrompt, speaker: "Officer Davis" },
    ]);

    await playVoice(repeatPrompt, "Officer Davis");
    setTimeout(() => {
      setMicActive(true);
      SpeechRecognition.startListening({ 
        continuous: true,
        interimResults: false,
        language: 'en-US'
      });
    }, 1000);
  };

  // Process user answer
  const processUserAnswer = async (answer: string): Promise<void> => {
    if (!answer.trim() || answer.trim().length < 3) return;
    
    console.log("🗣️ User answered:", answer);
    SpeechRecognition.stopListening();
    setMicActive(false);

    setHistory((prev) => [...prev, { role: "user", content: answer }]);

    try {
      await getOfficerResponse(answer);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle mute
  const handleMute = (): void => {
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
  const handleStopConversation = (isTimeUp: boolean = false): void => {
    SpeechRecognition.stopListening();
    resetTranscript();
    setConversationStarted(false);
    setMicActive(false);
    
    if (SpeechRecognition.abortListening) {
      SpeechRecognition.abortListening();
    }

    setSpeakingIndex(null);

    // Clear the conversation timer
    if (conversationTimerRef.current) {
      clearInterval(conversationTimerRef.current as any);
      conversationTimerRef.current = null;
    }

    if (isTimeUp) {
      handleCompletion();
    } else {
      setShowIntroPopup(true);
      setHistory([]);
      setSpeakingIndex(null);
      setPhase("intro");
      setShowCompletion(false);
      setScore(0);
      setMaxScore(0);
      setQuestionCount(0);
      setCurrentQuestionScore(0);
      setTicketOutcome("pending");
      setTimeRemaining(4 * 60); // Reset timer
      setDuplicateCount(0); // Reset duplicate counter
    }
  };

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const factParagraph = `At 9:15 this morning, you stopped your bakery delivery van in a no‑parking zone in front of Green Leaf Café because every other parking spot nearby was taken. You had to deliver a three‑tier wedding cake directly to the café's manager — it couldn't be left unattended. You switched on your hazard lights, carried the cake inside, and were gone for less than one minute. When you came back, I had already written the ticket. You have your delivery schedule and a signed receipt from the café manager to prove the delivery.`;

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
                backgroundImage: "url('/cards/parking-ticket.png')",
              }}
            >
              <div className="absolute inset-0 bg-black/80 md:bg-black/68 lg:bg-black/68 xl:bg-black/68 z-0"></div>
              <Confetti className="w-full h-full z-10" />
              <div className="relative z-20 max-w-2xl w-full px-4">
                <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-4">
                  🎉 Conversation Completed!
                </h2>
                <p className="text-sm sm:text-lg text-white mb-6">
                  Great job! You've finished the police encounter. Thank you for participating! 😁
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
                    onClick={() => {
                      handleStopConversation(true);
                      router.push("/");
                    }}
                  >
                    End Session
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {showIntroPopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
                  <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 text-center max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl text-gray-700 font-bold mb-4">
                      🚔 Police Parking Ticket Encounter
                    </h2>
                    <div className="text-left mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">🎭 Your Role:</h3>
                      <p className="text-gray-700 text-sm mb-4">
                        You are a delivery driver who just received a parking ticket. You need to explain your situation to the police officer.
                      </p>
                      
                      <h3 className="font-semibold text-gray-800 mb-2">📝 The Facts (What Really Happened):</h3>
                      <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 mb-4">
                        {factParagraph}
                      </div>
                      
                      <h3 className="font-semibold text-gray-800 mb-2">🎯 Your Goal:</h3>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        <li>Explain your situation clearly and accurately</li>
                        <li>Provide specific details from the facts above</li>
                        <li>Be respectful but assertive about your case</li>
                        <li>Try to convince the officer to cancel the ticket</li>
                        <li>Stay consistent with your story throughout</li>
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

              <div className="relative w-full min-h-screen bg-gray-100">
                <div className="absolute inset-0 z-[0] opacity-70 overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: "url('/backgrounds/parkingBg.png')",
                      filter: "blur(3px) brightness(1.1)",
                      transform: "scale(1.1)",
                    }}
                  />
                </div>

                {!conversationStarted ? (
                  <div className="relative z-[2] flex min-h-screen flex-col items-center justify-center px-4 py-12">
                    <div className="mb-8 flex flex-col items-center">
                      <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-blue-400 bg-white shadow-md sm:h-40 sm:w-40">
                        <Image
                          src={officer.image}
                          alt={officer.name}
                          width={160}
                          height={160}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="mt-3 rounded-full bg-black px-4 py-2 text-sm font-medium text-white ring-2 ring-white">
                        {officer.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={startConversation}
                      className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Start Conversation
                    </button>
                  </div>
                ) : (
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
                            Q: {questionCount}/8
                          </span>
                          <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-green-300 backdrop-blur-md sm:text-sm">
                            Score: {score}/{maxScore}
                          </span>
                          {currentQuestionScore > 0 && (
                            <span className="animate-pulse rounded-full bg-emerald-500/80 px-2 py-1 text-[10px] font-semibold text-white sm:text-xs">
                              +{currentQuestionScore} pt
                            </span>
                          )}
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md sm:text-sm ${
                              timeRemaining <= 60
                                ? "animate-pulse bg-red-600/90"
                                : timeRemaining <= 120
                                  ? "bg-amber-600/85"
                                  : "bg-blue-600/80"
                            }`}
                          >
                            Time: {formatTime(timeRemaining)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                            <Image
                              src={officer.image}
                              alt={officer.name}
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
                            <h3 className="text-base font-bold text-white sm:text-lg">{officer.name}</h3>
                            <p className="text-xs text-blue-200 sm:text-sm">Parking enforcement</p>
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
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {micActive && <SoundWave speaking={listening} />}
                        <button
                          type="button"
                          onClick={handleMute}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                        >
                          {micActive ? "Mute" : "Unmute"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStopConversation(false)}
                          className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                        >
                          Stop conversation
                        </button>
                      </div>
                    }
                  >
                    {timeRemaining <= 60 && (
                      <p className="mb-2 text-center text-xs font-medium text-rose-200">
                        Time is running out — answer concisely.
                      </p>
                    )}
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
                              src={officer.image}
                              alt={officer.name}
                              width={28}
                              height={28}
                              className="shrink-0 rounded-full"
                            />
                          )}
                          <div className="min-w-0 flex-1 text-center">
                            <p className="mb-1 text-xs font-semibold opacity-90">
                              {message.role === "assistant" ? officer.name : "You"}
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
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
