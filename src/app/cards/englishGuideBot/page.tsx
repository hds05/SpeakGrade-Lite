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
      <div className="w-full min-h-screen flex justify-center items-start px-3 sm:px-6 py-6">
        <div className="relative w-full max-w-6xl min-h-[85vh] text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full z-0">
          {/* Large screen image */}
          <Image
            src="/backgrounds/englishBg.png"
            alt="English Guide Background"
            fill
            className="hidden sm:block object-cover animate__animated animate__fadeIn"
            priority
          />

          {/* Small screen image */}
          <Image
            src="https://as2.ftcdn.net/jpg/03/44/58/77/1000_F_344587784_tvDkmUpvgHnmYrUJAfTQqr2zST6KaC4J.jpg"
            alt="SpeakGrade Mobile Background"
            fill
            className="block sm:hidden object-cover animate__animated animate__fadeIn"
          />

          {/* Layer 2 - Enhanced modern background extension */}
          <div className="absolute inset-0 z-[0] opacity-70 overflow-hidden">
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/backgrounds/englishBg.png')",
                filter: 'blur(3px) brightness(1.1)',
                transform: 'scale(1.1)'
              }}
            ></div>
          </div>
        </div>

        {/* Glow */}
        <div className="absolute -top-10 -left-10 w-60 h-60 sm:w-72 sm:h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse z-10" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 sm:w-72 sm:h-72 bg-pink-500/20 rounded-full blur-2xl animate-pulse z-10" />

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
          <div className="h-full overflow-y-auto scrollbar-hidden px-3 sm:px-6 py-6 sm:py-8 space-y-10 z-10 relative">
            {/* Title */}
            <div className="z-20 relative text-center space-y-4">
              <div className="flex justify-center mb-4 sm:mb-6">
                <Image
                  src="/cards/emergency-911.png"
                  alt="SpeakGrade Logo"
                  width={80}
                  height={80}
                  className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-full border-4 border-white/20 shadow-xl"
                  priority
                />
              </div>
              <h1 className="font-extrabold text-[clamp(1.8rem,5vw,3rem)] leading-snug">
                🚀 SpeakGrade - AI English Fluency Guide
              </h1>
              <p className="text-gray-300 max-w-2xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed">
                Elevate your spoken English with real-time AI assessment. Speak
                naturally, and get instant feedback on fluency, grammar,
                vocabulary, and clarity — all in just 3 minutes.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 z-20">
              {[
                {
                  title: "🎙 Real-Time Speaking",
                  desc: "Answer dynamic questions using your microphone. Our AI listens and evaluates as you speak.",
                },
                {
                  title: "📊 Smart Feedback",
                  desc: "Instant tips on grammar, sentence structure, pronunciation, and how to improve them.",
                },
                {
                  title: "💡 Vocabulary Suggestions",
                  desc: "Used a weak or wrong word? Get real-time alternatives and examples to boost your vocab.",
                },
                {
                  title: "⏱ Lightning Fast",
                  desc: "The entire test lasts only 3 minutes — speak confidently and get results instantly.",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-white/10 shadow-lg hover:bg-white/20 transition-all duration-300"
                >
                  <h2 className="text-lg sm:text-xl font-bold">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-gray-300 text-sm sm:text-base">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Widget */}
            {showWidget && (
              <>
                <div
                  className="z-20 relative w-full flex justify-center"
                  dangerouslySetInnerHTML={{
                    __html: `<elevenlabs-convai agent-id="agent_4501k1tk0ntff8rv8et3d804erbq"></elevenlabs-convai>`,
                  }}
                />
                <Script
                  src="https://unpkg.com/@elevenlabs/convai-widget-embed"
                  strategy="afterInteractive"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </EnglishGuideBotGuard>
  );
}
