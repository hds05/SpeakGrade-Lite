"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircleIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function PurchasePage(): React.JSX.Element {
  const [isProcessing, setIsProcessing] = useState(false);

  const features = [
    "Access to all 12 communication scenarios",
    "AI-powered conversation practice",
    "Real-time feedback and scoring",
    // "Progress tracking and analytics",
    "Mobile-responsive interface",
    "Lifetime access",
  ];

  const handlePurchase = () => {
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      // In a real implementation, you would integrate with PayPal here
      // For now, we'll simulate a successful purchase
      localStorage.setItem('speakgrade_purchase_status', 'purchased');
      
      // Redirect to sign-up with purchase context
      window.location.href = '/sign-up?purchased=true';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      {/* Floating Clouds Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={400}
          height={160}
          className="absolute top-9 left-2 w-32 h-16 sm:w-48 sm:h-24 md:w-64 md:h-32 lg:w-96 lg:h-32 xl:w-[400px] xl:h-40 animate-floatX"
          priority
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={320}
          height={128}
          className="absolute top-20 right-2 w-24 h-12 sm:w-32 sm:h-16 md:w-48 md:h-24 lg:w-64 lg:h-24 xl:w-80 xl:h-32 opacity-100 animate-floatX"
          priority
        />
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
          width={288}
          height={112}
          className="absolute top-60 right-1/9 w-28 h-14 sm:w-36 sm:h-18 md:w-48 md:h-24 lg:w-56 lg:h-28 xl:w-72 xl:h-28 opacity-80 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={224}
          height={80}
          className="absolute bottom-18 right-1/8 w-20 h-10 sm:w-28 sm:h-14 md:w-40 md:h-20 lg:w-48 lg:h-20 xl:w-56 xl:h-20 opacity-75 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={500}
          height={160}
          className="absolute bottom-16 left-1/6 w-40 h-20 sm:w-64 sm:h-32 md:w-96 md:h-40 lg:w-[400px] lg:h-40 xl:w-[500px] xl:h-40 opacity-98 animate-floatX"
        />
        {/* Gentle mist effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/15 to-transparent"></div>
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex justify-between items-center p-6 sm:p-8"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-2xl font-bold text-gray-800"
        >
          SpeakGrade
        </motion.div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
              Get SpeakGrade Lite
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock AI-powered communication training
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/60"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
                <CheckCircleIcon className="w-4 h-4" />
                One-time Payment
              </div>
              <div className="text-6xl font-bold text-gray-800 mb-2">$100</div>
              <p className="text-gray-600">Lifetime access to SpeakGrade Lite</p>
            </div>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={handlePurchase}
              disabled={isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
                  <CreditCardIcon className="w-5 h-5" />
                  Purchase with PayPal - $100
                </div>
              )}
            </motion.button>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Secure payment powered by PayPal</span>
              </div>
            </div>
          </motion.div>

          {/* Features & Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            {/* <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-500" />
                What You Get
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li>• 12 realistic communication scenarios</li>
                <li>• AI-powered conversation practice</li>
                <li>• Real-time feedback and scoring</li>
                <li>• Progress tracking dashboard</li>
                <li>• Mobile-friendly interface</li>
                <li>• Lifetime access</li>
              </ul>
            </div> */}

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                Why Choose Us
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li>• Proven AI technology</li>
                {/* <li>• Used by 10,000+ professionals</li> */}
                <li>• 95% success rate</li>
                <li>• 24/7 customer support</li>
                <li>• 7-day money-back guarantee</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🎯 Limited Time Offer
              </h3>
              <p className="text-gray-600 text-sm">
                Get lifetime access to SpeakGrade Lite for just $100. 
                Regular price will be $200 after this promotion ends.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
