"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Canvas } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import SoundWave from "@/app/components/soundWave/page";
import { saveScenarioScore } from "@/utils/scoreManager";
import Confetti from "react-confetti";

interface ScoreData {
  points: number;
  maxPoints: number;
  feedback: string;
}

interface ConversationResponse {
  speaker: string;
  text: string;
  score: ScoreData;
  missionStatus: string;
  decisionsMade: number;
  safetyLevel: number;
}

export default function SpacecraftSimulation() {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "emergency" | "mission" | "completion">("intro");
  const [conversationHistory, setConversationHistory] = useState<Array<{ speaker: string; text: string }>>([]);
  const [jarvisSpeaking, setJarvisSpeaking] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [missionPhase, setMissionPhase] = useState("emergency");
  const [decisionsMade, setDecisionsMade] = useState(0);
  const [safetyLevel, setSafetyLevel] = useState(50);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [missionStatus, setMissionStatus] = useState("CONTINUE");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeRemaining > 0 && phase === "mission") {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto complete scenario
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeRemaining, phase]);

  // Cleanup effect to prevent audio AbortError
  useEffect(() => {
    return () => {
      // Clean up audio when component unmounts
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.onended = null;
          currentAudioRef.current.onerror = null;
          currentAudioRef.current.onpause = null;
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
          currentAudioRef.current.src = '';
          currentAudioRef.current = null;
        } catch (error) {
          console.log("Component unmount audio cleanup completed");
        }
      }
    };
  }, []);

  const handleCompletion = (status: string) => {
    console.log(`✅ Spacecraft Simulation completed with status: ${status}`);
    
    // Save score using the utility function
    saveScenarioScore({
      cardId: "Spacecraft Simulation",
      score: totalScore,
      maxScore: maxScore
    });
    
    setPhase("completion");
    setShowCompletion(true);
    setMissionStatus(status);
    
    // Stop all speech recognition and audio
    if (listening) {
      SpeechRecognition.stopListening();
    }
    setMicActive(false);
    
    // Properly clean up audio to prevent AbortError
    if (currentAudioRef.current) {
      try {
        // Remove event listeners first
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.onpause = null;
        
        // Pause and reset
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = '';
        
        // Clear the reference
        currentAudioRef.current = null;
      } catch (error) {
        console.log("Audio cleanup completed");
      }
    }
  };

  const handleTimeUp = () => {
    console.log("⏰ [Timer] Time's up! Auto-completing scenario...");
    
    // Stop the timer first
    setTimerActive(false);
    
    // Then complete the scenario
    handleCompletion("TIME_UP");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Skip emergency phase and go directly to mission
  useEffect(() => {
    if (phase === "emergency") {
        setPhase("mission");
        setTimerActive(true); // Start the 5-minute timer
        startJarvisGreeting();
    }
  }, [phase]);

  // Start Jarvis greeting when mission phase begins
  useEffect(() => {
    if (phase === "mission" && !conversationStarted) {
      startJarvisGreeting();
    }
  }, [phase]);

  const startJarvisGreeting = async () => {
    console.log("🤖 [Jarvis] Starting greeting...");
    const greeting = "Due to asteroid collision, our spaceship has been damaged. Don't worry, I'll guide you through what's happening outside. You just give me instructions.";
    
    setConversationHistory([{ speaker: "JARVIS", text: greeting }]);
    setConversationStarted(true);
    
    // Play Jarvis's voice first
    await playJarvisVoice(greeting);
    
    // Wait for audio to complete before starting mic
    setTimeout(() => {
      setMicActive(true);
      if (browserSupportsSpeechRecognition) {
        SpeechRecognition.startListening({ 
          continuous: true,
          interimResults: false,
          language: 'en-US'
        });
      }
    }, 1500); // 1.5 second delay after audio completes
  };

  const playJarvisVoice = async (text: string) => {
    try {
      setJarvisSpeaking(true);
      
      const response = await fetch("/api/SpacecraftSimulation/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speaker: "Jarvis" }),
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Clean up previous audio properly to prevent AbortError
        if (currentAudioRef.current) {
          try {
            currentAudioRef.current.onended = null;
            currentAudioRef.current.onerror = null;
            currentAudioRef.current.onpause = null;
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
            currentAudioRef.current.src = '';
    } catch (error) {
            console.log("Previous audio cleanup completed");
          }
        }
        
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          setJarvisSpeaking(false);
          // Clean up the URL object
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        };
        
        audio.onerror = () => {
          console.error("Audio playback error");
          setJarvisSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error("TTS error:", error);
      setJarvisSpeaking(false);
    }
  };

  // Handle speech recognition with better control
  useEffect(() => {
    console.log("🎤 [Voice] Speech recognition state:", {
      micActive,
      listening,
      transcriptLength: transcript?.length || 0,
      transcript: transcript
    });
    
    if (!micActive || !listening || !conversationStarted) return;
    
    // Only process when speech recognition stops AND we have a substantial transcript
    if (!listening && transcript.trim() && transcript.trim().length > 5 && !isProcessing) {
      console.log("🎤 [Voice] User finished speaking:", transcript);
      console.log("🎤 [Voice] Processing decision...");
      processUserDecision(transcript);
      resetTranscript();
    }
  }, [listening, transcript, micActive, isProcessing, conversationStarted]);

  const processUserDecision = async (userMessage: string) => {
    console.log("🤖 [Decision] Processing user decision:", userMessage);
    console.log("🤖 [Decision] Decision length:", userMessage.length);
    console.log("🤖 [Decision] Current mic state:", { micActive, listening });
    
    if (!userMessage.trim()) return;
    
    // Stop listening temporarily
    if (listening) {
      SpeechRecognition.stopListening();
    }
    setMicActive(false);
    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/SpacecraftSimulation/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          conversationHistory,
          missionPhase,
          decisionsMade,
          safetyLevel,
        }),
      });

      console.log("🌐 [API] Making API call to /api/SpacecraftSimulation/respond");
      console.log("🌐 [API] Request payload:", {
        userMessage,
        conversationHistoryLength: conversationHistory.length,
        missionPhase,
        decisionsMade,
        safetyLevel,
      });

      if (response.ok) {
        const data: ConversationResponse = await response.json();
        console.log("🌐 [API] Response status:", response.status);
        console.log("🌐 [API] Response ok:", response.ok);
        console.log("🌐 [API] Response data:", data);

        // Update conversation history
        setConversationHistory(prev => [
          ...prev,
          { speaker: "You", text: userMessage },
          { speaker: data.speaker, text: data.text }
        ]);

        // Update mission state
        setDecisionsMade(data.decisionsMade);
        setSafetyLevel(data.safetyLevel);
        setTotalScore(data.score.points);
        setMaxScore(data.score.maxPoints);
        setMissionStatus(data.missionStatus);

        // Play Jarvis's response
        await playJarvisVoice(data.text);

        // Wait for audio to actually finish playing before restarting mic
        const waitForAudioCompletion = () => {
          return new Promise<void>((resolve) => {
            if (!currentAudioRef.current) {
              resolve();
              return;
            }

            const checkAudio = () => {
              if (!currentAudioRef.current) {
                resolve();
                return;
              }
              // Check if audio is still playing
              if (currentAudioRef.current.ended || currentAudioRef.current.paused) {
                resolve();
              } else {
                setTimeout(checkAudio, 100);
              }
            };

            checkAudio();
          });
        };

        await waitForAudioCompletion();

        // Check if mission should end
        if (data.missionStatus === "SUCCESS" || data.missionStatus === "FAIL") {
          handleCompletion(data.missionStatus);
          setTimerActive(false);
        } else {
          // Add a small delay before restarting mic to prevent capturing AI's last words
          setTimeout(() => {
            setMicActive(true);
            if (browserSupportsSpeechRecognition) {
              SpeechRecognition.startListening({
                continuous: true,
                interimResults: false,
                language: 'en-US'
              });
            }
          }, 1500); // 1.5 second delay
        }
      }
    } catch (error) {
      console.error("API error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = () => {
    // PDF generation logic here
    console.log("📄 Downloading PDF report...");
  };

  const handleRestart = () => {
    console.log("🔄 [Restart] Reloading page...");
    window.location.reload(); // Reload the entire page
  };

  const handleReturnHome = () => {
    console.log("🏠 [Return] Stopping all processes and returning home...");
    
    // Stop speech recognition
    if (listening) {
      SpeechRecognition.stopListening();
    }
    setMicActive(false);
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Reset all states
    setConversationStarted(false);
    setTimerActive(false);
    setPhase("intro");
    
    // Navigate home
    router.push("/");
  };

  const handleStartMission = () => {
    console.log("🚀 [Mission] Starting mission...");
    setPhase("emergency");
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Speech Recognition Not Supported</h1>
          <p className="text-xl">Please use a modern browser that supports speech recognition.</p>
        </div>
      </div>
    );
  }

  if (showCompletion) {
    return (
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
           style={{
             backgroundImage: "url('/cards/spacecraft.png')",
           }}>
        {/* Dark overlay - responsive for desktop/laptop */}
        <div className="absolute inset-0 bg-black/80 md:bg-black/68 lg:bg-black/68 xl:bg-black/68 z-0"></div>
        
        {/* Confetti */}
        
        {/* Content */}
        <div className="relative z-20 max-w-4xl w-full px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-green-400">
        {missionStatus === "SUCCESS" && <Confetti className="w-full h-full z-10" />}
              { 
               missionStatus === "FAIL" ? "💥 Mission Failed" : 
               missionStatus === "TIME_UP" ? "⏰ Time's Up!" : "🏁 Mission Complete"}
          </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-6">
              {missionStatus === "SUCCESS" ? "Congratulations! You've successfully completed the mission." :
               missionStatus === "FAIL" ? "The mission was compromised due to unsafe decisions." :
               missionStatus === "TIME_UP" ? "The 5-minute time limit has expired." : "Mission completed with mixed results."}
            </p>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-white">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-blue-400 mb-2">Decisions Made</h3>
              <p className="text-4xl font-bold">{decisionsMade}</p>
              </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-green-400 mb-2">Safety Level</h3>
              <p className="text-4xl font-bold">{safetyLevel}%</p>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-2">Score</h3>
              <p className="text-4xl font-bold">{totalScore}/{maxScore}</p>
              </div>
            </div>
            
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownloadPDF}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              📄 Download Report
            </button>
              <button
              onClick={handleRestart}
              className="px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              🚀 Restart Mission
              </button>
              <button
              onClick={handleReturnHome}
              className="px-8 py-4 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
            >
              🏠 Return Home
              </button>

          </div>
        </div>
      </div>
    );
  }

    return (
    <div className="relative min-h-screen text-white overflow-hidden">




      {/* Intro Screen */}
      {phase === "intro" && (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
          {/* Three.js Space Background */}
          <div className="absolute inset-0 z-[1]">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
              <ambientLight intensity={0.2} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              <Stars 
                radius={100} 
                depth={50} 
                count={8000} 
                factor={8} 
                saturation={0} 
                fade 
                speed={0.3}
              />
              <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                autoRotate 
                autoRotateSpeed={0.1}
              />
            </Canvas>
          </div>
          
          {/* Spacecraft Interior Background */}
          <div className="absolute inset-0 z-[2] opacity-70">
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/backgrounds/spacecraftBg.png')"
              }}
            ></div>
          </div>
          
          <div className="text-center max-w-4xl relative z-30">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 ">
                🚀 Spacecraft Simulation
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-6">
                Emergency Mission with JARVIS AI
              </p>
            </div>

            <div className="p-8 mb-8 bg-black/70 rounded-full">
              <h2 className="text-2xl font-bold mb-4">Mission Briefing</h2>
              <p className="text-lg text-gray-300 mb-4">
                Your spaceship has been damaged by an asteroid collision. JARVIS, your AI assistant, 
                will guide you through critical decisions to ensure crew survival.
              </p>
              <ul className="text-center text-gray-300 space-y-2">
                <li>• Make logical, safe decisions in emergency situations</li>
                <li>• Use your space knowledge to choose destinations</li>
                <li>• Work with JARVIS to navigate through space hazards</li>
                <li>• Complete the mission with high safety levels</li>
                <li>• ⏰ <strong>Time Limit: 5 minutes</strong></li>
              </ul>
            </div>

            <button
              onClick={handleStartMission}
              className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              🚨 Begin the Adventure
            </button>
          </div>
        </div>
      )}

      {/* Mission Screen */}
      {phase === "mission" && (
        <div className="min-h-screen bg-black relative overflow-hidden">
          {/* Layer 1 - Three.js Space Background */}
          <div className="absolute inset-0 z-[1]">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
              <ambientLight intensity={0.2} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              <Stars 
                radius={100} 
                depth={50} 
                count={8000} 
                factor={8} 
                saturation={0} 
                fade 
                speed={0.3}
              />
              <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                autoRotate 
                autoRotateSpeed={0.1}
              />
            </Canvas>
          </div>

          {/* Layer 2 - Spacecraft Interior Background */}
          <div className="absolute inset-0 z-[2] opacity-70">
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/backgrounds/spacecraftBg.png')"
              }}
            ></div>
          </div>

          {/* Timer Display */}
          <div className="absolute top-4 right-4 z-30">
            <div className="bg-red-900/80 backdrop-blur-sm rounded-lg p-2 border border-red-500/50">
              <div className="text-center">
                <div className="text-xs text-red-200 mb-1">Time Remaining</div>
                <div className={`text-lg font-bold ${
                  timeRemaining <= 60 ? 'text-red-400 animate-pulse' : 'text-white'
                }`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
              </div>
              </div>



          {/* Space Console - Left Side */}
          <div className="absolute top-1/3 left-4 transform -translate-y-1/2 z-30">
            <div className="relative bg-black/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-400/50 shadow-2xl">
              <img
                src="/gifs/space-console.gif"
                alt="Space Console"
                className="rounded-2xl max-w-[400px] max-h-[500px] w-[300px] h-[400px] object-contain"
                style={{
                  filter: jarvisSpeaking ? 'none' : 'brightness(0.85) contrast(0.9) saturate(0.8)',
                  transition: 'filter 0.5s ease-in-out'
                }}
              />
              
              {/* Console Control Buttons */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2">
                <button className="w-8 h-8 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-sm shadow-sm transition-colors">
                  <div className="w-2 h-2 bg-amber-300 rounded-full mx-auto"></div>
                </button>
                <button className="w-8 h-8 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-sm shadow-sm transition-colors">
                  <div className="w-2 h-2 bg-amber-300 rounded-full mx-auto"></div>
                </button>
                <button className="w-8 h-8 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-sm shadow-sm transition-colors">
                  <div className="w-2 h-2 bg-amber-300 rounded-full mx-auto"></div>
                </button>
                <button className="w-8 h-8 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-sm shadow-sm transition-colors">
                  <div className="w-2 h-2 bg-amber-300 rounded-full mx-auto"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Space Dashboard - Right Side */}
          <div className="absolute top-1/3 right-4 transform -translate-y-1/2 z-30">
            <div className="relative bg-black/70 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50 shadow-2xl">
              {jarvisSpeaking ? (
                <img
                  key={`dashboard-active-${Date.now()}`}
                  src="/gifs/space-dash.gif"
                  alt="Space Dashboard"
                  className="rounded-lg max-w-[500px] max-h-[400px] w-auto h-auto object-contain"
                />
              ) : (
              <img
                src="/gifs/space-dash.gif"
                alt="Space Dashboard"
                  className="rounded-lg max-w-[500px] max-h-[400px] w-auto h-auto object-contain"
                  style={{
                    filter: 'brightness(0.85) contrast(0.9) saturate(0.8)',
                    animationPlayState: 'paused'
                  }}
                />
              )}
              
              {/* Bottom Control Buttons */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <div className="flex gap-3">
                  {/* Button 1 - Red */}
                  <button 
                    className="w-14 h-14 bg-red-600 hover:bg-red-500 rounded-full border-3 border-red-400 shadow-xl transition-all duration-200 hover:scale-105"
                    onClick={() => console.log("Red button clicked")}
                  >
                    <div className="w-4 h-4 bg-red-100 rounded-full mx-auto animate-pulse"></div>
                  </button>
                  
                  {/* Button 2 - Yellow */}
                  <button 
                    className="w-14 h-14 bg-yellow-600 hover:bg-yellow-500 rounded-full border-3 border-yellow-400 shadow-xl transition-all duration-200 hover:scale-105"
                    onClick={() => console.log("Yellow button clicked")}
                  >
                    <div className="w-4 h-4 bg-yellow-100 rounded-full mx-auto animate-pulse"></div>
                  </button>
                  
                  {/* Button 3 - Green */}
                  <button 
                    className="w-14 h-14 bg-green-600 hover:bg-green-500 rounded-full border-3 border-green-400 shadow-xl transition-all duration-200 hover:scale-105"
                    onClick={() => console.log("Green button clicked")}
                  >
                    <div className="w-4 h-4 bg-green-100 rounded-full mx-auto animate-pulse"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

                    {/* Central Console Chat Display */}
          <div className="absolute left-1/3 transform -translate-x-1/2 z-30 w-[450px] max-h-72" style={{ top: '35%' }}>
            <div className="bg-transparent border border-green-400/30 rounded-lg p-6 shadow-lg">
              <div className="text-center mb-4">
                <div className="text-sm font-mono text-green-400 tracking-wider opacity-70">MISSION_LOG.TXT</div>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-green-400/50">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className="font-mono text-sm">
                    <div className={`${
                    msg.speaker === "JARVIS" 
                        ? "text-green-400" 
                        : "text-green-300"
                    } opacity-80`}>
                      <span className="text-green-500 opacity-60">[{msg.speaker}]:</span> {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              {conversationHistory.length === 0 && (
                <div className="text-green-400/50 font-mono text-sm text-center py-6">
                  AWAITING_TRANSMISSION...
                </div>
              )}
            </div>
            

            </div>
            


          {/* Voice Call Controls - Bottom Area */}
          <div className="absolute left-1/2 transform -translate-x-1/2 z-30" style={{ top: '60%' }}>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  console.log("🎤 [Voice] Mute/Unmute clicked, current state:", { micActive, listening });
                  
                  if (micActive) {
                    console.log("🎤 [Voice] Muting and sending transcript...");
                    SpeechRecognition.stopListening();
                    setMicActive(false);
                    
                    // Send current transcript if it exists
                    if (transcript.trim() && transcript.trim().length > 2) {
                      console.log("🎤 [Voice] Sending transcript:", transcript);
                      processUserDecision(transcript);
                      resetTranscript();
                    }
                  } else {
                    console.log("🎤 [Voice] Unmuting...");
                    setMicActive(true);
                    SpeechRecognition.startListening({ 
                      continuous: true,
                      interimResults: false,
                      language: 'en-US'
                    });
                  }
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  micActive
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {micActive ? "🔇 Mute & Send" : "🎤 Unmute"}
              </button>
              
              <button
                onClick={() => {
                  setPhase("completion");
                  setShowCompletion(true);
                  setTimerActive(false);
                  if (listening) {
                    SpeechRecognition.stopListening();
                  }
                  setMicActive(false);
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
              >
                🛑 End Mission
              </button>
            </div>
          </div>

          {/* Mic Active Indicator - Above Call Options */}
          {micActive && (
            <div className="absolute left-1/2 transform -translate-x-1/2 z-30" style={{ top: '50%' }}>
              <SoundWave speaking={micActive} />
            </div>
          )}
        </div>
      )}
      
      {/* Minimalistic Footer */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
        <div className="text-xs text-white/50 font-light tracking-wide">
          speakgrade © 2025 B&B Global. All rights reserved.
        </div>
      </div>
      </div>
    );
}
