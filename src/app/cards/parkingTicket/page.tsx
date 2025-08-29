"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Header from "@/app/components/header/page";
import Loader from "@/app/components/loader/page";
import SoundWave from "@/app/components/soundWave/page";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { generatePDFReport } from "@/app/utils/pdfGenerator";
import { saveScenarioScore } from "@/utils/scoreManager";

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
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const audioUnlockedRef = useRef<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
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

  const officer: Officer = { name: "Officer Davis", image: "/avatars/old-man-avatar.png" }; // We'll use the same avatar for now

  // Unlock audio context on first user interaction
  const unlockAudio = (): void => {
    if (audioUnlockedRef.current) return;
    const dummy = new Audio();
    dummy.src = "";
    dummy.play().catch(() => {});
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

  // Play voice
  const playVoice = async (text: string, speaker: string): Promise<void> => {
    // Stop any currently playing audio first
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

              <div
                className="relative bg-contain bg-no-repeat bg-center w-full bg-gray-100
                       bg-[url('https://img.freepik.com/free-vector/parking-fines-abstract-concept-vector-illustration-no-parking-zone-restricted-place-penalty-charge-notice-rules-violation-fine-ticket-online-payment-term-vehicle-parked-abstract-metaphor_335657-1805.jpg?t=st=1746336582~exp=1746340182~hmac=8144c51322da91d281911326c2445e8e950759564a3c419b5d89c96e9fed277c')]
                       sm:bg-[url('https://filetickets.ca/blog-front/img/blog-hero2.svg')]
                       sm:bg-cover"
              >
                <div className="absolute bg-black/40 w-full h-full z-[1]" />
                <div className="flex flex-col items-center justify-evenly min-h-screen">
                  <div className="flex flex-wrap items-start justify-center gap-8 z-[100]">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-blue-400 bg-white shadow-md overflow-hidden">
                        <Image
                          src={officer.image}
                          alt={officer.name}
                          width={144}
                          height={144}
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
                      <Image
                        src="/avatars/self-icon.png"
                        alt="You"
                        width={112}
                        height={112}
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

                    {/* Progress indicator */}
                    {conversationStarted && (
                      <div className="mt-4 text-center">
                        <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full mb-2">
                          Questions: {questionCount}/8
                        </div>
                        <div className="text-white text-sm bg-green-600/70 px-3 py-1 rounded-full">
                          Score: {score}/{maxScore} points
                        </div>
                        {currentQuestionScore > 0 && (
                          <div className="text-green-300 text-xs mt-1 animate-pulse">
                            +{currentQuestionScore} point{currentQuestionScore !== 1 ? 's' : ''}!
                          </div>
                        )}
                        {/* Time remaining indicator */}
                        <div className={`text-white text-sm px-3 py-1 rounded-full mt-2 ${
                          timeRemaining <= 60 ? 'bg-red-600/80 animate-pulse' : 
                          timeRemaining <= 120 ? 'bg-yellow-600/80' : 'bg-blue-600/80'
                        }`}>
                          ⏰ Time: {formatTime(timeRemaining)}
                        </div>
                        {/* Time warning */}
                        {timeRemaining <= 60 && (
                          <div className="text-red-300 text-xs mt-1 animate-pulse bg-white rounded-full px-3 py-1">
                            ⚠️ Time is running out! Make your final responses quickly.
                          </div>
                        )}
                        {timeRemaining <= 120 && timeRemaining > 60 && (
                          <div className="text-yellow-300 text-xs mt-1 bg-white rounded-full px-3 py-1">
                            ⏳ Less than 3 minutes remaining!
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
