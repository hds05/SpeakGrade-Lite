"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  StarIcon,
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface Feature {
  icon: React.JSX.Element;
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  text: string;
  avatar: string;
}

export default function UpsellPage(): React.JSX.Element {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const features: Feature[] = [
    {
      icon: <SparklesIcon className="w-8 h-8 text-purple-500" />,
      title: "50+ Advanced Scenarios",
      description: "From corporate negotiations to crisis management",
    },
    {
      icon: <UserGroupIcon className="w-8 h-8 text-blue-500" />,
      title: "AI Agents with Personalities",
      description: "Each character has unique traits and conversation styles",
    },
    {
      icon: <ChartBarIcon className="w-8 h-8 text-green-500" />,
      title: "Adaptive Difficulty",
      description: "AI that learns and adjusts to your skill level",
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8 text-red-500" />,
      title: "Real-time Feedback",
      description: "Instant analysis of your communication skills",
    },
    {
      icon: <RocketLaunchIcon className="w-8 h-8 text-orange-500" />,
      title: "Progress Tracking",
      description: "Detailed analytics and improvement suggestions",
    },
    {
      icon: <StarIcon className="w-8 h-8 text-yellow-500" />,
      title: "Premium Support",
      description: "24/7 expert assistance and custom scenarios",
    },
  ];

  const testimonials: Testimonial[] = [
    {
      name: "Sarah Johnson",
      role: "CEO",
      company: "TechCorp",
      text: "The pro version transformed our team's communication skills. ROI was immediate!",
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGdLdW_E1TPS4TdBDn-XZRKpMZYIUBwaHMv3D0P9rRYNzteiAIvjbNoe8fE7RkqdxULC0&usqp=CAU",
    },
    {
      name: "Michael Chen",
      role: "HR Director",
      company: "Global Solutions",
      text: "Our interview success rate increased by 40% after using the advanced scenarios.",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Professor",
      company: "Business School",
      text: "The AI agents are incredibly realistic. My students love the immersive experience.",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
  ];

  const handleBuyNow = (): void => {
    alert(
      "🚀 Redirecting to secure payment gateway...\n\nThis is a demo - in production, users would be redirected to Stripe/PayPal."
    );
  };

  const handleBackToDashboard = (): void => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white pb-10">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden min-h-screen flex items-center justify-center">
        {/* Dynamic background with multiple layers */}
        <Image
          src="https://static.vecteezy.com/system/resources/previews/047/395/367/non_2x/cute-cartoon-moon-png.png"
          alt="Decorative moon"
          width={120}
          height={120}
          className="absolute top-1 right-2 sm:top-1 sm:right-80 md:top-1 rounded-full w-20 h-20 sm:w-30 sm:h-30 animate-floatX z-99"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-800"></div>

        {/* Animated mesh gradient overlay */}
        {/* <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)
            `,
            backgroundSize: "800px 800px",
          }}
        /> */}

        {/* Floating geometric shapes */}
        {/* <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-40 h-40 border border-purple-400/20 rounded-full opacity-10"
        /> */}
{/* 
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.3, 1],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-40 right-10 w-32 h-32 border border-blue-400/20 rounded-full blur-sm"
        />

        <motion.div
          animate={{
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 left-1/4 w-24 h-24 border border-pink-400/20 rounded-full blur-sm"
        /> */}

        {/* Particle effect dots */}
        <div className="absolute inset-0 overflow-hidden">
          {[
            { left: 10, top: 20, duration: 3, delay: 0 },
            { left: 25, top: 45, duration: 4, delay: 0.5 },
            { left: 40, top: 15, duration: 3.5, delay: 1 },
            { left: 60, top: 70, duration: 4.5, delay: 1.5 },
            { left: 80, top: 30, duration: 3.2, delay: 2 },
            { left: 15, top: 80, duration: 4.8, delay: 0.3 },
            { left: 35, top: 60, duration: 3.7, delay: 1.2 },
            { left: 55, top: 25, duration: 4.2, delay: 0.8 },
            { left: 75, top: 85, duration: 3.9, delay: 1.7 },
            { left: 90, top: 50, duration: 4.1, delay: 0.4 },
            { left: 5, top: 75, duration: 3.3, delay: 1.9 },
            { left: 30, top: 10, duration: 4.6, delay: 0.7 },
            { left: 50, top: 90, duration: 3.8, delay: 1.4 },
            { left: 70, top: 40, duration: 4.3, delay: 0.6 },
            { left: 85, top: 65, duration: 3.4, delay: 1.8 },
            { left: 20, top: 35, duration: 4.7, delay: 0.9 },
            { left: 45, top: 55, duration: 3.6, delay: 1.3 },
            { left: 65, top: 5, duration: 4.4, delay: 0.2 },
            { left: 95, top: 95, duration: 3.1, delay: 1.6 },
            { left: 8, top: 88, duration: 4.9, delay: 0.1 },
          ].map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-full backdrop-blur-sm mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-2 h-2 bg-purple-400 rounded-full"
            />
            <span className="text-purple-300 font-medium text-sm">
              🚀 PREMIUM AI TRAINING PLATFORM
            </span>
            <motion.div
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-2 h-2 bg-blue-400 rounded-full"
            />
          </motion.div>

          {/* Main title with enhanced typography */}
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-[length:200%_200%] animate-gradient">
              Unlock
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-pink-400 to-purple-400 bg-[length:200%_200%] animate-gradient-delayed">
              Your Potential
            </span>
          </motion.h1>
          <Image
            src="/backgrounds/cartooncloud.webp"
            alt="Floating cloud"
            width={224}
            height={96}
            className="absolute top-40 left-1/8 w-20 h-10 sm:w-28 sm:h-14 md:w-36 md:h-18 lg:w-48 lg:h-20 xl:w-56 xl:h-24 opacity-85 animate-floatX"
          />
          <Image
            src="/backgrounds/cartooncloud.webp"
            alt="Floating cloud"
            width={280}
            height={160}
            className="absolute top-35 sm:top-35 right-1/8 sm:right-1 w-25 h-10 sm:w-70 sm:h-40 opacity-85 animate-floatY"
          />
          <Image
            src="/backgrounds/cartooncloud.webp"
            alt="Floating cloud"
            width={280}
            height={160}
            className="absolute bottom-40 left-1 w-70 h-40 sm:bottom-30 opacity-85 animate-floatX"
          />
          {/* Subtitle with enhanced styling */}
          <motion.p
            className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            Transform from a{" "}
            <span className="text-purple-300 font-semibold">
              good communicator
            </span>{" "}
            to an{" "}
            <span className="text-blue-300 font-semibold">exceptional one</span>{" "}
            with our{" "}
            <span className="text-pink-300 font-semibold">
              Pro AI Training Platform
            </span>
          </motion.p>

          {/* Stats section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            {[
              { number: "50+", label: "Scenarios", color: "purple" },
              { number: "10K+", label: "Users", color: "blue" },
              { number: "95%", label: "Success Rate", color: "pink" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                className="text-center"
              >
                <div
                  className={`text-3xl md:text-4xl font-bold text-${stat.color}-400 mb-2`}
                >
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced buttons */}
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <motion.button
              onClick={handleBackToDashboard}
              className="group px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl font-semibold text-white transition-all duration-300 backdrop-blur-sm"
              whileHover={{
                scale: 1.05,
                y: -2,
                boxShadow: "0 10px 25px rgba(255, 255, 255, 0.1)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Dashboard
            </motion.button>

            <motion.button
              onClick={handleBuyNow}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-bold text-lg text-white transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 overflow-hidden"
              whileHover={{
                scale: 1.05,
                y: -2,
                boxShadow: "0 20px 40px rgba(147, 51, 234, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Button shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10 flex justify-center items-center gap-2">
                🚀 Get Pro Access Now
                <motion.div
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  →
                </motion.div>
              </span>
            </motion.button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="flex flex-wrap justify-center items-center gap-6 text-gray-400 text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>🔒 Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>⚡ Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>💯 Money-back Guarantee</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-3 bg-white/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div> */}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why Choose Pro?
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Experience the most advanced AI-powered communication training
                platform ever created
              </p>
            </div>

            <div className="grid gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-300 group relative overflow-hidden"
                  whileHover={{
                    scale: 1.02,
                    x: 10,
                    transition: { duration: 0.2 },
                  }}
                >
                  {/* Animated highlight bar */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-blue-400"
                    initial={{ scaleY: 0 }}
                    whileHover={{ scaleY: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Background glow on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-2xl"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  <motion.div
                    className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/20 group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300 relative z-10"
                    whileHover={{
                      rotate: [0, -10, 10, 0],
                      scale: 1.1,
                      transition: { duration: 0.5 },
                    }}
                  >
                    {feature.icon}
                  </motion.div>
                  <div className="relative z-10">
                    <motion.h3
                      className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors duration-300 mb-2"
                      whileHover={{ x: 5 }}
                    >
                      {feature.title}
                    </motion.h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Floating sparkles */}
                  <motion.div
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{
                      rotate: [0, 360],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    ✨
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Pricing */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Enhanced Pricing Card */}
            <motion.div
              className="relative p-8 rounded-3xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-400/30 backdrop-blur-xl overflow-hidden"
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.3 },
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-3xl"></div>

              {/* Animated background pattern */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
                  backgroundSize: "400px 400px",
                }}
              />

              <div className="relative z-10 text-center">
                <div className="mb-6">
                  <span className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium mb-4">
                    🚀 LIMITED TIME OFFER
                  </span>
                  <h3 className="text-4xl font-bold text-white mb-2">
                    Pro Version
                  </h3>
                  <p className="text-gray-300">Lifetime Access</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-6xl font-bold text-white">
                      $1,000
                    </span>
                    <span className="text-2xl text-gray-400 line-through">
                      $2,500
                    </span>
                  </div>
                  <p className="text-green-400 font-semibold text-lg">
                    Save $1,500 (60% OFF!)
                  </p>
                </div>

                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">
                      Unlimited access to all scenarios
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">
                      Advanced AI agents with personalities
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">
                      Adaptive difficulty system
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">
                      Real-time performance analytics
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">
                      Priority customer support
                    </span>
                  </div>
                </div>

                <motion.button
                  onClick={handleBuyNow}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative flex items-center justify-center gap-3">
                    <span>Buy Now & Transform</span>
                    <ArrowRightIcon
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isHovered ? "translate-x-1" : ""
                      }`}
                    />
                  </div>
                </motion.button>

                <p className="text-sm text-gray-400 mt-4">
                  🔒 Secure payment • 30-day money-back guarantee
                </p>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-4 -right-4 w-8 h-8 bg-purple-400/30 rounded-full blur-sm"
            />
            <motion.div
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400/30 rounded-full blur-sm"
            />
          </motion.div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What Our Pro Users Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/30 transition-all duration-300 group relative overflow-hidden"
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.2 },
                }}
              >
                {/* Animated background glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-2xl"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <motion.img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-400/50 group-hover:border-purple-400 transition-colors duration-300"
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.5 },
                      }}
                    />
                    <div>
                      <h4 className="font-semibold text-white">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {testimonial.role}
                      </p>
                      <p className="text-xs text-purple-400">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <motion.p
                    className="text-gray-300 italic group-hover:text-gray-200 transition-colors duration-300 leading-relaxed"
                    whileHover={{ x: 5 }}
                  >
                    "{testimonial.text}"
                  </motion.p>
                </div>

                {/* Quote marks decoration */}
                <motion.div
                  className="absolute top-4 right-4 text-4xl text-purple-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  "
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Enhanced Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="mt-20 text-center"
      >
        <motion.div
          className="max-w-4xl mx-auto p-8 rounded-3xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-400/30 relative overflow-hidden"
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.3 },
          }}
        >
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
              backgroundSize: "400px 400px",
            }}
          />

          <div className="relative z-10">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-6 text-white"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              Ready to Master Communication?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              Join thousands of professionals who have transformed their
              communication skills with our Pro platform
            </motion.p>
            <motion.button
              onClick={handleBuyNow}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-bold text-xl text-white transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 relative overflow-hidden group"
            >
              {/* Button shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />

              <motion.span className="relative z-10" whileHover={{ x: 5 }}>
                Get Pro Access Now
              </motion.span>
              <motion.div
                className="relative z-10"
                whileHover={{
                  rotate: [0, 15, -15, 0],
                  transition: { duration: 0.5 },
                }}
              >
                <ArrowRightIcon className="w-6 h-6" />
              </motion.div>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      {/* Minimalistic Footer */}
      <div className="flex justify-center py-6">
          <div className="text-xs text-gray-100 font-light tracking-wide">
            speakgrade © 2025 B&B Global. All rights reserved.
          </div>
        </div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes gradient-delayed {
          0% {
            background-position: 100% 50%;
          }
          50% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }

        @keyframes floatX {
          0%, 100% { transform: translateX(0px) rotate(0deg); }
          25% { transform: translateX(15px) rotate(1deg); }
          50% { transform: translateX(-8px) rotate(-1deg); }
          75% { transform: translateX(20px) rotate(0.5deg); }
        }
        
        @keyframes floatY {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(-0.5deg); }
          50% { transform: translateY(8px) rotate(0.5deg); }
          75% { transform: translateY(-18px) rotate(-1deg); }
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animate-floatX {
          animation: floatX 25s ease-in-out infinite;
        }
        
        .animate-floatY {
          animation: floatY 30s ease-in-out infinite;
        }
        
        .animate-gradient-delayed {
          animation: gradient-delayed 3s ease infinite;
          animation-delay: 1.5s;
        }
      `}</style>
    </div>
  );
}
