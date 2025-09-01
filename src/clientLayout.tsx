"use client";

import { useState, useEffect, ReactNode } from "react";
import Image from "next/image";
import Loader from "./app/components/loader/page";
import Header from "./app/components/header/page";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

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
    title: "Interview Room",
    description:
      "You are in a professional interview room with three interviewers. ",
    image: "/cards/interview-room.png",
    path: "/cards/interviewRoom",
    isLocked: false,
    requiredScore: 0,
    tags: ["Work", "Easy"],
  },
  {
    id: 2,
    title: "Weekly Check with Manager",
    description: "Workplace conversation with your manager.",
    image: "/cards/weekly-manager.png",
    path: "/cards/weeklyCheckWithManager",
    isLocked: false,
    requiredScore: 0,
    tags: ["Work", "Easy"],
  },
  {
    id: 3,
    title: "Parking Ticket Encounter",
    description: "Police encounter - Explain your parking situation.",
    image: "/cards/parking-ticket.png",
    path: "/cards/parkingTicket",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Easy"],
  },
  {
    id: 4,
    title: "Outlet Customer Service",
    description:
      "You're a customer at Fashion Outlet with multiple issues that need to be resolved at checkout.",
    image: "/cards/outlet-customer.png",
    path: "/cards/outletCustomer",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Easy"],
  },
  {
    id: 5,
    title: "Emergency 911 Dispatcher",
    description: "You have called 911. Tell them your Emergency.",
    image: "/cards/emergency-911.png",
    path: "/cards/emergency911",
    isLocked: false,
    requiredScore: 0,
    tags: ["Life", "Easy"],
  },
  {
    id: 6,
    title: "Spacecraft Simulation",
    description:
      "Take control of a spacecraft and experience the thrill of space travel.",
    image: "/cards/spacecraft.png",
    path: "/cards/SpacecraftSimulation",
    isLocked: false,
    requiredScore: 0,
    tags: ["Fantasy", "Easy"],
  },
  {
    id: 7,
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
];

interface ClientLayoutProps {
  children?: ReactNode;
}

export default function ClientLayout({
  children,
}: ClientLayoutProps): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<CardScore[]>([]);
  
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
            
            {/* Minimal Filter System */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">All</option>
                  <option value="Work">Work</option>
                  <option value="Life">Life</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Test">Test</option>
                </select>
              </div>
              
              {/* Difficulty Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Difficulty:</span>
                <select 
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              
              {/* Results Count */}
              <div className="text-xs text-gray-500 ml-2">
                {filteredComponents.length} scenario{filteredComponents.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-center gap-6 sm:gap-8 lg:gap-10 max-w-7xl w-full mx-auto">
              {filteredComponents
                // LOCKED LEVELS - CURRENTLY DISABLED
                // .filter(item => {
                //   const isAdvancedCard = item.id === 7; // English Guide Bot only
                //   return !isAdvancedCard || unlockState.advancedCardsUnlocked;
                // })
                .map((item) => {
                  // LOCKED LEVELS - CURRENTLY DISABLED
                  // const isAdvancedCard = item.id === 7; // English Guide Bot only
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
                      {/* Card frame - Cloud-like */}
                      <div className="rounded-3xl bg-white/90 backdrop-blur-xl ring-1 ring-white/50 relative overflow-hidden">
                        {/* Tags */}
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-wrap gap-1">
                          {item.tags?.map((tag, index) => {
                            let tagColor = "";
                            switch (tag.toLowerCase()) {
                              case "work":
                                tagColor = "bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-1 ring-blue-300/60";
                                break;
                              case "life":
                                tagColor = "bg-gradient-to-r from-purple-500 to-purple-600 text-white ring-1 ring-purple-300/60";
                                break;
                              case "fantasy":
                                tagColor = "bg-gradient-to-r from-pink-500 to-rose-600 text-white ring-1 ring-pink-300/60";
                                break;
                              case "test":
                                tagColor = "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white ring-1 ring-indigo-300/60";
                                break;
                              case "live":
                                tagColor = "bg-gradient-to-r from-orange-500 to-red-600 text-white ring-1 ring-orange-300/60";
                                break;
                              case "easy":
                                tagColor = "bg-gradient-to-r from-green-500 to-green-600 text-white ring-1 ring-green-300/60";
                                break;
                              case "medium":
                                tagColor = "bg-gradient-to-r from-yellow-500 to-orange-500 text-white ring-1 ring-yellow-300/60";
                                break;
                              case "hard":
                                tagColor = "bg-gradient-to-r from-red-500 to-red-600 text-white ring-1 ring-red-300/60";
                                break;
                              default:
                                tagColor = "bg-gradient-to-r from-gray-500 to-gray-600 text-white ring-1 ring-gray-300/60";
                            }

                            return (
                              <span
                                key={index}
                                className={`text-xs px-2 py-1 rounded-full shadow-lg font-medium ${tagColor}`}
                              >
                                {tag}
                              </span>
                            );
                          })}
                          {!item.path && (
                            <span className="text-xs px-2 py-1 rounded-full shadow-lg bg-gradient-to-r from-gray-400 to-gray-500 text-white ring-1 ring-gray-300/60 font-medium">
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

                        {/* Image */}
                        <div className="w-full h-44 sm:h-48 flex items-center justify-center p-4 overflow-hidden">
                          <div className="w-full h-full flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-2 overflow-hidden">
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={300}
                              height={200}
                              className="object-contain h-full card-image"
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
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click when button is clicked
                                handleCardClick(item.path);
                              }}
                              className="sm:hidden mt-4 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                            >
                              <span className="cursor-pointer">Begin Journey</span>
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
  );
}
