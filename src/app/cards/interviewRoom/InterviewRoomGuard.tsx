"use client";

// LOCKED LEVELS - CURRENTLY DISABLED
// This guard component is disabled but can be easily re-enabled
// To re-enable: uncomment the imports and logic below, and re-add this guard to the page component

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { loadUnlockState, getProgressStats } from '@/app/utils/scoringUtils';
// import lockedLevelsManager from '@/utils/lockedLevelsManager';
import Loader from '@/app/components/loader/page';
import Swal from 'sweetalert2';

interface InterviewRoomGuardProps {
  children: React.ReactNode;
}

export default function InterviewRoomGuard({ children }: InterviewRoomGuardProps) {
  // LOCKED LEVELS - CURRENTLY DISABLED
  // All locking logic is commented out - this guard now just passes through
  // To re-enable: uncomment the logic below and re-add this guard to the page component
  
  // const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // const router = useRouter();

  // useEffect(() => {
  //   const checkAccess = () => {
  //     try {
  //       const unlockState = lockedLevelsManager.loadUnlockState();
  //       const progressStats = lockedLevelsManager.getProgressStats();
  //       
  //       if (!progressStats.canUnlock) {
  //         Swal.fire({
  //           title: '🔒 Access Restricted',
  //           text: 'Interview Room is locked. Redirecting to home...',
  //           icon: 'warning',
  //           timer: 2000,
  //           timerProgressBar: true,
  //           showConfirmButton: false
  //         }).then(() => {
  //           router.push('/?locked=advanced');
  //         });
  //         return;
  //       }
  //       setIsUnlocked(true);
  //     } catch (error) {
  //       console.error('Error checking Interview Room access:', error);
  //       router.push('/?error=access');
  //       return;
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   checkAccess();
  // }, [router]);

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-b from-black/80 to-gray-400 flex items-center justify-center">
  //       <Loader />
  //     </div>
  //   );
  // }

  // if (!isUnlocked) {
  //   return null; // Will redirect
  // }

  // Currently just pass through all children (no locking)
  return <>{children}</>;
}
