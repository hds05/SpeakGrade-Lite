"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
import { saveCardScore } from "@/app/utils/scoringUtils";


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
  const router = useRouter();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const interviewTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  useEffect(() => {
    if (!interviewStarted || !micActive) return; // Only process when interview is active and mic is on
    if (!listening && transcript.trim()) {
      console.log("🎤 Processing user answer:", transcript);
      processUserAnswer(transcript);
      resetTranscript();
    }
  }, [listening, transcript, interviewStarted, micActive]);

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
    { name: "Bob", image: "/avatars/interview-older-man.png" },
    { name: "Charlie", image: "/avatars/interview-younger-woman.png" },
    { name: "Alice", image: "/avatars/interview-older-woman.png" },
  ];
  // Unlock audio context on first user interaction
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    const dummy = new Audio();
    dummy.src = "";
    dummy.play().catch(() => {});
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
  //   setIndex(0); // Start with Bob
  //   await getInterviewerQuestion(interviewers[0].name);
  // };
  const startInterview = async () => {
    // Request microphone permission first
    const micPermission = await requestMicrophonePermission();
    if (!micPermission) {
      console.log("❌ Cannot start interview without microphone permission");
      return;
    }

    unlockAudio();

    // clear old data
    resetTranscript();        // ✅ clear previous transcript
    setHistory([]);           // ✅ clear previous conversation
    setIndex(0); // Start with Bob
    setSpeakingIndex(0);  // Highlight Bob immediately
    setInterviewStarted(true);
    setMicActive(false);
    setTimeLeft(Initial_Time); // Reset timer to 30 seconds
    setFeedback(null); // Reset feedback
    setScore(0); // Reset score
    setMaxScore(0); // Reset max score
    setQuestionCount(0); // Reset question count

    const bobIntro =
      "Hello and welcome to your interview. Can you please tell us about yourself?";

    // Add Bob's intro to the conversation history
    setHistory([{ role: "assistant", content: bobIntro, speaker: "Bob" }]);

    // Play Bob's intro voice
    await playVoice(bobIntro, "Bob");

    // Enable mic for user's first answer
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });
    
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
    
    try {
      const res = await fetch("/api/interviewRoom/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSpeaker: speaker,
          userMessage: userMessage || "",
          conversationHistory: history,
          timeLeft: timeLeft,
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

      // Enable mic for user's answer
      setMicActive(true);
      // SpeechRecognition.startListening({ continuous: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Play audio from TTS
// ================= playVoice =================
const playVoice = async (text: string, speaker: string) => {
  console.log(`🎵 Starting TTS for ${speaker}:`, text);
  
  // Stop mic while interviewer speaks
  SpeechRecognition.stopListening();
  setMicActive(false);

  // Stop any previous audio
  if (currentAudioRef.current) {
    currentAudioRef.current.pause();
    currentAudioRef.current.src = "";
    currentAudioRef.current = null;
  }

  // Highlight speaker immediately
  const speakerIdx = interviewers.findIndex((p) => p.name === speaker);
  setSpeakingIndex(speakerIdx);
  console.log(`🎭 Highlighting speaker: ${speaker} at index ${speakerIdx}`);

  try {
    console.log(`📡 Calling TTS API for: ${speaker}`);
    const controller = new AbortController();
    const res = await fetch("/api/interviewRoom/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, speaker }),
      signal: controller.signal,
    });

    console.log(`📡 TTS API response status:`, res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ TTS API error:`, errorText);
      throw new Error(`TTS failed: ${res.status} ${errorText}`);
    }

    const blob = await res.blob();
    console.log(`🎵 TTS blob size:`, blob.size, `bytes`);
    
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudioRef.current = audio;

    console.log(`🎵 Audio element created, starting playback...`);

    await new Promise<void>((resolve, reject) => {
      const handleEnd = () => {
        if (currentAudioRef.current !== audio) {
          URL.revokeObjectURL(url);
          resolve();
          return;
        }

        console.log(`✅ Finished speaking: ${speaker}`);
        setSpeakingIndex(null);
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;

        // Restart mic only if interview is active
        if (interviewStarted) {
          setMicActive(true);
          SpeechRecognition.startListening({ continuous: true });
        }
        resolve();
      };

      audio.onended = handleEnd;
      audio.onerror = (e) => {
        console.error(`❌ Audio error for ${speaker}:`, e);
        if (currentAudioRef.current !== audio) {
          resolve();
        } else {
          reject(e);
        }
      };

      audio.play().catch((e) => {
        console.error(`❌ Audio play failed for ${speaker}:`, e);
        if (currentAudioRef.current === audio) reject(e);
      });
    });
  } catch (e) {
    console.error(`❌ playVoice error for ${speaker}:`, e);
    setSpeakingIndex(null);
  }
};

  const handleNoAnswer = async () => {
    if (!interviewStarted) return; // ⛔ not started
    const lastAssistant = history.find((msg) => msg.role === "assistant");
    if (!lastAssistant) return; // ⛔ no question asked yet

    console.log("🤐 User gave no response, interviewer will repeat.");
    SpeechRecognition.stopListening();
    setMicActive(false);

    const currentInterviewer = interviewers[index].name;
    const repeatPrompt =
      "It seems you didn't respond. Would you like me to repeat the question?";

    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: repeatPrompt, speaker: currentInterviewer },
    ]);

    await playVoice(repeatPrompt, currentInterviewer);

    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  // Handle user answer
  const processUserAnswer = async (answer: string) => {
    console.log("🗣️ User answered:", answer);
    console.log("🎯 Current interviewer index:", index);
    
    SpeechRecognition.stopListening();
    setMicActive(false);

    setHistory((prev) => [...prev, { role: "user", content: answer }]);

    // Get next interviewer in cycle
    const nextIndex = (index + 1) % interviewers.length;
    setIndex(nextIndex);
    console.log("🔄 Next interviewer:", interviewers[nextIndex].name);

    // Ask next interviewer
    console.log("📞 Calling getInterviewerQuestion for:", interviewers[nextIndex].name);
    await getInterviewerQuestion(interviewers[nextIndex].name, answer);
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

  // Stop entire interview
  const handleStopInterview = (isTimeUp: boolean = false) => {
    SpeechRecognition.stopListening();
    resetTranscript();

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
      // setShowCompletion(true); // Show confetti on time limit
    } else {
      // Reset everything for a manual restart
      // setShowIntroPopup(true);
      // setHistory([]);
      // setSpeakingIndex(null);
      // setIndex(0);
      // setPhase("intro");
      // setShowCompletion(false);
      // setTimeLeft(Initial_Time);
      // setFeedback(null);
      // setScore(0);
      // setMaxScore(0);
      // setQuestionCount(0);
      window.location.reload(); // forces browser to ask mic permission again on start
    }

  };

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
                  
                  {/* Feedback Display */}
                  {feedback && (
                    <div className="mb-6 p-6">
                      <h3 className="text-xl font-semibold text-white mb-4">📊 Your Performance</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-400">
                            {score}/{maxScore}
                          </div>
                          <div className="text-sm text-gray-300">Total Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-blue-400">
                            {maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}%
                          </div>
                          <div className="text-sm text-gray-300">Accuracy</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white text-sm leading-relaxed">{feedback.feedback}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-sm sm:text-lg text-white mb-6">
                    Great job! You've finished Level 3. Please sign up to know
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
                {/* Intro Popup */}
                {showIntroPopup && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
                    <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 text-center">
                      <h2 className="text-xl text-gray-700 font-bold mb-4">
                        Welcome to Your Interview
                      </h2>
                      <p className="text-gray-700 mb-6">
                        You are in a professional interview room with three
                        interviewers. Each will take turns asking you questions.
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
                  className="relative w-full min-h-screen bg-gray-100"
                >
                  {/* Layer 2 - Enhanced modern background extension */}
                  <div className="absolute inset-0 z-[0] opacity-70 overflow-hidden">
                    <div 
                      className="w-full h-full bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: "url('/backgrounds/interviewBg.png')",
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
                        backgroundImage: "url('/backgrounds/interviewBg.png')",
                        minHeight: '100vh'
                      }}
                    ></div>
                  </div>
                  <div className="relative z-[2] flex flex-col items-center justify-evenly min-h-screen">
                    {/* Timer Display */}
                    {interviewStarted && (
                      <div className="absolute top-1 right-2  transform -translate-x-1/2 z-[200]">
                        <div className="bg-black/70 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-white/30">
                          <div className="text-white text-center">
                            <div className="text-sm text-gray-300 mb-1">⏱️ Time Remaining</div>
                            <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Interviewers */}
                    <div className="flex flex-wrap items-start justify-center gap-8 z-[100]">
                      {interviewers.map((interviewer, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-green-400 bg-white shadow-md overflow-hidden">
                            <Image
                              src={interviewer.image}
                              alt={interviewer.name}
                              width={144}
                              height={144}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                            {interviewer.name}
                          </span>
                          <SoundWave speaking={speakingIndex === idx} />
                        </div>
                      ))}
                    </div>

                    {/* You */}
                    <div className="flex flex-col items-center z-[100] mt-8">
                      {micActive && <SoundWave speaking={listening} />}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 mt-2 rounded-full border-4 border-green-400 bg-white shadow-md overflow-hidden">
                        <Image
                          src="/avatars/user-avatar.png"
                          alt="You"
                          width={112}
                          height={112}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                        You
                      </span>
                      
                      {/* Microphone Status */}
                      {interviewStarted && (
                        <div className="mt-2 text-center">
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            micActive 
                              ? 'bg-green-600 text-white animate-pulse' 
                              : 'bg-gray-600 text-gray-300'
                          }`}>
                            {micActive ? '🎤 Listening...' : '🔇 Mic Off'}
                          </div>
                        </div>
                      )}

                      {/* Controls */}
                      <div className="flex gap-3 mt-4">
                        {!interviewStarted ? (
                          <button
                            onClick={startInterview}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                          >
                            Start Interview
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
                              onClick={() => handleStopInterview(false)}
                              className="px-4 py-2 rounded-lg bg-rose-600 text-white"
                            >
                              Stop Interview
                            </button>
                          </>
                        )}
                      </div>

                      {/* Progress indicator */}
                      {interviewStarted && (
                        <div className="mt-4 text-center">
                          <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full mb-2">
                            Questions: {questionCount}
                          </div>
                          <div className="text-white text-sm bg-green-600/70 px-3 py-1 rounded-full mb-2">
                            Score: {score}/{maxScore} points
                          </div>
                          {feedback && (
                            <div className="text-white text-xs bg-blue-500/70 px-2 py-1 rounded-full">
                              Feedback: {feedback.score}/{feedback.maxScore}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Debug Info */}
                      {interviewStarted && (
                        <div className="mt-2 text-center">
                          {/* <div className="text-white text-xs bg-blue-600/70 px-2 py-1 rounded-full mb-1">
                            Transcript: {transcript ? transcript.substring(0, 30) + '...' : 'None'}
                          </div> */}
                          <div className="text-white text-xs bg-purple-600/70 px-2 py-1 rounded-full">
                            Listening: {listening ? 'Yes' : 'No'}
                          </div>
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
