"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadUnlockState, getProgressStats } from '@/app/utils/scoringUtils';
import Loader from '@/app/components/loader/page';
import Swal from 'sweetalert2';

interface EnglishGuideBotGuardProps {
  children: React.ReactNode;
}

export default function EnglishGuideBotGuard({ children }: EnglishGuideBotGuardProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = () => {
      try {
        const unlockState = loadUnlockState();
        const progressStats = getProgressStats();
        
        if (!progressStats.isInterviewRoomUnlocked) {
          // Show SweetAlert2 and then redirect
          Swal.fire({
            title: '🔒 Access Restricted',
            text: 'English Guide Bot is locked. Redirecting to home...',
            icon: 'warning',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          }).then(() => {
            router.push('/?locked=advanced');
          });
          return;
        }
        
        setIsUnlocked(true);
      } catch (error) {
        console.error('Error checking English Guide Bot access:', error);
        router.push('/?error=access');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black/80 to-gray-400 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!isUnlocked) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
