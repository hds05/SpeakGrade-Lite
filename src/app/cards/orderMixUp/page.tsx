"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";

export default function OrderMixUp() {
  const [phase, setPhase] = useState<string>("intro");
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [issuesResolved, setIssuesResolved] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [mikeSpeaking, setMikeSpeaking] = useState(false);
  
  const router = useRouter();

  // Order details for reference
  const orderIssues = [
    { id: "burger_onions", description: "Burger has onions (ordered NO onions)", resolved: false },
    { id: "fries_size", description: "Got small fries (ordered medium)", resolved: false },
    { id: "drink_type", description: "Got diet Coke (ordered regular)", resolved: false },
    { id: "missing_rings", description: "Missing onion rings from coupon", resolved: false }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          handleUserInput(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }

    // Cleanup on component unmount
    return () => {
      if (recognition) {
        recognition.stop();
        if (recognition.abort) {
          recognition.abort();
        }
      }
    };
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Complete audio and microphone shutdown
  const completeAudioShutdown = () => {
    // Stop speech recognition completely
    if (recognition) {
      recognition.stop();
      if (recognition.abort) {
        recognition.abort(); // Force kill recognition session
      }
    }
    setIsListening(false);
    setMikeSpeaking(false);
    setTranscript("");
  };

  const handleUserInput = async (userMessage: string) => {
    if (isLoading || !userMessage.trim()) return;

    setIsLoading(true);
    stopListening();

    const newHistory = [...conversationHistory, { role: "user", content: userMessage }];
    setConversationHistory(newHistory);

    try {
      // Send to API
      const response = await fetch('/api/orderMixUp/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: newHistory,
          currentScore,
          questionCount,
          issuesResolved
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      // Update conversation state
      setConversationHistory([...newHistory, { role: "assistant", content: data.response }]);
      setCurrentScore(data.score || currentScore);
      setQuestionCount(data.questionCount || questionCount + 1);
      setIssuesResolved(data.issuesResolved || issuesResolved);

      // Play Mike's response
      await playMikeResponse(data.response);

      // Check if conversation should end
      if (data.conversationComplete || data.issuesResolved?.length >= 4 || questionCount >= 9) {
        setTimeout(() => {
          completeAudioShutdown();
          setShowCompletion(true);
          saveScore();
        }, 2000);
      }

    } catch (error) {
      console.error('Error in conversation:', error);
    } finally {
      setIsLoading(false);
      setTranscript("");
    }
  };

  const playMikeResponse = async (text: string) => {
    try {
      setMikeSpeaking(true);
      const response = await fetch('/api/orderMixUp/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setMikeSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setMikeSpeaking(false);
    }
  };

  const saveScore = () => {
    try {
      const scoreData = {
        cardId: "Order Mix-Up",
        score: currentScore,
        maxScore: 100,
        percentage: Math.round((currentScore / 100) * 100),
        completed: true,
        lastUpdated: new Date().toISOString()
      };

      const existingScores = JSON.parse(localStorage.getItem('speakGrade_scores') || '[]');
      const scoreIndex = existingScores.findIndex((s: any) => s.cardId === scoreData.cardId);
      
      if (scoreIndex >= 0) {
        existingScores[scoreIndex] = scoreData;
      } else {
        existingScores.push(scoreData);
      }

      localStorage.setItem('speakGrade_scores', JSON.stringify(existingScores));

      // Dispatch event for score update
      window.dispatchEvent(new CustomEvent('scoresUpdated', { 
        detail: scoreData 
      }));
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const handleStart = () => {
    setShowIntroPopup(false);
    setPhase("main");
    
    // Start with Mike's greeting
    const greeting = "Hi there—what can I help you with today?";
    setConversationHistory([{ role: "assistant", content: greeting }]);
    playMikeResponse(greeting);
  };

  if (showCompletion) {
    return (
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
           style={{
             backgroundImage: "url('/backgrounds/fastFoodBg.png')",
           }}>
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-black/70 z-0"></div>
        
        {/* Confetti */}
        <Confetti className="w-full h-full z-10" />
        
        {/* Content */}
        <div className="relative z-20 max-w-4xl w-full px-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-6">
            🎉 Order Issue Resolved!
          </h2>
          
          {/* Score Grid - Standardized design */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-6 border border-green-400/20">
              <h3 className="text-2xl font-bold text-green-300 mb-2">Score</h3>
              <p className="text-3xl font-bold text-white">{currentScore}/100</p>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-400/20">
              <h3 className="text-2xl font-bold text-blue-300 mb-2">Percentage</h3>
              <p className="text-3xl font-bold text-white">{Math.round((currentScore/100) * 100)}%</p>
            </div>
            <div className="bg-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
              <h3 className="text-2xl font-bold text-purple-300 mb-2">Issues Fixed</h3>
              <p className="text-3xl font-bold text-white">{issuesResolved.length}/4</p>
            </div>
          </div>

          {/* Feedback Display */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">📊 Your Performance</h3>
            <p className="text-white text-sm leading-relaxed">
              Great job handling the drive-thru mix-up professionally! You successfully addressed {issuesResolved.length} out of 4 order issues and demonstrated excellent customer service communication skills in a challenging situation.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg border border-green-400/30"
            >
              🏠 Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-orange-100 to-red-100 text-gray-800">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-70 overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/backgrounds/fastFoodBg.png')",
            filter: 'blur(3px) brightness(1.1)',
            transform: 'scale(1.1)'
          }}
        ></div>
      </div>

      {/* Intro Popup */}
      {showIntroPopup && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
              🍔 Order Mix-Up at Burger Express
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">🚨 Your Order is Wrong!</h3>
                <ul className="text-xs space-y-1">
                  <li>• Burger HAS onions (you ordered NO onions)</li>
                  <li>• Got SMALL fries (you ordered medium)</li>
                  <li>• Got DIET Coke (you ordered regular)</li>
                  <li>• Missing onion rings from your coupon</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">🎯 Your Goal</h3>
                <ul className="text-xs space-y-1">
                  <li>• Explain each problem clearly</li>
                  <li>• Be specific about what's wrong</li>
                  <li>• Show your receipt and coupon when asked</li>
                  <li>• Get all 4 issues fixed professionally</li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={handleStart}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300"
            >
              Start Drive-Thru Conversation
            </button>
          </div>
        </div>
      )}

      {/* Main Game Interface */}
      <div className="relative z-[2] flex flex-col items-center justify-center min-h-screen p-4">
        
        {/* Mike Avatar */}
        <div className="absolute top-1/4 left-4 transform -translate-y-1/2 z-30">
          <div className="flex flex-col items-center">
            <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 bg-white shadow-lg overflow-hidden transition-all duration-300 ${
              mikeSpeaking ? 'border-orange-400 scale-110' : 'border-blue-400'
            }`}>
              <Image
                src="/avatars/fastFood-young-man.png"
                alt="Mike - Cashier"
                width={160}
                height={160}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="mt-2 text-lg font-medium text-white bg-orange-600 rounded-full px-4 py-2 ring-2 ring-white">
              Mike - Cashier
            </span>
          </div>
        </div>

        {/* User Avatar */}
        <div className="absolute top-1/4 right-4 transform -translate-y-1/2 z-30">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-green-400 bg-white shadow-lg overflow-hidden">
              <Image
                src="/avatars/user-avatar.png"
                alt="You"
                width={160}
                height={160}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="mt-2 text-lg font-medium text-white bg-green-600 rounded-full px-4 py-2 ring-2 ring-white">
              You (Customer)
            </span>
          </div>
        </div>

        {/* Status Display */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{currentScore}/100</div>
              <div className="text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{questionCount}/10</div>
              <div className="text-gray-600">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{issuesResolved.length}/4</div>
              <div className="text-gray-600">Issues Fixed</div>
            </div>
          </div>
        </div>

        {/* Microphone Control */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading || showCompletion}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-110'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '⏳' : isListening ? '🔴' : '🎤'}
          </button>
          <p className="text-center mt-2 text-sm font-medium text-gray-700">
            {isLoading ? 'Processing...' : isListening ? 'Listening...' : 'Tap to Speak'}
          </p>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="absolute bottom-48 left-1/2 transform -translate-x-1/2 z-30 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg max-w-md">
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
        <div className="text-xs text-gray-600 font-light tracking-wide">
          speakgrade © 2025 B&B Global. All rights reserved.
        </div>
      </div>
    </div>
  );
}
