"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Script from "next/script";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import EnglishGuideBotGuard from "./EnglishGuideBotGuard";

export default function EnglishGuideBot() {
  const [showPopup, setShowPopup] = useState(true);
  const [showWidget, setShowWidget] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const router = useRouter();

  const handleClose = () => setShowPopup(false);

  useEffect(() => {
    const hasUsedWidget = localStorage.getItem("level1Completed_widget");
    let widgetTimer: NodeJS.Timeout;
    let widgetLoadDelay: NodeJS.Timeout;

    if (hasUsedWidget) {
      setShowWidget(false);
      setShowCompletion(true);
      return;
    }

    widgetLoadDelay = setTimeout(() => {
      setShowWidget(true);

      widgetTimer = setTimeout(() => {
        setShowWidget(false);
        setShowCompletion(true);
        localStorage.setItem("level1Completed_widget", "true");
      }, 3 * 60 * 1000); // 3 minutes
    }, 1500); // Load delay

    return () => {
      clearTimeout(widgetLoadDelay);
      clearTimeout(widgetTimer);
    };
  }, []);

  return (
    <EnglishGuideBotGuard>
      <div className="relative min-h-screen text-white overflow-hidden">
        {/* Layer 1 - Background Image */}
        <div className="absolute inset-0 z-[1]">
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
              backgroundImage: "url('/backgrounds/englishBg.png')"
              }}
            ></div>
        </div>

        {/* Completion Screen */}
        {showCompletion ? (
          <div className="relative z-10 min-h-[85vh] flex flex-col justify-center items-center text-center px-4 animate__animated animate__fadeInUp">
            <Confetti style={{ width: "100%" }} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-400 mb-2">
              🎉 Test Completed!
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-md">
              Thanks for participating! Your results are being processed.
            </p>
            <button
              className="inline-block mt-6 px-6 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-violet-500 hover:text-white"
              onClick={() => router.push("/main")}
            >
              End Session
            </button>
          </div>
        ) : (
          <div className="relative min-h-screen flex flex-col items-center justify-center z-10">
            {/* AI Coach Avatar - Left Side */}
            <div className="absolute top-1/3 left-4 transform -translate-y-1/2 z-30">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-blue-400 bg-white shadow-md overflow-hidden">
                <Image
                    src="/avatars/english-young-man.png"
                    alt="English Coach"
                    width={160}
                    height={160}
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="mt-2 text-lg font-medium text-white bg-black rounded-full px-4 py-2 ring-2 ring-white">
                  AI English Coach
                </span>
              </div>
            </div>

            {/* User Avatar - Right Side */}
            <div className="absolute top-1/3 right-4 transform -translate-y-1/2 z-30">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-green-400 bg-white shadow-md overflow-hidden">
                  <Image
                    src="/avatars/user-avatar.png"
                    alt="You"
                    width={160}
                    height={160}
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="mt-2 text-lg font-medium text-white bg-black rounded-full px-4 py-2 ring-2 ring-white">
                  You
                </span>
              </div>
            </div>

            {/* Conversation Wave Animation - Between Avatars */}
            {showWidget && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                <div className="flex items-center justify-center space-x-1">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-blue-500 to-green-400 rounded-full"
                      style={{
                        height: `${10 + (i === 3 ? 25 : Math.sin(i) * 15 + 15)}px`,
                        animation: `speechWave 0.8s ease-in-out infinite`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
                <style jsx>{`
                  @keyframes speechWave {
                    0%, 100% { transform: scaleY(0.3); opacity: 0.6; }
                    50% { transform: scaleY(1); opacity: 1; }
                  }
                `}</style>
              </div>
            )}

            {/* Centered Widget (Hidden) */}
            {showWidget && (
              <div className="z-30 flex justify-center items-center opacity-0 pointer-events-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: `<elevenlabs-convai agent-id="agent_4501k1tk0ntff8rv8et3d804erbq"></elevenlabs-convai>`,
                  }}
                />
                <Script
                  src="https://unpkg.com/@elevenlabs/convai-widget-embed"
                  strategy="afterInteractive"
                />
              </div>
            )}

            {/* Title - Top Center */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                🚀 AI English Fluency Guide
              </h1>
              <p className="text-sm text-gray-300 mt-2">
                Speak naturally and get instant feedback
              </p>
            </div>
          </div>
        )}
        
        {/* Minimalistic Footer */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
          <div className="text-xs text-white/50 font-light tracking-wide">
            speakgrade © 2025 B&B Global. All rights reserved.
          </div>
        </div>
    </div>
    </EnglishGuideBotGuard>
  );
}
