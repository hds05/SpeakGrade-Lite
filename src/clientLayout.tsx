"use client";

import { useState, useEffect, ReactNode } from "react";
import Image from "next/image";
import Loader from "./app/components/loader/page";
import Header from "./app/components/header/page";
import ClickWaveEffect from "./app/components/clickWaveEffect/ClickWaveEffect";
import CreditsDisplay from "./app/components/creditsDisplay/page";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import { useUser } from '@clerk/nextjs';

// LOCKED LEVELS FUNCTIONALITY - CURRENTLY DISABLED
// Uncomment the line below to re-enable locked levels functionality
// import lockedLevelsManager from '@/utils/lockedLevelsManager';

// LIVE CONVERSATION SYSTEM - ACTIVE
import liveConversationManager from '@/utils/liveConversationManager';
// Import test utilities for development (can be removed in production)
import '@/utils/liveConversationTestUtils';

interface ComponentItem {
  id: number;
  title: string;
  description: string;
  image: string;
  path?: string;
  isLocked?: boolean;
  requiredScore?: number;
  tags?: string[];
  isLiveConversation?: boolean;  // New property for live conversation levels
}

interface CardScore {
  cardId: string;
  score: number;
  maxScore: number;
  percentage: number;
  completed: boolean;
  lastUpdated: string;
}

// LOCKED LEVELS - CURRENTLY DISABLED
// Uncomment to re-enable unlock state tracking
// interface UnlockState {
//   advancedCardsUnlocked: boolean;
//   popupShown: boolean;
//   unlockedAt: string | null;
// }

// Example component data
const componentsList: ComponentItem[] = [
  {
    id: 1,
    title: "Basic Interview Room",
    description:
      "Your first interview experience! Answer 2 simple questions with friendly guidance.",
    image: "/cards/interview-room.png",
    path: "/cards/basicInterviewRoom",
    isLocked: false,
    requiredScore: 0,
    tags: ["Work", "Easy"],
  },
  {
    id: 2,
    title: "Interview Room",
    description:
      "You are in a professional interview room with three interviewers. ",
    image: "/cards/interview-room.png",
    path: "/cards/interviewRoom",
    isLocked: false,
    requiredScore: 0,
    tags: ["Work", "Medium"],
  },
  {
    id: 3,
    title: "Easy Weekly Check",
    description: "Simple check-in conversation with your manager David. Perfect for beginners!",
    image: "/cards/weekly-manager.png",
    path: "/cards/easyWeeklyManager",
    isLocked: false,
    requiredScore: 0,
    tags: ["Work", "Easy"],
  },
  {
    id: 4,
    title: "Weekly Check with Manager",
    description: "Workplace conversation with your manager.",
    image: "/cards/weekly-manager.png",
    path: "/cards/weeklyCheckWithManager",
    isLocked: false,
    requiredScore: 0,
    tags: ["Work", "Medium"],
  },
  {
    id: 5,
    title: "Easy Parking Explanation",
    description: "Simple parking ticket conversation. Explain you couldn't find parking.",
    image: "/cards/parking-ticket.png",
    path: "/cards/easyParkingTicket",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Easy"],
  },
  {
    id: 6,
    title: "Parking Ticket Encounter",
    description: "Police encounter - Explain your parking situation.",
    image: "/cards/parking-ticket.png",
    path: "/cards/parkingTicket",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Medium"],
  },
  {
    id: 7,
    title: "Easy Hat Return",
    description: "Simple outlet return. Just return a hat that doesn't fit properly.",
    image: "/cards/outlet-customer.png",
    path: "/cards/easyOutletCustomer",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Easy"],
  },
  {
    id: 8,
    title: "Easy Fast Food Order",
    description: "Simple fast food ordering practice. Order your favorite food and complete the order!",
    image: "/cards/fast-food.png",
    path: "/cards/easyFastFood",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Easy"],
  },
  {
    id: 9,
    title: "Order Mix-Up",
    description:
      "Handle a drive-thru order with multiple mistakes at Burger Express. Fix your incorrect order professionally.",
    image: "/cards/fast-food.png",
    path: "/cards/orderMixUp",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Medium"],
  },
  {
    id: 10,
    title: "Outlet Customer Service",
    description:
      "You're a customer at Fashion Outlet with multiple issues that need to be resolved at checkout.",
    image: "/cards/outlet-customer.png",
    path: "/cards/outletCustomer",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Medium"],
  },
  {
    id: 11,
    title: "Emergency 911 Dispatcher",
    description: "You have called 911. Tell them your Emergency.",
    image: "/cards/emergency-911.png",
    path: "/cards/emergency911",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Medium"],
  },
  {
    id: 12,
    title: "Spacecraft Simulation",
    description:
      "Master advanced spacecraft controls and navigate complex deep space missions.",
    image: "/cards/spacecraft.png",
    path: "/cards/SpacecraftSimulation",
    isLocked: false,
    requiredScore: 0,
    tags: ["Fantasy", "Hard"],
  },
  {
    id: 13,
    title: "English Guide Bot",
    description:
      "AI-powered English fluency assessment with real-time feedback and vocabulary suggestions.",
    image: "/cards/english-coach.png",
    path: "/cards/englishGuideBot",
    isLocked: false, // Will be dynamically controlled by live conversation system
    requiredScore: 0,
    tags: ["Test", "Live"],
    isLiveConversation: true, // Mark as live conversation level
  },
  {
    id: 14,
    title: "🌲 Tree Explorer Game",
    description:
      "Explore a vast world filled with mystical trees! Navigate through an enormous map and discover hidden secrets.",
    image: "/game/game-bg.png",
    path: "/cards/conversationCustomGame",
    isLocked: false,
    requiredScore: 0,
    tags: ["Game", "Hidden"],
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark mode toggle function
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  // LOCKED LEVELS - CURRENTLY DISABLED
  // Uncomment the lines below to re-enable unlock state tracking
  // const [unlockState, setUnlockState] = useState<UnlockState>({
  //   advancedCardsUnlocked: false,
  //   popupShown: false,
  //   unlockedAt: null,
  // });
  // const [isUnlocking, setIsUnlocking] = useState(false);
  
  // LIVE CONVERSATION SYSTEM STATE
  const [liveConversationState, setLiveConversationState] = useState(
    liveConversationManager.getLiveConversationState()
  );
  const [showLiveConversationUnlock, setShowLiveConversationUnlock] = useState(false);
  
  // FILTERING SYSTEM STATE
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  
  const router = useRouter();

  // FILTERING LOGIC
  const filteredComponents = componentsList.filter(component => {
    const typeMatch = selectedType === 'All' || component.tags?.some(tag => 
      tag.toLowerCase() === selectedType.toLowerCase()
    );
    const difficultyMatch = selectedDifficulty === 'All' || component.tags?.some(tag => 
      tag.toLowerCase() === selectedDifficulty.toLowerCase()
    );
    return typeMatch && difficultyMatch;
  });

  // Load scores and unlock state from localStorage
  useEffect(() => {
    const loadStoredData = () => {
      try {
        // Load scores
        const storedScores = localStorage.getItem('speakGrade_scores');
        if (storedScores) {
          setScores(JSON.parse(storedScores));
        }

        // LOCKED LEVELS - CURRENTLY DISABLED
        // Uncomment to re-enable unlock state loading
        // const storedUnlockState = localStorage.getItem('speakGrade_unlockState');
        // if (storedUnlockState) {
        //   setUnlockState(JSON.parse(storedUnlockState));
        // }

        // LIVE CONVERSATION SYSTEM - Initialize and load state
        const liveState = liveConversationManager.initializeLiveConversationSystem();
        setLiveConversationState(liveState);
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
      
      // Check if this was a regular game completion for live conversation tracking
      if (e.detail && e.detail.cardId && !liveConversationManager.isLiveConversationLevel(e.detail.cardId)) {
        console.log('🎯 Regular game completed, updating live conversation progress...');
        const previousState = liveConversationManager.getLiveConversationState();
        const newState = liveConversationManager.recordRegularGameCompletion(e.detail.cardId);
        
        // Check if we just unlocked live conversations
        if (newState.liveLevelsUnlocked.length > 0 && previousState.liveLevelsUnlocked.length === 0) {
          setShowLiveConversationUnlock(true);
        }
        
        setLiveConversationState(newState);
      }
    };

    // Listen for live conversation updates
    const handleLiveConversationUpdated = (e: CustomEvent) => {
      console.log('🔄 Live conversation state updated:', e.detail);
      setLiveConversationState(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('scoresUpdated', handleScoresUpdated as EventListener);
    window.addEventListener('liveConversationUpdated', handleLiveConversationUpdated as EventListener);

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
      window.removeEventListener('liveConversationUpdated', handleLiveConversationUpdated as EventListener);
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

  // LOCKED LEVELS - CURRENTLY DISABLED
  // Uncomment to re-enable unlock status checking
  // const checkUnlockStatus = (): boolean => {
  //   const completedScores = scores.filter(score => score.completed);
  //   
  //   // Must complete at least 3 scenarios to unlock advanced cards
  //   if (completedScores.length < 3) {
  //     return false;
  //   }
  //   
  //   const averageScore = calculateAverageScore();
  //   return averageScore >= 60;
  // };

  // LOCKED LEVELS - CURRENTLY DISABLED
  // Uncomment to re-enable unlock requirements tracking
  // const getUnlockRequirements = () => {
  //   const completedScores = scores.filter(score => score.completed);
  //   const averageScore = calculateAverageScore();
  //   
  //   return {
  //     scenariosCompleted: completedScores.length,
  //     minimumScenarios: 3,
  //     currentAverage: averageScore,
  //     targetAverage: 60,
  //     canUnlock: checkUnlockStatus()
  //   };
  // };

  // LOCKED LEVELS - CURRENTLY DISABLED
  // Uncomment to re-enable unlock state changes and popup
  // useEffect(() => {
  //   const shouldBeUnlocked = checkUnlockStatus();
  //   
  //   if (shouldBeUnlocked && !unlockState.advancedCardsUnlocked) {
  //     setIsUnlocking(true);
  //     setTimeout(() => {
  //       const newUnlockState: UnlockState = {
  //         advancedCardsUnlocked: true,
  //         popupShown: false,
  //         unlockedAt: new Date().toISOString(),
  //       };
  //       setUnlockState(newUnlockState);
  //       localStorage.setItem('speakGrade_unlockState', JSON.stringify(newUnlockState));
  //       // Show unlock popup...
  //     }, 600);
  //   }
  // }, [scores, unlockState.advancedCardsUnlocked]);

  // Live conversation unlock notification
  useEffect(() => {
    if (showLiveConversationUnlock) {
      const unlockConfig = liveConversationManager.createLiveConversationUnlockNotification();
      Swal.fire(unlockConfig);
      setShowLiveConversationUnlock(false);
    }
  }, [showLiveConversationUnlock]);

  // Save scores to localStorage whenever they change
  useEffect(() => {
    if (scores.length > 0) {
      localStorage.setItem('speakGrade_scores', JSON.stringify(scores));
    }
  }, [scores]);

  // LOCKED LEVELS - CURRENTLY DISABLED
  // Uncomment to re-enable unlock state saving
  // useEffect(() => {
  //   localStorage.setItem('speakGrade_unlockState', JSON.stringify(unlockState));
  // }, [unlockState]);

  const handleCardClick = (cardPath?: string) => {
    if (!cardPath) {
      // Show "Coming Soon" message for cards without paths
      Swal.fire({
        title: 'Coming Soon!',
        text: 'This feature is currently under development.',
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

    // LOCKED LEVELS - CURRENTLY DISABLED
    // Uncomment to re-enable locked card check
    // if ((cardPath === '/cards/englishGuideBot' || cardPath === '/cards/interviewRoom') && !unlockState.advancedCardsUnlocked) {
    //   // Show locked card popup...
    //   return;
    // }

    // LIVE CONVERSATION SYSTEM - Check if this is a live conversation level
    const component = componentsList.find(item => item.path === cardPath);
    if (component?.isLiveConversation) {
      const status = liveConversationManager.getLiveConversationStatus(component.title);
      
      if (!status.isUnlocked) {
        // Show live conversation locked popup
        Swal.fire({
          title: '🎯 Live Conversation Locked',
          html: `
            <div class="text-center space-y-4">
              <div class="text-lg font-semibold text-gray-800">
                Live conversation sessions need to be unlocked
              </div>
              
              <div class="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg">
                <div class="text-sm text-gray-700 space-y-2">
                  <div>🎯 <strong>Progress:</strong> ${status.gamesPlayed}/${status.gamesRequired} games played</div>
                  <div>📊 <strong>Progress:</strong> ${status.progress?.toFixed(1) || 0}%</div>
                  <div>🎮 <strong>Games remaining:</strong> ${status.gamesUntilUnlock}</div>
                </div>
              </div>
              
              <div class="text-sm text-gray-600">
                Complete ${status.gamesUntilUnlock} more regular levels to unlock this live conversation!
              </div>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'Got It! 👍',
          confirmButtonColor: '#3B82F6',
          customClass: {
            popup: 'animate__animated animate__bounceIn',
            title: 'text-xl font-bold text-gray-800',
            confirmButton: 'px-6 py-3 text-lg font-semibold rounded-lg shadow-lg'
          }
        });
        return;
      } else {
        // This is an unlocked live conversation - record its usage
        liveConversationManager.recordLiveConversationUsage(component.title);
        
        // Show confirmation that this will be locked again after use
        Swal.fire({
          title: '🎯 Starting Live Conversation',
          html: `
            <div class="text-center space-y-4">
              <div class="text-lg font-semibold text-gray-800">
                You're about to use your unlocked session
              </div>
              
              <div class="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg">
                <div class="text-sm text-gray-700 space-y-2">
                  <div>⚠️ <strong>Important:</strong> This will lock again after this session</div>
                  <div>🔄 <strong>Next unlock:</strong> Complete 6 more regular levels</div>
                </div>
              </div>
              
              <div class="text-sm text-gray-600">
                Make the most of this live conversation session!
              </div>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Start Session 🚀',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#6B7280',
          customClass: {
            popup: 'animate__animated animate__bounceIn',
            title: 'text-xl font-bold text-gray-800',
            confirmButton: 'px-6 py-3 text-lg font-semibold rounded-lg shadow-lg',
            cancelButton: 'px-6 py-3 text-lg font-semibold rounded-lg'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            // Proceed with navigation
            setLoading(true);
            router.push(cardPath);
          }
        });
        return;
      }
    }
    
    // Immediate visual feedback - add loading state
    setLoading(true);
    
    // Navigate immediately
    router.push(cardPath);
  };

  // Handle advanced cards access
  const handleAdvancedCardAccess = (cardPath: string, cardTitle: string) => {
    handleCardClick(cardPath);
  };



  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading)
    return (
      <div className={`h-full ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' : 'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100'}`}>
        <Loader />
      </div>
    );

  return (
    <ClickWaveEffect 
      enabled={true}
      waveColor={isDarkMode ? 'rgba(251, 191, 36, 0.7)' : 'rgba(59, 130, 246, 0.6)'}
      waveSize={60}
      duration={700}
    >
    <div className={`fixed inset-0 w-full h-full overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-stone-200' : 'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 text-gray-800'}`}>
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
        <Header isDarkMode={isDarkMode} />
        <div 
          className="absolute top-32 my-10 right-8 sm:top-40 sm:right-12 md:top-44 md:right-16 lg:top-48 lg:right-20 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 animate-floatY cursor-pointer hover:scale-110 transition-transform duration-300 z-20"
          onClick={toggleDarkMode}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <div className="gif-container w-full h-full">
            {/* Static version - shows by default */}
        <Image
              src={isDarkMode ? "/gifs/moonlight-static.png" : "/gifs/sunny-static.png"}
              alt={isDarkMode ? "Decorative moon static" : "Decorative sun static"}
          width={isDarkMode ? 100 : 120}
          height={isDarkMode ? 100 : 120}
              className={`gif-static w-full h-full rounded-full object-cover ${isDarkMode ? 'scale-90' : ''}`}
          priority
        />
            {/* Animated GIF - shows on hover */}
            <Image
              src={isDarkMode ? "/gifs/moonlight-gif.gif" : "/gifs/sunny-gif.gif"}
              alt={isDarkMode ? "Decorative moon animated" : "Decorative sun animated"}
              width={isDarkMode ? 100 : 120}
              height={isDarkMode ? 100 : 120}
              className={`gif-animated w-full h-full rounded-full object-cover absolute top-0 left-0 ${isDarkMode ? 'scale-90' : ''}`}
              unoptimized={true}
            />
          </div>
        </div>
        <main className="w-full flex flex-col items-center py-6 sm:py-8 lg:py-12 px-3 sm:px-6">
          <div className="w-full max-w-7xl">
            {/* Hero Section - Floating Cloud Card */}
            <div className={`relative overflow-hidden w-full rounded-3xl backdrop-blur-xl p-6 sm:p-8 mb-8 sm:mb-10 lg:mb-12 text-center mt-8 ${isDarkMode ? 'bg-gradient-to-r from-slate-800/80 to-blue-900/80 border border-slate-600/40 shadow-[0_20px_60px_rgba(0,0,0,0.4)]' : 'bg-gradient-to-r from-violet-200 to-pink-200 border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.08)]'}`}>
              {/* Cloud decorations - Enhanced visibility */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/80 rounded-full blur-[0.5px]"></div>
              <div className="absolute -top-2 -left-2 w-12 h-12 bg-white/80 rounded-full blur-[0.5px]"></div>
              <div className="absolute -top-6 right-8 w-20 h-20 bg-white/80 rounded-full blur-[0.5px]"></div>
              <div className="absolute -top-3 right-4 w-14 h-14 bg-white/80 rounded-full blur-[0.5px]"></div>
              <div className="absolute top-4 left-8 w-10 h-10 bg-white/70 rounded-full blur-[0.5px]"></div>
              <div className="absolute bottom-4 right-8 w-12 h-12 bg-white/70 rounded-full blur-[0.5px]"></div>

              <div className="relative z-10">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  <span className={`bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-stone-200 via-amber-100 to-yellow-100' : 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600'}`}>
                    Build your speaking confidence
                  </span>
                </h1>
                <p className={`mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {isDarkMode ? '🌙' : '☁️'} Choose a scenario and practice real-life conversations with
                  AI-driven roleplay in our {isDarkMode ? 'moonlit' : 'cloud-based'} learning environment.
                </p>
                

              </div>
            </div>
          </div>



                    {/* Available Cards Grid - Floating Cloud Cards */}
          <div className="mb-12">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-stone-200' : 'text-gray-800'}`} 
                style={isDarkMode ? {
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7), -1px -1px 2px rgba(255, 255, 255, 0.3), 0 0 4px rgba(0, 0, 0, 0.5)'
                } : {}}>
              🚀 Available Scenarios
            </h2>
            
            {/* Minimal Filter System */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Type:</span>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className={`px-3 py-1 text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border border-slate-600 text-slate-200 focus:ring-amber-500 focus:border-amber-500' 
                      : 'bg-white border border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-transparent'
                  }`}
                >
                  <option value="All">All</option>
                  <option value="Work">Work</option>
                  <option value="Life">Life</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Test">Test</option>
                  <option value="Game">Game</option>
                </select>
              </div>
              
              {/* Difficulty Filter */}
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Difficulty:</span>
                <select 
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className={`px-3 py-1 text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border border-slate-600 text-slate-200 focus:ring-amber-500 focus:border-amber-500' 
                      : 'bg-white border border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-transparent'
                  }`}
                >
                  <option value="All">All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              
              {/* Results Count */}
              <div className={`text-xs ml-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {filteredComponents.length} scenario{filteredComponents.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Credits Display for Authenticated Users */}
            <CreditsDisplay />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-center gap-6 sm:gap-8 lg:gap-10 max-w-7xl w-full mx-auto">
              {filteredComponents
                // LOCKED LEVELS - CURRENTLY DISABLED
                // .filter(item => {
                //   const isAdvancedCard = item.id === 11; // English Guide Bot only
                //   return !isAdvancedCard || unlockState.advancedCardsUnlocked;
                // })
                .map((item) => {
                  // LOCKED LEVELS - CURRENTLY DISABLED
                  // const isAdvancedCard = item.id === 8; // English Guide Bot only
                  // const isLocked = isAdvancedCard && !unlockState.advancedCardsUnlocked;
                  const cardScore = scores.find(s => s.cardId === item.title);
                  // const isNewlyUnlocked = isAdvancedCard && unlockState.advancedCardsUnlocked && unlockState.unlockedAt;
                  const isNewlyUnlocked = false; // LOCKED LEVELS DISABLED - always false for now
                  
                  // LIVE CONVERSATION SYSTEM - Get status for this item
                  const liveConversationStatus = item.isLiveConversation 
                    ? liveConversationManager.getLiveConversationStatus(item.title)
                    : null;
                  
                  return (
                    <div
                      key={item.id}
                      className={`relative group card-hover-test rounded-3xl overflow-hidden cursor-pointer ${
                        isNewlyUnlocked ? 'card-unlock' : ''
                      }`}
                      style={{ boxShadow: "0 15px 35px rgba(0, 0, 0, 0.1)" }}
                      onClick={() => handleCardClick(item.path)}
                    >
                      {/* Card frame - Clean design with special contrasting styling for English Guide Bot */}
                      <div className={`rounded-3xl backdrop-blur-xl relative overflow-hidden transition-all duration-300 ${
                        item.isLiveConversation
                          ? isDarkMode
                            ? 'bg-gradient-to-br from-red-950 to-red-900 ring-2 ring-amber-400/70 shadow-2xl shadow-amber-500/30 hover:ring-amber-300/90 hover:shadow-amber-400/40 border border-amber-500/40'
                            : 'bg-gradient-to-br from-indigo-800 to-blue-900 ring-2 ring-cyan-500 shadow-2xl shadow-cyan-400/50 hover:ring-cyan-400 hover:shadow-cyan-300/60 border border-cyan-500'
                          : isDarkMode ? 'bg-slate-800/90' : 'bg-white/90'
                      } ${
                        item.isLiveConversation
                          ? '' // Live conversation cards have their own styling above
                          : item.tags?.includes('Easy') 
                          ? isDarkMode 
                            ? 'ring-1 ring-emerald-400/40 shadow-lg shadow-slate-900/30 hover:ring-emerald-300/60 hover:shadow-slate-800/40'
                            : 'ring-1 ring-green-300/50 shadow-lg shadow-green-100/40 hover:ring-green-400/70 hover:shadow-green-200/50'
                          : item.tags?.includes('Medium')
                          ? isDarkMode
                            ? 'ring-1 ring-amber-400/40 shadow-lg shadow-slate-900/30 hover:ring-amber-300/60 hover:shadow-slate-800/40'
                            : 'ring-1 ring-amber-300/50 shadow-lg shadow-amber-100/40 hover:ring-amber-400/70 hover:shadow-amber-200/50'
                          : item.tags?.includes('Hard')
                          ? isDarkMode
                            ? 'ring-1 ring-violet-400/40 shadow-lg shadow-slate-900/30 hover:ring-violet-300/60 hover:shadow-slate-800/40'
                            : 'ring-1 ring-purple-300/50 shadow-lg shadow-purple-100/40 hover:ring-purple-400/70 hover:shadow-purple-200/50'
                          : isDarkMode
                          ? 'ring-1 ring-slate-600/30 shadow-lg hover:ring-slate-500/50'
                          : 'ring-1 ring-white/40 shadow-lg hover:ring-white/60'
                      }`}>
                        {/* Tags */}
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-wrap gap-1">
                          {item.tags?.map((tag, index) => {
                            let tagColor = "";
                            let tagIcon = "";
                            switch (tag.toLowerCase()) {
                              case "work":
                                tagColor = "bg-gradient-to-r from-slate-700 to-slate-800 text-white border border-slate-600/40 shadow-lg backdrop-blur-sm";
                                tagIcon = "💼";
                                break;
                              case "life":
                                tagColor = "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border border-emerald-500/40 shadow-lg backdrop-blur-sm";
                                tagIcon = "🏠";
                                break;
                              case "fantasy":
                                tagColor = "bg-gradient-to-r from-violet-600 to-purple-700 text-white border border-violet-500/40 shadow-lg backdrop-blur-sm";
                                tagIcon = "✨";
                                break;
                              case "test":
                                tagColor = "bg-gradient-to-r from-indigo-600 to-blue-700 text-white border border-indigo-500/40 shadow-lg backdrop-blur-sm";
                                tagIcon = "📝";
                                break;
                              case "live":
                                tagColor = "bg-gradient-to-r from-rose-600 to-pink-700 text-white border border-rose-500/40 shadow-lg backdrop-blur-sm animate-pulse";
                                tagIcon = "🔴";
                                break;
                              case "easy":
                                tagColor = "bg-gradient-to-r from-green-500 to-emerald-600 text-white border border-green-400/40 shadow-lg backdrop-blur-sm";
                                tagIcon = "🟢";
                                break;
                              case "medium":
                                tagColor = "bg-gradient-to-r from-amber-500 to-orange-600 text-white border border-amber-400/40 shadow-lg backdrop-blur-sm";
                                tagIcon = "🟡";
                                break;
                              case "hard":
                                tagColor = "bg-gradient-to-r from-purple-500 to-indigo-600 text-white border border-purple-400/40 shadow-lg backdrop-blur-sm";
                                tagIcon = "🟣";
                                break;
                              default:
                                tagColor = "bg-gradient-to-r from-gray-600 to-slate-700 text-white border border-gray-500/40 shadow-lg backdrop-blur-sm";
                                tagIcon = "🏷️";
                            }

                            return (
                              <span
                                key={index}
                                className={`text-xs px-2 py-1 font-semibold tracking-wide transition-all duration-200 hover:scale-105 ${tagColor}`}
                                style={{
                                  clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                  minWidth: 'fit-content'
                                }}
                              >
                                <span className="mr-1">{tagIcon}</span>
                                {tag}
                              </span>
                            );
                          })}
                          {!item.path && (
                            <span 
                              className="text-xs px-2 py-1 font-semibold tracking-wide bg-gradient-to-r from-gray-600 to-slate-700 text-white border border-gray-500/40 shadow-lg backdrop-blur-sm"
                              style={{
                                clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                minWidth: 'fit-content'
                              }}
                            >
                              <span className="mr-1">⏳</span>
                              Coming Soon
                            </span>
                          )}
                        </div>

                        {/* Score Display */}
                        {cardScore && cardScore.completed && (
                          <div className="absolute top-16 right-3 sm:top-20 sm:right-4 z-10">
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                              {cardScore.percentage}%
                            </div>
                          </div>
                        )}

                        {/* Live Conversation Status Indicator */}
                        {liveConversationStatus && (
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                            {liveConversationStatus.isUnlocked ? (
                              <div className="bg-gradient-to-r from-green-400 to-green-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
                                🎯 UNLOCKED
                              </div>
                            ) : (
                              <div className="bg-gradient-to-r from-red-400 to-red-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                                🔒 {liveConversationStatus.gamesUntilUnlock} left
                              </div>
                            )}
                          </div>
                        )}

                        {/* Image with Difficulty-based Decorations */}
                        <div className="w-full h-44 sm:h-48 flex items-center justify-center p-4 overflow-hidden relative">
                          {/* Clean background with contrasting styling for English Guide Bot */}
                          <div className={`w-full h-full flex items-center justify-center rounded-2xl p-2 overflow-hidden relative ${
                            item.isLiveConversation
                              ? isDarkMode
                                ? 'bg-gradient-to-br from-red-900/80 to-red-800/80'
                                : 'bg-gradient-to-br from-indigo-700 to-blue-800'
                              : isDarkMode
                              ? item.tags?.includes('Easy') 
                                ? 'bg-gradient-to-br from-emerald-900/15 to-green-900/15' 
                                : item.tags?.includes('Medium')
                                ? 'bg-gradient-to-br from-amber-900/15 to-orange-900/15'
                                : item.tags?.includes('Hard')
                                ? 'bg-gradient-to-br from-violet-900/15 to-purple-900/15'
                                : 'bg-gradient-to-br from-slate-800/15 to-blue-900/15'
                              : item.tags?.includes('Easy') 
                                ? 'bg-gradient-to-br from-green-50/70 to-emerald-50/70' 
                                : item.tags?.includes('Medium')
                                ? 'bg-gradient-to-br from-amber-50/70 to-orange-50/70'
                                : item.tags?.includes('Hard')
                                ? 'bg-gradient-to-br from-purple-50/70 to-indigo-50/70'
                                : 'bg-gradient-to-br from-sky-50/70 to-blue-50/70'
                          }`}>
                            {/* Difficulty-based decorative corner */}
                            {item.tags?.includes('Easy') && (
                              <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-br-lg opacity-80">
                                <div className="absolute top-1 left-1 text-white text-xs font-bold">✨</div>
                              </div>
                            )}
                            {item.tags?.includes('Medium') && (
                              <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-br-lg opacity-80">
                                <div className="absolute top-1 left-1 text-white text-xs font-bold">⭐</div>
                              </div>
                            )}
                            {item.tags?.includes('Hard') && !item.isLiveConversation && (
                              <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-br-lg opacity-80">
                                <div className="absolute top-1 left-1 text-white text-xs font-bold">⚡</div>
                              </div>
                            )}
                            
                            {/* Golden star with purple background for live conversation cards */}
                            {item.isLiveConversation && (
                              <div className="absolute bottom-2 right-2 w-12 h-12 z-20">
                                <div className="relative w-full h-full">
                                  {/* Purple badge background */}
                                  <div className={`absolute inset-0 rounded-full transform rotate-12 ${
                                    isDarkMode 
                                      ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 shadow-lg shadow-purple-900/60' 
                                      : 'bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 shadow-lg shadow-purple-600/40'
                                  }`}></div>
                                  {/* Golden star icon */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-yellow-300 text-lg font-bold transform rotate-12 drop-shadow-sm">⭐</span>
                                  </div>
                                  {/* Shine effect */}
                                  <div className="absolute top-1 left-1 w-3 h-3 bg-white/40 rounded-full transform rotate-12"></div>
                                </div>
                              </div>
                            )}
                            
                            {/* Image - Clean without heavy filters */}
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={300}
                              height={200}
                              className="object-contain h-full card-image transition-all duration-300"
                              priority={item.id <= 3} // Prioritize first 3 cards
                            />
                            
                            {/* Subtle difficulty-based overlay pattern - much lighter */}
                            {item.tags?.includes('Easy') && !item.isLiveConversation && (
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-green-50/10 to-green-100/15 rounded-2xl pointer-events-none"></div>
                            )}
                            {item.tags?.includes('Medium') && !item.isLiveConversation && (
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-50/10 to-orange-100/15 rounded-2xl pointer-events-none"></div>
                            )}
                            {item.tags?.includes('Hard') && !item.isLiveConversation && (
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-50/10 to-indigo-100/15 rounded-2xl pointer-events-none"></div>
                            )}
                            {item.isLiveConversation && (
                              <div className={`absolute inset-0 rounded-2xl pointer-events-none ${
                                isDarkMode 
                                  ? 'bg-gradient-to-tr from-transparent via-red-700/5 to-red-600/10' 
                                  : 'bg-gradient-to-tr from-transparent via-indigo-600/10 to-cyan-500/15'
                              }`}></div>
                            )}
                            
                            {/* Difficulty-based bottom accent */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${
                              item.isLiveConversation
                                ? isDarkMode
                                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
                                  : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600'
                                : item.tags?.includes('Easy') 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                : item.tags?.includes('Medium')
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                : item.tags?.includes('Hard')
                                ? 'bg-gradient-to-r from-purple-400 to-indigo-500'
                                : 'bg-gradient-to-r from-sky-400 to-blue-500'
                            }`}></div>
                          </div>
                        </div>

                        {/* Title with difficulty indicator */}
                        <div className={`px-4 sm:px-5 lg:px-6 pt-2 pb-4 sm:pb-5 lg:pb-6 relative ${
                          item.isLiveConversation
                            ? isDarkMode
                              ? 'bg-gradient-to-b from-transparent to-red-800/25'
                              : 'bg-gradient-to-b from-transparent to-indigo-800/30'
                            : isDarkMode
                            ? item.tags?.includes('Easy') 
                              ? 'bg-gradient-to-b from-transparent to-emerald-900/20' 
                              : item.tags?.includes('Medium')
                              ? 'bg-gradient-to-b from-transparent to-amber-900/20'
                              : item.tags?.includes('Hard')
                              ? 'bg-gradient-to-b from-transparent to-violet-900/20'
                              : 'bg-gradient-to-b from-transparent to-slate-900/20'
                            : item.tags?.includes('Easy') 
                              ? 'bg-gradient-to-b from-transparent to-green-50/30' 
                              : item.tags?.includes('Medium')
                              ? 'bg-gradient-to-b from-transparent to-amber-50/30'
                              : item.tags?.includes('Hard')
                              ? 'bg-gradient-to-b from-transparent to-purple-50/30'
                              : ''
                        }`}>
                          <h3 className={`text-lg sm:text-xl font-bold tracking-tight mb-2 relative ${
                            item.isLiveConversation && !isDarkMode 
                              ? 'text-white' 
                              : isDarkMode ? 'text-stone-200' : 'text-gray-900'
                          }`}>
                            {item.title}
                            {/* Difficulty level indicator */}
                            {item.tags?.includes('Easy') && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            )}
                            {item.tags?.includes('Medium') && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                            )}
                            {item.tags?.includes('Hard') && !item.isLiveConversation && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                            )}
                            {item.isLiveConversation && (
                              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse shadow-lg ${
                                isDarkMode
                                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                                  : 'bg-gradient-to-r from-cyan-400 to-blue-600'
                              }`}></span>
                            )}
                          </h3>
                          <p className={`text-sm sm:hidden leading-relaxed ${
                            item.isLiveConversation && !isDarkMode 
                              ? 'text-gray-200' 
                              : isDarkMode ? 'text-slate-300' : 'text-gray-600'
                          }`}>
                            {item.description}
                          </p>

                          {item.path ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click when button is clicked
                                handleCardClick(item.path);
                              }}
                              className={`sm:hidden mt-4 px-6 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer ${
                                item.isLiveConversation
                                  ? isDarkMode
                                    ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 shadow-amber-400/50'
                                    : 'bg-gradient-to-r from-cyan-600 via-blue-700 to-indigo-800 hover:from-cyan-700 hover:via-blue-800 hover:to-indigo-900 shadow-cyan-500/50'
                                  : item.tags?.includes('Easy') 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                                  : item.tags?.includes('Medium')
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                                  : item.tags?.includes('Hard')
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'
                              }`}
                            >
                              <span className="cursor-pointer">
                                {item.isLiveConversation ? 'Start Live Session' : item.tags?.includes('Easy') ? 'Start Easy' : item.tags?.includes('Medium') ? 'Try Medium' : item.tags?.includes('Hard') ? 'Master Hard' : 'Begin Journey'}
                              </span>
                            </button>
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


                    </div>
                  );
                })}
            </div>
          </div>

          {/* LOCKED LEVELS - CURRENTLY DISABLED 
               All locked levels display logic has been removed.
               See /src/utils/LOCKED_LEVELS_README.md for re-enablement instructions.
          */}
        </main>
        
        {/* Minimalistic Footer */}
        <div className="flex justify-center py-6">
          <div className="text-xs text-gray-500 font-light tracking-wide">
            speakgrade © 2025 B&B Global. All rights reserved.
          </div>
        </div>
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

        /* Card Hover Effects */
        .card-hover-test {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover-test:hover {
          transform: translateY(-12px) scale(1.03);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          border: 3px solid #60a5fa;
        }
        
        .card-image {
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover-test:hover .card-image {
          transform: scale(1.2);
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
    </ClickWaveEffect>
  );
}
