"use client";
import { useState, useEffect, useRef } from "react";
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
import { saveCardScore } from "@/app/utils/scoringUtils";
import { unlockWebAudioOnUserGesture } from "@/utils/webAudioUnlock";
import {
  cancelBrowserSpeech,
  playTtsAudioOrBrowser,
} from "@/utils/playTtsWithBrowserFallback";
import ScenarioChatLayout from "@/app/components/scenarioChat/ScenarioChatLayout";
import AudioTestStrip from "@/app/components/scenarioChat/AudioTestStrip";
import ScenarioWelcomeModal from "@/app/components/scenarioChat/ScenarioWelcomeModal";
import LocaleTogglePills from "@/app/components/localeToggle/LocaleTogglePills";
import { getStoredUiLocale, setStoredUiLocale, type UiLocale } from "@/utils/uiLocale";

export default function InterviewRoom() {
  const [phase, setPhase] = useState<"intro" | "main">("intro");
  const [index, setIndex] = useState(0); // which interviewer's turn
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const Initial_Time = 60;
  const [timeLeft, setTimeLeft] = useState(Initial_Time); // 30 seconds in seconds
  const [feedback, setFeedback] = useState<{ feedback: string; score: number; maxScore: number } | null>(null);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [uiLocale, setUiLocale] = useState<UiLocale>("en");
  const router = useRouter();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const interviewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();
  const audioUnlockedRef = useRef(false);
  /** State (not ref-only) so effects re-run when we open the mic after TTS. */
  const [expectingUserUtterance, setExpectingUserUtterance] = useState(false);
  const expectingUserUtteranceRef = useRef(false);
  const interviewStartedRef = useRef(false);
  const listeningRef = useRef(false);
  const transcriptRef = useRef("");
  const finalizeUtteranceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const processUserAnswerRef = useRef<(answer: string) => void | Promise<void>>(
    () => {}
  );

  listeningRef.current = listening;
  transcriptRef.current = transcript;

  useEffect(() => {
    interviewStartedRef.current = interviewStarted;
  }, [interviewStarted]);

  function enableListeningForUser() {
    if (!interviewStartedRef.current) return;
    expectingUserUtteranceRef.current = true;
    setExpectingUserUtterance(true);
    setMicActive(true);
    try {
      SpeechRecognition.startListening({ continuous: true });
    } catch (e) {
      console.error(e);
    }
  }

  function disableListeningForUser() {
    expectingUserUtteranceRef.current = false;
    setExpectingUserUtterance(false);
    setMicActive(false);
    SpeechRecognition.stopListening();
  }

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setUiLocale(getStoredUiLocale("en"));
  }, []);

  const setLocaleAndPersist = (locale: UiLocale) => {
    setUiLocale(locale);
    setStoredUiLocale(locale);
  };

  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Browser doesn't support speech recognition.");
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelBrowserSpeech();
      try {
        SpeechRecognition.stopListening();
        if (SpeechRecognition.abortListening) {
          SpeechRecognition.abortListening();
        }
      } catch {
        /* ignore */
      }
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.onended = null;
          currentAudioRef.current.onerror = null;
          currentAudioRef.current.pause();
          currentAudioRef.current.src = "";
          currentAudioRef.current.load();
        } catch {
          /* ignore */
        }
        currentAudioRef.current = null;
      }
      if (interviewTimerRef.current) {
        clearTimeout(interviewTimerRef.current);
        interviewTimerRef.current = null;
      }
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!interviewStarted) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleStopInterview(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    return () => clearInterval(interval);
  }, [interviewStarted]);

  // Continuous dictation often flips `listening` false briefly mid-sentence; debounce before committing.
  const UTTERANCE_END_MS = 550;
  useEffect(() => {
    if (finalizeUtteranceTimerRef.current) {
      clearTimeout(finalizeUtteranceTimerRef.current);
      finalizeUtteranceTimerRef.current = null;
    }

    if (!interviewStarted || !expectingUserUtterance) {
      return;
    }

    if (listening) {
      console.log("⏳ User speaking, transcript length:", transcript.length);
      return;
    }

    const trimmed = transcript.trim();
    if (trimmed.length <= 3) {
      return;
    }

    console.log("🔍 Utterance pause — scheduling finalize in", UTTERANCE_END_MS, "ms");

    finalizeUtteranceTimerRef.current = setTimeout(() => {
      finalizeUtteranceTimerRef.current = null;
      if (!expectingUserUtteranceRef.current || !interviewStartedRef.current) return;
      if (listeningRef.current) return;
      const text = transcriptRef.current.trim();
      if (text.length <= 3) return;
      console.log("🎤 Processing user answer (debounced):", text);
      void processUserAnswerRef.current(text);
      resetTranscript();
    }, UTTERANCE_END_MS);

    return () => {
      if (finalizeUtteranceTimerRef.current) {
        clearTimeout(finalizeUtteranceTimerRef.current);
        finalizeUtteranceTimerRef.current = null;
      }
    };
  }, [listening, transcript, interviewStarted, expectingUserUtterance, resetTranscript]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history, interimTranscript, finalTranscript]);

  // ✅ Load completion state from localStorage
  useEffect(() => {
    const completed = localStorage.getItem("InterviewRoom(Easy)_Completed") === "true";
    if (completed) {
      setShowCompletion(true);
    }
  }, []);

  // ✅ Completion handler
  const handleCompletion = () => {
    console.log("✅ Interview Room completed. Saving to localStorage.");
    
    // Save score using the utility function
    saveScenarioScore({
      cardId: "Interview Room",
      score: score,
      maxScore: maxScore
    });
    
    // Build an objective end-of-session summary (avoid overly positive feedback on low participation).
    const answeredCount = history.filter((m) => m.role === "user").length;
    const accuracyPct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const timeUsedSec = Initial_Time - timeLeft;

    let objectiveSummary = `Session summary: answered ${answeredCount} question(s) in ${timeUsedSec}s. Score: ${score}/${maxScore} (${accuracyPct}%). `;

    if (answeredCount <= 1) {
      objectiveSummary +=
        "There was not enough content to evaluate your interview skills reliably. Next time, aim for complete answers (2–4 sentences) with one concrete example.";
    } else if (maxScore === 0 || accuracyPct < 40) {
      objectiveSummary +=
        "Your responses were frequently unclear, too short, or off-topic. Focus on: answering the question directly, adding specific details, and keeping a professional tone.";
    } else if (accuracyPct < 60) {
      objectiveSummary +=
        "Your performance was mixed. You communicated some relevant points, but your answers often lacked specificity or structure. Try using a simple structure (situation → action → result).";
    } else if (accuracyPct < 80) {
      objectiveSummary +=
        "Solid performance overall. To improve, add more concrete examples and quantify outcomes when possible.";
    } else {
      objectiveSummary +=
        "Strong performance. Keep the same clarity and professionalism, and continue adding specific, measurable examples to make answers even stronger.";
    }

    setFeedback({ feedback: objectiveSummary, score: Math.round((accuracyPct / 100) * 10), maxScore: 10 });
    setShowCompletion(true);
  };

  // Generate and download PDF report
  const handleDownloadPDF = () => {
    const reportData = {
      title: "Interview Room Report",
      scenario: "Professional Interview Simulation",
      completionDate: new Date().toLocaleDateString(),
      conversationHistory: history,
      score: score,
      maxScore: maxScore,
      questionCount: questionCount,
      timeUsed: Initial_Time - timeLeft,
      feedback: feedback?.feedback || `You have successfully completed the interview simulation with three professional interviewers in ${Initial_Time - timeLeft} seconds. This demonstrates your ability to communicate effectively in a professional setting under time pressure.`,
    };
    
    generatePDFReport(reportData);
  };

  const interviewers = [
    { name: "Adam", image: "/avatars/interview-older-man.png" },
    { name: "Cassidy", image: "/avatars/interview-younger-woman.png" },
    { name: "Stephanie", image: "/avatars/interview-older-woman.png" },
  ];
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    unlockWebAudioOnUserGesture();
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
      alert("Microphone permission is required for the interview. Please allow microphone access and refresh the page.");
      return false;
    }
  };
  // Start interview
  // const startInterview = async () => {
  //   unlockAudio();
  //   setInterviewStarted(true);
  //   setMicActive(false);
  //   setIndex(0); // Start with Adam
  //   await getInterviewerQuestion(interviewers[0].name);
  // };
  const startInterview = async () => {
    unlockAudio();
    const micPermission = await requestMicrophonePermission();
    if (!micPermission) {
      console.log("❌ Cannot start interview without microphone permission");
      return;
    }

    // clear old data
    resetTranscript();        // ✅ clear previous transcript
    setHistory([]);           // ✅ clear previous conversation
    setIndex(0); // Start with Adam
    setSpeakingIndex(0);  // Highlight Adam immediately
    setInterviewStarted(true);
    interviewStartedRef.current = true;
    setShowIntroPopup(false); // Dismiss overlay so UI buttons are clickable
    disableListeningForUser();
    setTimeLeft(Initial_Time); // Reset timer to 30 seconds
    setFeedback(null); // Reset feedback
    setScore(0); // Reset score
    setMaxScore(0); // Reset max score
    setQuestionCount(0); // Reset question count

    const adamIntro =
      "Hello and welcome to your interview. Can you please tell us about yourself?";

    // Add Adam's intro to the conversation history
    setHistory([{ role: "assistant", content: adamIntro, speaker: "Adam" }]);

    // Play Adam's intro voice
    await playVoice(adamIntro, "Adam");

    console.log("🎤 Interview started, waiting for user response...");

    // ⏱️ Set time limit
    interviewTimerRef.current = setTimeout(() => {
      console.log("🛑 Interview time limit reached. Stopping interview.");
      handleStopInterview(true);
    }, Initial_Time * 1000); // Convert seconds to milliseconds
  };

  // Fetch one interviewer's question
  const getInterviewerQuestion = async (
    speaker: string,
    userMessage?: string
  ) => {
    setLoading(true);
    console.log(`🎤 Asking ${speaker} for their question...`);
    console.log(`📝 User message:`, userMessage);
    console.log(`📚 Conversation history:`, history);
    
    const historyForApi =
      userMessage && userMessage.trim()
        ? [...history, { role: "user", content: userMessage }]
        : history;

    try {
      const res = await fetch("/api/interviewRoom/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSpeaker: speaker,
          userMessage: userMessage || "",
          conversationHistory: historyForApi,
          timeLeft: timeLeft,
          questionCount: questionCount,
        }),
      });

      const data = await res.json();
      console.log(`🤖 ${speaker} asked:`, data);
      console.log(`📊 Full API response:`, JSON.stringify(data, null, 2));

      // ✅ Extract from nested structure
      const reply = data?.conversation?.text || data.text || data.reply || "";
      console.log(`📝 Extracted reply:`, reply);
      console.log(`🎭 Reply length:`, reply.length);

      const actualSpeaker = data?.conversation?.speaker || speaker;
      console.log(`🎤 Actual speaker:`, actualSpeaker);

      // Store feedback if provided
      if (data.feedback) {
        setFeedback(data.feedback);
        console.log("📊 Received feedback:", data.feedback);
      }

      // Store score data if provided
      if (data.score) {
        setScore(prev => prev + data.score.points);
        setMaxScore(prev => prev + data.score.maxPoints);
        setQuestionCount(prev => prev + 1);
        console.log("📊 Received score:", data.score);
        
        // Show current question score briefly
        if (data.score.points > 0) {
          setTimeout(() => {
            // Score will be displayed in the progress indicator
          }, 1000);
        }
      }

      if (reply.trim()) {
        setHistory((prev) => {
          const PROCESSING_MSG = "Dame un momento…";
          const last = prev[prev.length - 1];
          const nextAssistant = { role: "assistant" as const, content: reply, speaker: actualSpeaker };
          if (last?.role === "assistant" && last.content === PROCESSING_MSG) {
            return [...prev.slice(0, -1), nextAssistant];
          }
          return [...prev, nextAssistant];
        });
        await playVoice(reply, actualSpeaker);
      } else {
        console.warn("⚠️ No valid text to speak.");

        console.log("🎤 Enabling microphone for user response (no voice to play)...");
        enableListeningForUser();
      }
    } catch (err) {
      console.error(err);
      if (interviewStartedRef.current) {
        enableListeningForUser();
      }
    } finally {
      setLoading(false);
    }
  };

  const playVoice = async (text: string, speaker: string) => {
    console.log(`🎵 Starting TTS for ${speaker}:`, text);

    disableListeningForUser();

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.onpause = null;
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = "";
      } catch {
        /* ignore */
      }
      currentAudioRef.current = null;
    }

    const speakerIdx = interviewers.findIndex((p) => p.name === speaker);
    setSpeakingIndex(speakerIdx);
    console.log(`🎭 Highlighting speaker: ${speaker} at index ${speakerIdx}`);

    try {
      console.log(`📡 Calling TTS API for: ${speaker}`);
      await playTtsAudioOrBrowser(text, currentAudioRef, () =>
        fetch("/api/interviewRoom/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, speaker }),
        })
      );
      console.log(`✅ Finished speaking: ${speaker}`);
      setSpeakingIndex(null);
      if (interviewStartedRef.current) {
        enableListeningForUser();
      }
    } catch (e) {
      console.error(`❌ playVoice error for ${speaker}:`, e);
      setSpeakingIndex(null);
      if (interviewStartedRef.current) {
        enableListeningForUser();
      }
    }
  };

  const handleNoAnswer = async () => {
    if (!interviewStarted) return; // ⛔ not started
    const lastAssistant = history.find((msg) => msg.role === "assistant");
    if (!lastAssistant) return; // ⛔ no question asked yet

    console.log("🤐 User gave no response, interviewer will repeat.");
    disableListeningForUser();

    const currentInterviewer = interviewers[index].name;
    const repeatPrompt =
      "It seems you didn't respond. Would you like me to repeat the question?";

    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: repeatPrompt, speaker: currentInterviewer },
    ]);

    await playVoice(repeatPrompt, currentInterviewer);
  };

  // Handle user answer
  const processUserAnswer = async (answer: string) => {
    console.log("🗣️ User answered:", answer);
    console.log("🎯 Current interviewer index:", index);
    const PROCESSING_MSG = "Dame un momento…";
    
    disableListeningForUser();

    setHistory((prev) => [
      ...prev,
      { role: "user", content: answer },
      { role: "assistant", content: PROCESSING_MSG, speaker: interviewers[(index + 1) % interviewers.length].name },
    ]);

    // Get next interviewer in cycle
    const nextIndex = (index + 1) % interviewers.length;
    setIndex(nextIndex);
    console.log("🔄 Next interviewer:", interviewers[nextIndex].name);

    // Ask next interviewer
    console.log("📞 Calling getInterviewerQuestion for:", interviewers[nextIndex].name);
    await getInterviewerQuestion(interviewers[nextIndex].name, answer);
  };

  // Mute = stop mic; if we were capturing an answer, treat it as "done" (listening often stays true until stop).
  const handleMute = () => {
    if (micActive) {
      if (finalizeUtteranceTimerRef.current) {
        clearTimeout(finalizeUtteranceTimerRef.current);
        finalizeUtteranceTimerRef.current = null;
      }
      const text = transcriptRef.current.trim();
      if (expectingUserUtteranceRef.current && text.length > 3) {
        console.log("🎤 Submitting answer via Mute:", text);
        void processUserAnswerRef.current(text);
        resetTranscript();
      } else {
        disableListeningForUser();
      }
    } else {
      enableListeningForUser();
    }
  };

  // Stop entire interview
  const handleStopInterview = (isTimeUp: boolean = false) => {
    cancelBrowserSpeech();
    SpeechRecognition.stopListening();
    resetTranscript();

    expectingUserUtteranceRef.current = false;
    setExpectingUserUtterance(false);
    interviewStartedRef.current = false;
    setInterviewStarted(false);
    setMicActive(false);
    // Force full mic reset
    if (SpeechRecognition.abortListening) {
      SpeechRecognition.abortListening(); // kills recognition session entirely
    }

    // ✅ Stop any ongoing voice
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.src = "";
      currentAudioRef.current.load(); // force reset of the <audio> element
      currentAudioRef.current = null;
    }
    setSpeakingIndex(null);

    if (interviewTimerRef.current) {
      clearTimeout(interviewTimerRef.current);
      interviewTimerRef.current = null;
    }

    if (isTimeUp) {
      handleCompletion();
    } else {
      router.push("/dashboard");
    }

  };

  processUserAnswerRef.current = processUserAnswer;

  return (
      <div className="relative w-full min-h-screen  bg-gradient-to-b from-black/80 to-gray-400 text-white">

        {loading && !interviewStarted ? (
          <div className="bg-white">
            <Loader />
          </div>
        ) : (
          <>
            {/* <Header /> */}
            {showCompletion ? (
              <div
                className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
                style={{
                  backgroundImage: "url('/cards/interview-room.png')",
                }}
              >
                {/* Desktop/Laptop Opacity Overlay - 85% of current */}
                <div className="absolute inset-0 bg-black opacity-15 md:opacity-15 lg:opacity-15 xl:opacity-15"></div>
                {/* Dark overlay - responsive for desktop/laptop */}
                <div className="absolute inset-0 bg-black/80 md:bg-black/68 lg:bg-black/68 xl:bg-black/68 z-0"></div>

                {/* Confetti */}
                <Confetti className="w-full h-full z-10" />

                {/* Content */}
                <div className="relative z-20 max-w-2xl w-full px-4">
                  <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-4">
                    🎉 Conversation Completed!
                  </h2>
                  
                  {/* Score Grid - Standardized design */}
                  {feedback && (
                    <>
                      <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-6 border border-green-400/20">
                          <h3 className="text-2xl font-bold text-green-300 mb-2">Score</h3>
                          <p className="text-3xl font-bold text-white">{score}/{maxScore}</p>
                        </div>
                        <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-400/20">
                          <h3 className="text-2xl font-bold text-blue-300 mb-2">Percentage</h3>
                          <p className="text-3xl font-bold text-white">{maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}%</p>
                        </div>
                        <div className="bg-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
                          <h3 className="text-2xl font-bold text-purple-300 mb-2">Interview</h3>
                          <p className="text-3xl font-bold text-white">✅</p>
                        </div>
                      </div>

                      {/* Feedback Display */}
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
                        <h3 className="text-xl font-semibold text-white mb-4">📊 Your Performance</h3>
                        <p className="text-slate-200 text-sm leading-relaxed">{feedback.feedback}</p>
                      </div>
                    </>
                  )}
                  <p className="text-sm sm:text-lg text-white mb-6">
                    Great job! You&apos;ve finished Level 3. Please sign up to know
                    your score. 😁
                  </p>
                  <div className="flex flex-col justify-between sm:flex-row gap-3">
                    <button
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full transition duration-300 shadow-lg hover:bg-blue-700"
                      onClick={handleDownloadPDF}
                    >
                      📄 Download Report
                    </button>
                    <button
                      className="px-6 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-violet-500 hover:text-white"
                      onClick={() => {
                        handleStopInterview(true); // ✅ stop mic + reset interview
                        router.push("/dashboard");
                      }}
                    >
                      End Session
                    </button>

                  </div>
                </div>
              </div>
            ) : (
              <>
                <ScenarioWelcomeModal
                  open={showIntroPopup && !interviewStarted}
                  overlayClassName="z-[999]"
                  imageSrc="/cards/interview-room.png"
                  imageAlt="Interview room"
                  contextSlot={<LocaleTogglePills locale={uiLocale} onChange={setLocaleAndPersist} />}
                  title={uiLocale === "es" ? "Bienvenido(a) a tu entrevista" : "Welcome to Your Interview"}
                  description={
                    uiLocale === "es" ? (
                      <>
                        Estás en una sala de entrevistas profesional con tres entrevistadores. Cada uno
                        turnará para hacerte preguntas. Habla con claridad cuando sea tu turno y mantente
                        enfocado(a) durante la sesión con tiempo limitado.
                      </>
                    ) : (
                      <>
                        You are in a professional interview room with three interviewers. Each will
                        take turns asking you questions. Speak clearly when it&apos;s your turn and
                        stay focused for the timed session.
                      </>
                    )
                  }
                  expectHeading={uiLocale === "es" ? "Qué esperar:" : "What to expect:"}
                  bulletPoints={
                    uiLocale === "es"
                      ? [
                          "Tres entrevistadores se turnan las preguntas",
                          "Respuestas claras y profesionales",
                          "Sesión de entrevista con tiempo limitado",
                          "Escucha quién habla antes de responder",
                        ]
                      : [
                          "Three interviewers rotate questions",
                          "Clear, professional answers",
                          "Timed interview session",
                          "Listen for who is speaking before you reply",
                        ]
                  }
                  ctaLabel={uiLocale === "es" ? "Comenzar entrevista" : "Start Interview"}
                  onStart={startInterview}
                />

                <div className="relative w-full min-h-screen bg-gray-100">
                  <div className="absolute inset-0 z-[0] opacity-70 overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: "url('/backgrounds/interviewBg.png')",
                        filter: "blur(3px) brightness(1.1)",
                        transform: "scale(1.1)",
                      }}
                    />
                  </div>

                  {interviewStarted ? (
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
                            <span
                              className={`rounded-full px-4 py-1.5 text-sm font-bold backdrop-blur-md ${
                                timeLeft <= 10
                                  ? "animate-pulse bg-red-600/90 text-white"
                                  : "bg-white/20 text-green-300"
                              }`}
                            >
                              Time: {Math.floor(timeLeft / 60)}:
                              {(timeLeft % 60).toString().padStart(2, "0")}
                            </span>
                            <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md sm:text-sm">
                              Q: {questionCount}
                            </span>
                            <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-green-300 backdrop-blur-md sm:text-sm">
                              Score: {score}/{maxScore}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                              <Image
                                src={interviewers[index].image}
                                alt={interviewers[index].name}
                                width={64}
                                height={64}
                                className={`h-full w-full rounded-full object-cover ring-2 ${
                                  speakingIndex === index ? "animate-pulse ring-green-400" : "ring-white/40"
                                } transition-all`}
                              />
                              {speakingIndex === index && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <SoundWave speaking={true} />
                                </div>
                              )}
                            </div>
                            <div className="text-left">
                              <h3 className="text-base font-bold text-white sm:text-lg">{interviewers[index].name}</h3>
                              <p className="text-xs text-blue-200 sm:text-sm">Current interviewer</p>
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
                            onClick={() => handleStopInterview(false)}
                            className="relative z-10 rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                          >
                            Stop interview
                          </button>
                        </div>
                      }
                    >
                      {history.map((message: { role: string; content: string; speaker?: string }, idx: number) => {
                        const avatarSrc =
                          message.role === "assistant" && message.speaker
                            ? interviewers.find((i) => i.name === message.speaker)?.image ?? interviewers[0].image
                            : null;
                        const label =
                          message.role === "assistant" && message.speaker ? message.speaker : "You";
                        return (
                          <div
                            key={idx}
                            className={`mx-auto w-full max-w-lg rounded-2xl px-4 py-3 text-center shadow-sm ${
                              message.role === "assistant"
                                ? "bg-blue-600/35 text-white ring-1 ring-blue-400/25"
                                : "bg-emerald-600/35 text-white ring-1 ring-emerald-400/25"
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
                              {message.role === "assistant" && avatarSrc && (
                                <Image
                                  src={avatarSrc}
                                  alt={label}
                                  width={28}
                                  height={28}
                                  className="shrink-0 rounded-full"
                                />
                              )}
                              <div className="min-w-0 flex-1 text-center">
                                <p className="mb-1 text-xs font-semibold opacity-90">{label}</p>
                                <p className="text-sm leading-relaxed sm:text-[15px]">{message.content}</p>
                              </div>
                              {message.role === "user" && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                                  You
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </ScenarioChatLayout>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </>
        )}
      </div>
  );
}
