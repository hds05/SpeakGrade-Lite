'use client';

import { SignUp } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page() {
  const searchParams = useSearchParams();
  const [isPurchased, setIsPurchased] = useState(false);

  useEffect(() => {
    // Check if user came from purchase flow
    const purchased = searchParams.get('purchased');
    const localPurchaseStatus = localStorage.getItem('speakgrade_purchase_status');
    
    if (purchased === 'true' || localPurchaseStatus === 'purchased') {
      setIsPurchased(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          {isPurchased ? (
            <>
              <div className="text-4xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">Purchase Successful!</h1>
              <p className="text-gray-600 mb-4">
                Create your account to access SpeakGrade Lite and start improving your communication skills!
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">🎁 Your Benefits Include:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 1,000 AI conversation credits</li>
                  <li>• 500 voice generation credits</li>
                  <li>• Access to all 12 scenarios</li>
                  <li>• Progress tracking & reports</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
              <p className="text-gray-600">Join SpeakGrade to start your communication journey</p>
            </>
          )}
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-2xl",
            }
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
