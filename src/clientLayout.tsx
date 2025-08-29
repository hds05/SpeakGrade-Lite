"use client";

import { useState, useEffect, ReactNode } from "react";
import Image from "next/image";
import Loader from "./app/components/loader/page";
import Header from "./app/components/header/page";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

interface ComponentItem {
  id: number;
  title: string;
  description: string;
  image: string;
  path?: string;
  isLocked?: boolean;
  requiredScore?: number;
}

interface CardScore {
  cardId: string;
  score: number;
  maxScore: number;
  percentage: number;
  completed: boolean;
  lastUpdated: string;
}

interface UnlockState {
  advancedCardsUnlocked: boolean;
  popupShown: boolean;
  unlockedAt: string | null;
}

// Example component data
const componentsList: ComponentItem[] = [
  {
    id: 1,
    title: "Weekly Check with Manager",
    description: "Workplace conversation with your manager.",
    image: "/cards/weekly-manager.png",
    path: "/cards/weeklyCheckWithManager",
    isLocked: false,
    requiredScore: 0,
  },
  {
    id: 2,
    title: "Parking Ticket Encounter",
    description: "Police encounter - Explain your parking situation.",
    image: "/cards/parking-ticket.png",
    path: "/cards/parkingTicket",
    isLocked: false,
    requiredScore: 0,
  },
  {
    id: 3,
    title: "Outlet Customer Service",
    description:
      "You're a customer at Fashion Outlet with multiple issues that need to be resolved at checkout.",
    image: "/cards/outlet-customer.png",
    path: "/cards/outletCustomer",
    isLocked: false,
    requiredScore: 0,
  },
  {
    id: 4,
    title: "Emergency 911 Dispatcher",
    description: "You have called 911. Tell them your Emergency.",
    image: "/cards/emergency-911.png",
    path: "/cards/emergency911",
    isLocked: false,
    requiredScore: 0,
  },
  {
    id: 5,
    title: "Spacecraft Simulation",
    description:
      "Take control of a spacecraft and experience the thrill of space travel.",
    image: "/cards/spacecraft.png",
    path: "/cards/SpacecraftSimulation",
    isLocked: false,
    requiredScore: 0,
  },
  {
    id: 6,
    title: "English Guide Bot",
    description:
      "AI-powered English fluency assessment with real-time feedback and vocabulary suggestions.",
    image: "/cards/emergency-911.png", // TODO: Replace with ai-chatbot.png when available
    path: "/cards/englishGuideBot",
    isLocked: true,
    requiredScore: 60,
  },
  {
    id: 7,
    title: "Interview Room",
    description:
      "You are in a professional interview room with three interviewers. ",
    image: "/cards/interview-room.png",
    path: "/cards/interviewRoom",
    isLocked: true,
    requiredScore: 60,
  },
];

interface ClientLayoutProps {
  children?: ReactNode;
}

export default function ClientLayout({
  children,
}: ClientLayoutProps): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<CardScore[]>([]);
  const [unlockState, setUnlockState] = useState<UnlockState>({
    advancedCardsUnlocked: false,
    popupShown: false,
    unlockedAt: null,
  });
  const [isUnlocking, setIsUnlocking] = useState(false);
  const router = useRouter();

  // Load scores and unlock state from localStorage
  useEffect(() => {
    const loadStoredData = () => {
      try {
        // Load scores
        const storedScores = localStorage.getItem('speakGrade_scores');
        if (storedScores) {
          setScores(JSON.parse(storedScores));
        }

        // Load unlock state
        const storedUnlockState = localStorage.getItem('speakGrade_unlockState');
        if (storedUnlockState) {
          setUnlockState(JSON.parse(storedUnlockState));
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };

    loadStoredData();

    // Listen for storage changes to refresh scores when scenarios complete
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'speakGrade_scores') {
        console.log('🔄 Scores updated in localStorage, refreshing...');
        loadStoredData();
      }
    };

    // Listen for custom events when scores are updated
    const handleScoresUpdated = (e: CustomEvent) => {
      console.log('🔄 Scores updated via custom event:', e.detail);
      loadStoredData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('scoresUpdated', handleScoresUpdated as EventListener);

    // Also refresh when the page becomes visible (user returns from scenario)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, refreshing scores...');
        loadStoredData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('scoresUpdated', handleScoresUpdated as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Check URL parameters for locked states
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lockedParam = urlParams.get('locked');
    const errorParam = urlParams.get('error');

    if (lockedParam === 'interview' || lockedParam === 'advanced') {
      const averageScore = calculateAverageScore();
      
      Swal.fire({
        title: '🔒 Access Restricted',
        html: `
          <div class="text-left">
            <p class="mb-4 text-gray-700">
              Advanced features are currently locked and require advanced skills to unlock.
            </p>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 class="font-semibold text-red-800 mb-2">📊 Current Progress</h4>
              <div class="flex items-center space-x-3">
                <div class="text-2xl font-bold text-red-600">${averageScore}%</div>
                <div class="text-sm text-red-600">Average Score</div>
              </div>
              <div class="mt-2">
                <div class="w-full bg-red-200 rounded-full h-2">
                  <div class="bg-red-600 h-2 rounded-full transition-all duration-500" style="width: ${Math.min(averageScore, 100)}%"></div>
                </div>
                <p class="text-xs text-red-600 mt-1">${averageScore}/60% required to unlock</p>
              </div>
            </div>
            <p class="text-sm text-gray-600">
              Complete more scenarios with higher scores to reach the 60% threshold and unlock advanced features!
            </p>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Got It! 👍',
        confirmButtonColor: '#EF4444',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        },
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          confirmButton: 'rounded-xl px-6 py-3 text-sm font-semibold'
        }
      });
    } else if (errorParam === 'access') {
      Swal.fire({
        title: '❌ Access Error',
        text: 'Error accessing advanced features. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#EF4444'
      });
    }
  }, []);

  // Refresh scores from localStorage
  const refreshScores = () => {
    try {
      const storedScores = localStorage.getItem('speakGrade_scores');
      if (storedScores) {
        setScores(JSON.parse(storedScores));
        console.log('🔄 Scores refreshed from localStorage');
      }
    } catch (error) {
      console.error('Error refreshing scores:', error);
    }
  };

  // Calculate average score across all completed cards
  const calculateAverageScore = (): number => {
    const completedScores = scores.filter(score => score.completed);
    if (completedScores.length === 0) return 0;
    
    const totalPercentage = completedScores.reduce((sum, score) => sum + score.percentage, 0);
    return Math.round(totalPercentage / completedScores.length);
  };

  // Check if advanced cards should be unlocked
  // Requirements: 
  // 1. Must complete at least 3 scenarios (not just one)
  // 2. Must achieve 60%+ average score across ALL completed scenarios
  const checkUnlockStatus = (): boolean => {
    const completedScores = scores.filter(score => score.completed);
    
    // Must complete at least 3 scenarios to unlock advanced cards
    if (completedScores.length < 3) {
      return false;
    }
    
    const averageScore = calculateAverageScore();
    return averageScore >= 60;
  };

  // Get unlock requirements info
  const getUnlockRequirements = () => {
    const completedScores = scores.filter(score => score.completed);
    const averageScore = calculateAverageScore();
    
    return {
      scenariosCompleted: completedScores.length,
      minimumScenarios: 3,
      currentAverage: averageScore,
      targetAverage: 60,
      canUnlock: checkUnlockStatus()
    };
  };

  // Update unlock state when scores change
  useEffect(() => {
    const shouldBeUnlocked = checkUnlockStatus();
    
    if (shouldBeUnlocked && !unlockState.advancedCardsUnlocked) {
      // Start unlock animation
      setIsUnlocking(true);
      
      // Wait for animation to complete before updating state
      setTimeout(() => {
        const newUnlockState: UnlockState = {
          advancedCardsUnlocked: true,
          popupShown: false,
          unlockedAt: new Date().toISOString(),
        };
        
        setUnlockState(newUnlockState);
        localStorage.setItem('speakGrade_unlockState', JSON.stringify(newUnlockState));
        
        // Show SweetAlert2 unlock popup
        const requirements = getUnlockRequirements();
        Swal.fire({
          title: '🎉 Advanced Features Unlocked! 🚀',
          html: `
            <div class="text-center">
              <div class="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="text-white text-3xl">🎉</span>
              </div>
              <p class="text-gray-700 mb-6 text-lg">
                Congratulations! You've achieved the requirements to unlock advanced features!
              </p>
              <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 class="font-semibold text-green-800 mb-2">📊 Achievement Summary</h4>
                <div class="text-left text-green-700 space-y-2">

                  <div class="flex justify-between">
                    <span>Average Score:</span>
                    <span class="font-medium">${requirements.currentAverage}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Target Met:</span>
                    <span class="font-medium">✅ ${requirements.minimumScenarios}+ scenarios & 60%+ average</span>
                  </div>
                </div>
              </div>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 class="font-semibold text-blue-800 mb-2">🚀 New Features Available</h4>
                <ul class="text-left text-blue-700 space-y-1">
                  <li>• <strong>English Guide Bot</strong> - AI-powered fluency assessment</li>
                  <li>• <strong>Interview Room</strong> - Professional interview simulation</li>
                </ul>
              </div>
              <p class="text-sm text-gray-600">
                You're now ready for advanced practice and challenges!
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Awesome! Let\'s Go! 🚀',
          confirmButtonColor: '#10B981',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          },
          customClass: {
            popup: 'rounded-3xl shadow-2xl max-w-lg',
            confirmButton: 'rounded-2xl px-8 py-3 text-base font-semibold'
          }
        });
      }, 600); // Match the CSS transition duration
    }
  }, [scores, unlockState.advancedCardsUnlocked]);

  // Save scores to localStorage whenever they change
  useEffect(() => {
    if (scores.length > 0) {
      localStorage.setItem('speakGrade_scores', JSON.stringify(scores));
    }
  }, [scores]);

  // Save unlock state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('speakGrade_unlockState', JSON.stringify(unlockState));
  }, [unlockState]);

  // Handle advanced cards access
  const handleAdvancedCardAccess = (cardPath: string, cardTitle: string) => {
    if (!unlockState.advancedCardsUnlocked) {
      const requirements = getUnlockRequirements();
      
      Swal.fire({
        title: '🔒 Feature Locked!',
        html: `
          <div class="text-left">
            <p class="mb-4 text-gray-700">
              <strong>${cardTitle}</strong> is currently locked and requires advanced skills to unlock.
            </p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 class="font-semibold text-blue-800 mb-2">📊 Current Progress</h4>
              <div class="space-y-3">

                <div class="flex justify-between items-center">
                  <span class="text-sm text-blue-700">Current Average:</span>
                  <span class="text-sm font-medium text-blue-800">${requirements.currentAverage}%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-blue-700">Target Average:</span>
                  <span class="text-sm font-medium text-blue-800">${requirements.targetAverage}%</span>
                </div>
                <div class="mt-2">
                  <div class="w-full bg-blue-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" style="width: ${Math.min(requirements.currentAverage, 100)}%"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 class="font-semibold text-yellow-800 mb-2">🔓 Unlock Requirements</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Complete at least <strong>${requirements.minimumScenarios} scenarios</strong></li>
                <li>• Achieve <strong>${requirements.targetAverage}%+ average score</strong> across all scenarios</li>

              </ul>
            </div>
            <p class="text-sm text-gray-600">
              ${requirements.scenariosCompleted < requirements.minimumScenarios 
                ? `Complete ${requirements.minimumScenarios - requirements.scenariosCompleted} more scenario(s) first, then focus on improving your scores!`
                : `Focus on improving your scores to reach the ${requirements.targetAverage}% average threshold!`
              }
            </p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Got It! 👍',
        confirmButtonColor: '#3B82F6',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        },
        customClass: {
          popup: 'rounded-3xl shadow-2xl max-w-lg',
          confirmButton: 'rounded-xl px-6 py-3 text-sm font-semibold'
        }
      });
      return;
    }
    
    router.push(cardPath);
  };



  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading)
    return (
      <div className="bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 h-full">
        <Loader />
      </div>
    );

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 text-gray-800 overflow-hidden">
      {/* Floating Clouds Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div>
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
        </div>
        {/* Gentle mist effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/15 to-transparent"></div>
      </div>

      {/* Foreground */}
      <div className="relative z-10 w-full h-full overflow-y-auto">
        <Header />
        <Image
          src="https://img.freepik.com/premium-vector/cute-yellow-sun-rise-cloud-cartoon-illustration-isolated-flat-vector_1167562-13607.jpg"
          alt="Decorative sun"
          width={120}
          height={120}
          className="absolute top-3 my-10 right-32 sm:top-[30px] sm:right-80 md:top-[5px] rounded-full w-20 h-20 sm:w-30 sm:h-30 animate-floatY"
          priority
        />
        <main className="w-full flex flex-col items-center py-6 sm:py-8 lg:py-12 px-3 sm:px-6">
          <div className="w-full max-w-7xl">
            {/* Hero Section - Floating Cloud Card */}
            <div className="relative overflow-hidden w-full rounded-3xl bg-gradient-to-r from-violet-200 to-pink-200 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6 sm:p-8 mb-8 sm:mb-10 lg:mb-12 text-center mt-8">
              {/* Cloud decorations - Enhanced visibility */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/80 rounded-full blur-[0.5px]"></div>
              <div className="absolute -top-2 -left-2 w-12 h-12 bg-white/80 rounded-full blur-[0.5px]"></div>
              <div className="absolute -top-6 right-8 w-20 h-20 bg-white/80 rounded-full blur-[0.5px]"></div>
              <div className="absolute -top-3 right-4 w-14 h-14 bg-white/80 rounded-full blur-[0.5px]"></div>
              <div className="absolute top-4 left-8 w-10 h-10 bg-white/70 rounded-full blur-[0.5px]"></div>
              <div className="absolute bottom-4 right-8 w-12 h-12 bg-white/70 rounded-full blur-[0.5px]"></div>

              <div className="relative z-10">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
                    Build your speaking confidence
                  </span>
                </h1>
                <p className="mt-4 sm:mt-5 text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
                  ☁️ Choose a scenario and practice real-life conversations with
                  AI-driven roleplay in our cloud-based learning environment.
                </p>
                

              </div>
            </div>
          </div>

                    {/* Available Cards Grid - Floating Cloud Cards */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
              🚀 Available Scenarios
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-center gap-6 sm:gap-8 lg:gap-10 max-w-7xl w-full mx-auto">
              {componentsList
                .filter(item => {
                  const isAdvancedCard = item.id === 6 || item.id === 7; // English Guide Bot and Interview Room
                  return !isAdvancedCard || unlockState.advancedCardsUnlocked;
                })
                .map((item) => {
                  const isAdvancedCard = item.id === 6 || item.id === 7;
                  const isLocked = isAdvancedCard && !unlockState.advancedCardsUnlocked;
                  const cardScore = scores.find(s => s.cardId === item.title);
                  const isNewlyUnlocked = isAdvancedCard && unlockState.advancedCardsUnlocked && unlockState.unlockedAt;
                  
                  return (
                    <div
                      key={item.id}
                      className={`relative group rounded-3xl overflow-hidden transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-2xl hover:scale-[1.02] ${
                        isNewlyUnlocked ? 'card-unlock' : ''
                      }`}
                      style={{ boxShadow: "0 15px 35px rgba(0, 0, 0, 0.1)" }}
                    >
                      {/* Card frame - Cloud-like */}
                      <div className="rounded-3xl bg-white/90 backdrop-blur-xl ring-1 ring-white/50 relative overflow-hidden">
                        {/* Badge */}
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                          <span
                            className={`text-xs px-3 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg ${
                              item.path
                                ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white ring-1 ring-emerald-300/60"
                                : "bg-gradient-to-r from-gray-400 to-gray-500 text-white ring-1 ring-gray-300/60"
                            }`}
                          >
                            {item.path ? "Available" : "Coming Soon"}
                          </span>
                        </div>

                        {/* Score Display */}
                        {cardScore && cardScore.completed && (
                          <div className="absolute top-16 right-3 sm:top-20 sm:right-4 z-10">
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                              {cardScore.percentage}%
                            </div>
                          </div>
                        )}

                        {/* Image */}
                        <div className="w-full h-44 sm:h-48 flex items-center justify-center p-4">
                          <div className="w-full h-full flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-2">
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={300}
                              height={200}
                              className="object-contain h-full transition-transform duration-500 group-hover:scale-110"
                              priority={item.id <= 3} // Prioritize first 3 cards
                            />
                          </div>
                        </div>

                        {/* Title */}
                        <div className="p-4 sm:p-5 lg:p-6">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 sm:hidden leading-relaxed">
                            {item.description}
                          </p>

                          {item.path ? (
                            <Link href={item.path}>
                              <button className="sm:hidden mt-4 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                                <span className="cursor-pointer">Begin Journey</span>
                              </button>
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="sm:hidden mt-4 px-6 py-2.5 rounded-2xl bg-gray-300 text-gray-600 text-sm font-semibold cursor-not-allowed"
                            >
                              Coming Soon
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Hover layer (desktop) - Enhanced cloud effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-sky-50/95 backdrop-blur-xl p-6 sm:p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center text-center pointer-events-none sm:pointer-events-auto rounded-3xl">
                        {/* Floating elements on hover - Enhanced visibility */}
                        <div className="absolute top-4 left-4 w-6 h-6 bg-white/90 rounded-full blur-[0.5px] animate-pulse"></div>
                        <div className="absolute top-6 right-6 w-4 h-4 bg-white/90 rounded-full blur-[0.5px] animate-pulse delay-100"></div>
                        <div className="absolute bottom-6 left-6 w-8 h-8 bg-white/90 rounded-full blur-[0.5px] animate-pulse delay-200"></div>
                        <div className="absolute top-1/2 left-2 w-5 h-5 bg-white/80 rounded-full blur-[0.5px] animate-pulse delay-300"></div>
                        <div className="absolute top-1/2 right-2 w-3 h-3 bg-white/80 rounded-full blur-[0.5px] animate-pulse delay-400"></div>

                        <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                          {item.title}
                        </h4>
                        <p className="text-sm sm:text-base text-gray-700 max-w-xs px-2 leading-relaxed">
                          {item.description}
                        </p>

                        {item.path ? (
                          <Link href={item.path}>
                            <button className="mt-5 sm:mt-6 px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-base font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform">
                              Begin Journey
                            </button>
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="mt-5 sm:mt-6 px-8 py-3 rounded-2xl bg-gray-300 text-gray-600 text-base font-semibold cursor-not-allowed"
                          >
                            Coming Soon
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Locked Advanced Cards Section */}
          {!unlockState.advancedCardsUnlocked && (
            <div className={`mb-12 section-fade ${isUnlocking ? 'fade-out' : ''}`}>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                  🔒 Advanced Features (Locked)
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Complete at least 3 scenarios with an average score of 60% or higher across ALL scenarios to unlock these advanced features.
                </p>
                <div className="mt-4 inline-flex items-center space-x-4 bg-blue-50 border border-blue-200 rounded-full px-6 py-3">
                  <span className="text-sm text-blue-700">Overall Achievement:</span>
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl font-bold text-blue-600">{calculateAverageScore()}%</div>
                    <div className="text-sm text-blue-600">/ 60%</div>
                  </div>
                  <div className="w-24 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(calculateAverageScore(), 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Unlock Requirements */}
                {(() => {
                  const requirements = getUnlockRequirements();
                  return (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                          🔒 Unlock Requirements
                        </h4>
                        <div className="space-y-1 text-xs text-yellow-700">

                          <div className="flex justify-between">
                            <span>Current Average:</span>
                            <span className="font-medium">{requirements.currentAverage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Target Average:</span>
                            <span className="font-medium">{requirements.targetAverage}%</span>
                          </div>
                        </div>
                        {!requirements.canUnlock && (
                          <p className="text-xs text-yellow-600 mt-2">
                            {requirements.scenariosCompleted < requirements.minimumScenarios 
                              ? `Complete ${requirements.minimumScenarios - requirements.scenariosCompleted} more scenario(s) first`
                              : `Need ${requirements.targetAverage - requirements.currentAverage}% higher average`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                <p className="text-xs text-gray-600 mt-2 text-center">
                  💡 Scenario progress is shown within each individual scenario
                </p>
                <div className="mt-2 flex justify-center">
                  <button
                    onClick={refreshScores}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    🔄 Refresh Progress
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 text-center gap-6 sm:gap-8 max-w-4xl w-full mx-auto">
                {componentsList
                  .filter(item => {
                    const isAdvancedCard = item.id === 6 || item.id === 7;
                    return isAdvancedCard && !unlockState.advancedCardsUnlocked;
                  })
                  .map((item) => {
                    const cardScore = scores.find(s => s.cardId === item.title);
                    
                    return (
                      <div
                        key={item.id}
                        className="relative group rounded-3xl overflow-hidden transition-all duration-500 ease-out opacity-75"
                        style={{ boxShadow: "0 15px 35px rgba(0, 0, 0, 0.1)" }}
                      >
                        {/* Card frame - Locked style */}
                        <div className="rounded-3xl bg-white/90 backdrop-blur-xl ring-1 ring-red-200 relative overflow-hidden">
                          {/* Lock Badge */}
                          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                            <span className="text-xs px-3 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg bg-gradient-to-r from-red-400 to-red-500 text-white ring-1 ring-red-300/60">
                              🔒 Locked
                            </span>
                          </div>

                          {/* Lock Icon */}
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-sm">🔒</span>
                            </div>
                          </div>

                          {/* Image */}
                          <div className="w-full h-44 sm:h-48 flex items-center justify-center p-4">
                            <div className="w-full h-full flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 p-2">
                              <Image
                                src={item.image}
                                alt={item.title}
                                width={300}
                                height={200}
                                className="object-contain h-full transition-transform duration-500"
                              />
                            </div>
                          </div>

                          {/* Title */}
                          <div className="p-4 sm:p-5 lg:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight mb-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 sm:hidden leading-relaxed">
                              {item.description}
                            </p>

                            {/* Locked Message */}
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs text-red-600 font-medium mb-2">
                                🔒 Advanced Feature Locked
                              </p>
                              <p className="text-xs text-red-500">
                                Complete other scenarios with 60%+ average to unlock
                              </p>
                            </div>

                            <button 
                              onClick={() => handleAdvancedCardAccess(item.path!, item.title)}
                              className="sm:hidden mt-4 px-6 py-2.5 rounded-2xl bg-red-500 text-white text-sm font-semibold shadow-lg hover:bg-red-600 transition-all duration-300 cursor-pointer w-full"
                            >
                              🔒 Locked
                            </button>
                          </div>
                        </div>

                        {/* Hover layer (desktop) - Locked style */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-red-50/95 backdrop-blur-xl p-6 sm:p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center text-center pointer-events-none sm:pointer-events-auto rounded-3xl">
                          {/* Floating elements on hover */}
                          <div className="absolute top-4 left-4 w-6 h-6 bg-red-100 rounded-full blur-[0.5px] animate-pulse"></div>
                          <div className="absolute top-6 right-6 w-4 h-4 bg-red-100 rounded-full blur-[0.5px] animate-pulse delay-100"></div>
                          <div className="absolute bottom-6 left-6 w-8 h-8 bg-red-100 rounded-full blur-[0.5px] animate-pulse delay-200"></div>

                          <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                            {item.title}
                          </h4>
                          <p className="text-sm sm:text-base text-gray-700 max-w-xs px-2 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Locked Message for Advanced Cards */}
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg max-w-xs">
                            <p className="text-sm text-red-600 font-medium mb-2">
                              🔒 {item.title} is Locked
                            </p>
                            <p className="text-xs text-red-500">
                              Complete other scenarios with an average score of 60% or higher to unlock this advanced feature.
                            </p>
                            <div className="mt-2 text-xs text-gray-600">
                              Current average: {calculateAverageScore()}%
                            </div>
                          </div>

                          <button 
                            onClick={() => handleAdvancedCardAccess(item.path!, item.title)}
                            className="mt-5 sm:mt-6 px-8 py-3 rounded-2xl bg-red-500 text-white text-base font-semibold shadow-xl hover:bg-red-600 transition-all duration-300 transform"
                          >
                            🔒 Locked
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Unlock Popup - Now handled by SweetAlert2 in useEffect */}



      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes floatX {
          0%,
          100% {
            transform: translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateX(45px) rotate(1deg);
          }
          50% {
            transform: translateX(-38px) rotate(-1deg);
          }
          75% {
            transform: translateX(40px) rotate(0.5deg);
          }
        }

        @keyframes floatY {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-12px) rotate(-0.5deg);
          }
          50% {
            transform: translateY(18px) rotate(0.5deg);
          }
          75% {
            transform: translateY(-18px) rotate(-1deg);
          }
        }

        @keyframes drift {
          0%,
          100% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateX(25px) translateY(-15px) rotate(1deg);
          }
          66% {
            transform: translateX(-20px) translateY(10px) rotate(-1deg);
          }
        }

        .animate-floatX {
          animation: floatX 25s ease-in-out infinite;
        }

        .animate-floatY {
          animation: floatY 30s ease-in-out infinite;
        }

        .animate-drift {
          animation: drift 35s ease-in-out infinite;
        }

        /* SweetAlert2 Animation Classes */
        .animate__animated {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }

        .animate__fadeInDown {
          animation-name: fadeInDown;
        }

        .animate__fadeOutUp {
          animation-name: fadeOutUp;
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate3d(0, -100%, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes fadeOutUp {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
          to {
            opacity: 0;
            transform: translate3d(0, -100%, 0);
          }
        }

        /* Card Transition Animations */
        .card-transition {
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-unlock {
          animation: cardUnlock 0.8s ease-out forwards;
        }

        @keyframes cardUnlock {
          0% {
            opacity: 0.75;
            transform: scale(0.95) translateY(20px);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.02) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .section-fade {
          transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
        }

        .section-fade.fade-out {
          opacity: 0;
          transform: translateY(-20px);
        }
      `}</style>
    </div>
  );
}
