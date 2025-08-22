"use client";
import { useState, useEffect, useRef } from "react";
import Header from "@/app/components/header/page";
import Loader from "@/app/components/loader/page";
import SoundWave from "@/app/components/soundWave/page";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { generatePDFReport } from "@/app/utils/pdfGenerator";

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
  const router = useRouter();

  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const audioUnlockedRef = useRef<boolean>(false);

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
    const completed = localStorage.getItem("level5Completed") === "true";
    if (completed) {
      setShowCompletion(true);
    }
  }, []);

  // Completion handler
  const handleCompletion = (): void => {
    console.log("✅ Level 5 completed. Saving to localStorage.");
    localStorage.setItem("level5Completed", "true");
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

  const officer: Officer = { name: "Officer Davis", image: "/old-man-avatar.png" }; // We'll use the same avatar for now

  // Unlock audio context on first user interaction
  const unlockAudio = (): void => {
    if (audioUnlockedRef.current) return;
    const dummy = new Audio();
    dummy.src = "";
    dummy.play().catch(() => {});
    audioUnlockedRef.current = true;
    console.log("🔓 Audio context unlocked");
  };

  // Start conversation
  const startConversation = async (): Promise<void> => {
    unlockAudio();
    setConversationStarted(true);
    setMicActive(false);
    setPhase("main");

    const officerOpening = "Here's your ticket. This is a no-parking zone. How long have you been parked here?";

    // Add officer's opening to the conversation history
    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: officerOpening, speaker: "Officer Davis" },
    ]);

    // Play officer's opening voice
    await playVoice(officerOpening, "Officer Davis");

    // Enable mic for user's first response
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });

    // Set time limit (6 minutes for police encounter)
    conversationTimerRef.current = setTimeout(() => {
      console.log("🛑 Conversation time limit reached. Stopping conversation.");
      handleStopConversation(true);
    }, 6 * 60 * 1000); // 6 minutes
  };

  // Fetch officer's response
  const getOfficerResponse = async (userMessage: string): Promise<void> => {
    setLoading(true);
    console.log("🎤 Asking officer for response...");
    try {
      const res = await fetch("/api/policeTicket/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMessage || "",
          conversationHistory: history,
        }),
      });

      const data = await res.json();
      console.log("🤖 Officer responded:", data);

      const reply = data?.conversation?.text || data.text || data.reply || "";
      const actualSpeaker = data?.conversation?.speaker || "Officer Davis";

      if (reply.trim()) {
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: reply, speaker: actualSpeaker },
        ]);
        await playVoice(reply, actualSpeaker);
        setMicActive(true);
        SpeechRecognition.startListening({ continuous: true });
      } else {
        console.warn("⚠️ No valid text to speak.");
      }

      setMicActive(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Play voice
  const playVoice = async (text: string, speaker: string): Promise<void> => {
    SpeechRecognition.stopListening();
    setMicActive(false);

    setSpeakingIndex(0);

    console.log(`💬 ${speaker} says: "${text}"`);
    await new Promise((resolve) => setTimeout(resolve, Math.min(1000 + text.length * 50, 3000)));

    setSpeakingIndex(null);
    if (conversationStarted) {
      setMicActive(true);
      SpeechRecognition.startListening({ continuous: true });
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
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  // Process user answer
  const processUserAnswer = async (answer: string): Promise<void> => {
    console.log("🗣️ User answered:", answer);
    SpeechRecognition.stopListening();
    setMicActive(false);

    setHistory((prev) => [...prev, { role: "user", content: answer }]);

    await getOfficerResponse(answer);
  };

  // Handle mute
  const handleMute = (): void => {
    if (micActive) {
      SpeechRecognition.stopListening();
      setMicActive(false);
    } else {
      SpeechRecognition.startListening({ continuous: true });
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

    if (conversationTimerRef.current) {
      clearTimeout(conversationTimerRef.current);
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
    }
    window.location.reload();
  };

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
                  "url('https://cdn.prod.website-files.com/61a05ff14c09ecacc06eec05/6720e94e1cd203b14c045522_%20Interview-Notes.jpg')",
              }}
            >
              <div className="absolute inset-0 bg-black/80 z-0"></div>
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
                  <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 text-center">
                    <h2 className="text-xl text-gray-700 font-bold mb-4">
                      Welcome to Police Encounter
                    </h2>
                    <p className="text-gray-700 mb-6">
                      You have received a parking ticket. Officer Davis wants to discuss the situation with you.
                      Speak clearly when it's your turn.
                    </p>
                    <button
                      onClick={() => setShowIntroPopup(false)}
                      className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              )}

              <div
                className="relative bg-contain bg-no-repeat bg-center w-full bg-gray-100
                       bg-[url('https://www.shutterstock.com/image-vector/policeman-giving-parking-fine-semi-260nw-2036548190.jpg')]
                       sm:bg-[url('/police_img.jpg')]
                       sm:bg-cover"
              >
                <div className="absolute bg-black/40 w-full h-full z-[1]" />
                <div className="flex flex-col items-center justify-evenly min-h-screen">
                  <div className="flex flex-wrap items-start justify-center gap-8 z-[100]">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-blue-400 bg-white shadow-md overflow-hidden">
                        <img
                          src={officer.image}
                          alt={officer.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                        {officer.name}
                      </span>
                      <SoundWave speaking={speakingIndex === 0} />
                    </div>
                  </div>

                  <div className="flex flex-col items-center z-[100] mt-8">
                    {micActive && <SoundWave speaking={listening} />}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 mt-2 rounded-full border-4 border-green-400 bg-white shadow-md overflow-hidden">
                      <img
                        src="/self-icon.png"
                        alt="You"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                      You
                    </span>

                    <div className="flex gap-3 mt-4">
                      {!conversationStarted ? (
                        <button
                          onClick={startConversation}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                        >
                          Start Conversation
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleMute}
                            className="px-4 py-2 rounded-lg bg-yellow-500 text-white"
                          >
                            {micActive ? "Mute" : "Unmute"}
                          </button>
                          <button
                            onClick={() => handleStopConversation(false)}
                            className="px-6 py-2 rounded-lg bg-rose-600 text-white"
                          >
                            Stop Conversation
                          </button>
                        </>
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
