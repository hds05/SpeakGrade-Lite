"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  ChartBarIcon,
  SparklesIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  PlayIcon,
  StarIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function LandingPage(): React.JSX.Element {
  const features = [
    {
      icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-500" />,
      title: "AI-Powered Conversations",
      description: "Practice with intelligent AI agents that adapt to your speaking level and provide real-time feedback.",
    },
    {
      icon: <AcademicCapIcon className="w-8 h-8 text-purple-500" />,
      title: "Real-World Scenarios",
      description: "Master communication through realistic scenarios like job interviews, customer service, and emergency situations.",
    },
    {
      icon: <ChartBarIcon className="w-8 h-8 text-green-500" />,
      title: "Progress Tracking",
      description: "Monitor your improvement with detailed analytics and personalized recommendations for growth.",
    },
    {
      icon: <SparklesIcon className="w-8 h-8 text-yellow-500" />,
      title: "Instant Feedback",
      description: "Get immediate insights on pronunciation, fluency, and confidence to accelerate your learning.",
    },
    {
      icon: <UserGroupIcon className="w-8 h-8 text-pink-500" />,
      title: "Multiple Characters",
      description: "Interact with diverse AI personalities to prepare for any conversation situation.",
    },
    {
      icon: <RocketLaunchIcon className="w-8 h-8 text-indigo-500" />,
      title: "Confidence Building",
      description: "Build speaking confidence through safe, judgment-free practice sessions.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Manager",
      text: "SpeakGrade helped me ace my job interview! The AI feedback was incredibly helpful.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      text: "The realistic scenarios made me feel prepared for any conversation. Highly recommended!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Student",
      text: "Perfect for building confidence. The AI agents are so realistic and helpful.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 5,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
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
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={384}
          height={128}
          className="absolute top-32 right-1/4 w-32 h-16 sm:w-48 sm:h-24 md:w-64 md:h-32 lg:w-80 lg:h-32 xl:w-96 xl:h-32 opacity-85 animate-drift"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={128}
          height={64}
          className="absolute top-80 left-2 w-16 h-8 sm:w-20 sm:h-10 md:w-24 md:h-12 lg:w-28 lg:h-14 xl:w-32 xl:h-16 opacity-70 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={112}
          height={56}
          className="absolute top-72 right-2 w-12 h-6 sm:w-16 sm:h-8 md:w-20 md:h-10 lg:w-24 lg:h-12 xl:w-28 xl:h-14 opacity-65 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={128}
          height={64}
          className="absolute top-64 left-1/2 w-16 h-8 sm:w-20 sm:h-10 md:w-24 md:h-12 lg:w-28 lg:h-14 xl:w-32 xl:h-16 opacity-60 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={112}
          height={56}
          className="absolute top-48 left-2 w-12 h-6 sm:w-16 sm:h-8 md:w-20 md:h-10 lg:w-24 lg:h-12 xl:w-28 xl:h-14 opacity-70 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={120}
          height={60}
          className="absolute top-56 right-2 w-14 h-7 sm:w-18 sm:h-9 md:w-22 md:h-11 lg:w-26 lg:h-13 xl:w-30 xl:h-15 opacity-75 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={144}
          height={72}
          className="absolute top-24 left-1/2 w-20 h-10 sm:w-24 sm:h-12 md:w-28 md:h-14 lg:w-32 lg:h-16 xl:w-36 xl:h-18 opacity-90 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={128}
          height={64}
          className="absolute top-36 right-2 w-16 h-8 sm:w-20 sm:h-10 md:w-24 md:h-12 lg:w-28 lg:h-14 xl:w-32 xl:h-16 opacity-80 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={136}
          height={68}
          className="absolute top-44 left-2 w-18 h-9 sm:w-22 sm:h-11 md:w-26 md:h-13 lg:w-30 lg:h-15 xl:w-34 xl:h-17 opacity-85 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={224}
          height={112}
          className="absolute bottom-20 left-3 w-24 h-12 sm:w-32 sm:h-16 md:w-40 md:h-20 lg:w-48 lg:h-24 xl:w-56 xl:h-28 opacity-90 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={208}
          height={104}
          className="absolute bottom-32 right-1/4 w-20 h-10 sm:w-28 sm:h-14 md:w-36 md:h-18 lg:w-44 lg:h-22 xl:w-52 xl:h-26 opacity-85 animate-floatX"
        />
        <Image
          src="/backgrounds/cartooncloud.webp"
          alt="Floating cloud"
          width={128}
          height={64}
          className="absolute bottom-16 left-1/2 w-16 h-8 sm:w-20 sm:h-10 md:w-24 md:h-12 lg:w-28 lg:h-14 xl:w-32 xl:h-16 opacity-80 animate-floatX"
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
         <div className="flex gap-4">
           <Link
             href="/dashboard"
             className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
           >
             Dashboard
           </Link>
           <Link
             href="/"
             className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
           >
             Learn More
           </Link>
         </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center py-12 sm:py-16 lg:py-20 px-6 sm:px-8"
      >
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <motion.h1
            variants={itemVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-800 mb-6 leading-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
              Master Communication
            </span>
            <br />
            <span className="text-gray-700">with AI-Powered Practice</span>
          </motion.h1>
          
          <motion.p
            variants={itemVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Build confidence through realistic conversations with intelligent AI agents. 
            Practice job interviews, customer service, emergency situations, and more.
          </motion.p>

          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link
              href="/dashboard"
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                Start Practicing
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold text-lg border border-gray-200 hover:border-gray-300 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <PlayIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                Watch Demo
              </span>
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
          >
            {[
              { number: "10K+", label: "Users" },
              { number: "50+", label: "Scenarios" },
              { number: "95%", label: "Success Rate" },
              { number: "24/7", label: "Available" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section 1 */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 py-16 sm:py-20 px-6 sm:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              Why Choose SpeakGrade?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform provides the most realistic and effective 
              communication training available.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                transition={{ duration: 0.6, ease: "easeOut" }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="group p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

             {/* Product Screenshots Section */}
       <motion.section
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         viewport={{ once: true }}
         transition={{ duration: 0.8 }}
         className="relative z-10 py-16 sm:py-20 px-6 sm:px-8"
       >
         <div className="max-w-6xl mx-auto">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
             className="text-center mb-16"
           >
             <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
               See SpeakGrade in Action
             </h2>
             <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
               Experience our AI-powered communication training platform through these screenshots
             </p>
           </motion.div>

           <motion.div
             variants={containerVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="grid grid-cols-1 lg:grid-cols-2 gap-8"
           >
             {/* Dashboard Screenshot */}
             <motion.div
               variants={itemVariants}
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="group"
             >
               <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-white p-4">
                 <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
                   <div className="text-center">
                     <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                       <ChartBarIcon className="w-8 h-8 text-white" />
                     </div>
                     <p className="text-gray-600 font-medium">Dashboard Screenshot</p>
                     <p className="text-sm text-gray-500 mt-2">Replace with actual dashboard image</p>
                   </div>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               </div>
               <h3 className="text-xl font-semibold text-gray-800 mt-4 text-center">
                 Interactive Dashboard
               </h3>
               <p className="text-gray-600 text-center mt-2">
                 Track your progress and access all scenarios from one place
               </p>
             </motion.div>

             {/* Conversation Interface Screenshot */}
             <motion.div
               variants={itemVariants}
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="group"
             >
               <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-white p-4">
                 <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
                   <div className="text-center">
                     <div className="w-16 h-16 bg-green-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                       <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
                     </div>
                     <p className="text-gray-600 font-medium">Conversation Interface</p>
                     <p className="text-sm text-gray-500 mt-2">Replace with actual chat interface image</p>
                   </div>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               </div>
               <h3 className="text-xl font-semibold text-gray-800 mt-4 text-center">
                 AI Conversation Interface
               </h3>
               <p className="text-gray-600 text-center mt-2">
                 Engage in realistic conversations with intelligent AI agents
               </p>
             </motion.div>

             {/* Mobile App Screenshot */}
             <motion.div
               variants={itemVariants}
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="group"
             >
               <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-white p-4">
                 <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
                   <div className="text-center">
                     <div className="w-16 h-16 bg-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                       <RocketLaunchIcon className="w-8 h-8 text-white" />
                     </div>
                     <p className="text-gray-600 font-medium">Mobile Interface</p>
                     <p className="text-sm text-gray-500 mt-2">Replace with actual mobile app image</p>
                   </div>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               </div>
               <h3 className="text-xl font-semibold text-gray-800 mt-4 text-center">
                 Mobile Experience
               </h3>
               <p className="text-gray-600 text-center mt-2">
                 Practice anywhere with our responsive mobile interface
               </p>
             </motion.div>

             {/* Analytics Screenshot */}
             <motion.div
               variants={itemVariants}
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="group"
             >
               <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-white p-4">
                 <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
                   <div className="text-center">
                     <div className="w-16 h-16 bg-yellow-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                       <SparklesIcon className="w-8 h-8 text-white" />
                     </div>
                     <p className="text-gray-600 font-medium">Analytics Dashboard</p>
                     <p className="text-sm text-gray-500 mt-2">Replace with actual analytics image</p>
                   </div>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               </div>
               <h3 className="text-xl font-semibold text-gray-800 mt-4 text-center">
                 Performance Analytics
               </h3>
               <p className="text-gray-600 text-center mt-2">
                 Get detailed insights into your communication progress
               </p>
             </motion.div>
           </motion.div>
         </div>
       </motion.section>

       {/* Features Section 2 - How It Works */}
       <motion.section
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         viewport={{ once: true }}
         transition={{ duration: 0.8 }}
         className="relative z-10 py-16 sm:py-20 px-6 sm:px-8 bg-white/30 backdrop-blur-sm"
       >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and begin improving your communication skills immediately.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
                         {[
               {
                 step: "01",
                 title: "Choose Your Scenario",
                 description: "Select from job interviews, customer service, emergency situations, and more.",
                 image: "/cards/interview-room.png",
                 placeholder: "Scenario Selection Screenshot",
               },
               {
                 step: "02", 
                 title: "Start the Conversation",
                 description: "Engage with our AI agents in realistic, interactive conversations.",
                 image: "/cards/emergency-911.png",
                 placeholder: "AI Chat Interface Screenshot",
               },
               {
                 step: "03",
                 title: "Get Instant Feedback",
                 description: "Receive detailed feedback on your performance and areas for improvement.",
                 image: "/cards/spacecraft.png",
                 placeholder: "Feedback Dashboard Screenshot",
               },
             ].map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center group"
              >
                                 <motion.div
                   whileHover={{ scale: 1.05 }}
                   className="relative mb-6"
                 >
                   <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 border-2 border-dashed border-blue-200">
                     <div className="text-center">
                       <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                         <span className="text-white font-bold text-lg">{step.step}</span>
                       </div>
                       <p className="text-xs text-gray-600 font-medium">{step.placeholder}</p>
                     </div>
                   </div>
                   <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                     {step.step}
                   </div>
                 </motion.div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 py-16 sm:py-20 px-6 sm:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              What Our Users Say
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of users who have improved their communication skills with SpeakGrade.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                transition={{ duration: 0.6, ease: "easeOut" }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={50}
                    height={50}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {testimonial.role}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "{testimonial.text}"
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 py-16 sm:py-20 px-6 sm:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="p-8 sm:p-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl shadow-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Communication?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have already improved their speaking confidence with SpeakGrade.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Start Your Journey Today
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 py-8 px-6 sm:px-8 border-t border-white/30"
      >
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-bold text-gray-800 mb-4">
            SpeakGrade
          </div>
          <p className="text-gray-600 mb-4">
            Master communication with AI-powered practice
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-800 transition-colors duration-200">
              Dashboard
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-800 transition-colors duration-200">
              About
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-800 transition-colors duration-200">
              Contact
            </Link>
          </div>
        </div>
      </motion.footer>
      {/* Minimalistic Footer */}
      <div className="flex justify-center py-6">
          <div className="text-xs text-gray-500 font-light tracking-wide">
            speakgrade © 2025 B&B Global. All rights reserved.
          </div>
        </div>
    </div>
  );
}
