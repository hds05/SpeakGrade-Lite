'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

function Header(): React.JSX.Element {
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  return (
    <header className="w-full bg-gradient-to-r from-purple-300 via-violet-200 to-pink-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
          SpeakGrade<span className="font-light">-Lite</span>
        </h1>
        
        {/* Navigation Area */}
        <div className="flex items-center gap-4">
          {/* Profile Avatar */}
          <button 
            className="flex items-center gap-2 group hover:scale-105 transition-all duration-200"
            onClick={() => {
              setShowUpgradePopup(true);
            }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-400 bg-white shadow-md overflow-hidden group-hover:border-purple-600 transition-colors">
              <Image
                src="/avatars/user-avatar.png"
                alt="Profile"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden sm:block text-sm text-purple-700 font-medium group-hover:text-purple-900">
              Profile
            </span>
          </button>

          {/* Upgrade Link */}
          <Link href="/cards/upsell" passHref>
            <div className="flex items-center gap-2 text-sm sm:text-base text-purple-700 font-medium hover:text-purple-900 transition-all cursor-pointer animate-bounce">
              Upgrade
              <ArrowRightIcon className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </div>
      
      {/* Upgrade Popup */}
      {showUpgradePopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-600 mb-4">🚀 Upgrade to Premium</h3>
              <p className="text-gray-600 mb-6">
                Unlock unlimited conversations, advanced scenarios, and detailed performance analytics!
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/cards/upsell">
                  <button 
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    onClick={() => setShowUpgradePopup(false)}
                  >
                    Upgrade Now
                  </button>
                </Link>
                <button 
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={() => setShowUpgradePopup(false)}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
