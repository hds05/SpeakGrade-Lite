'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface HeaderProps {
  isDarkMode?: boolean;
}

function Header({ isDarkMode = false }: HeaderProps): React.JSX.Element {
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  return (
    <header className={`w-full shadow-md ${isDarkMode ? 'bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800' : 'bg-gradient-to-r from-purple-300 via-violet-200 to-pink-200'}`}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className={`text-2xl sm:text-3xl font-bold text-transparent bg-clip-text ${isDarkMode ? 'bg-gradient-to-r from-stone-200 to-amber-100' : 'bg-gradient-to-r from-purple-600 to-pink-500'}`}>
          SpeakGrade<span className="font-light">-Lite</span>
        </h1>
        
        {/* Navigation Area */}
        <div className="flex items-center gap-4">
          {/* Landing Page Link */}
          <Link href="/landing" passHref>
            <div className={`hidden sm:flex items-center gap-2 text-sm font-medium transition-all cursor-pointer ${isDarkMode ? 'text-slate-300 hover:text-stone-200' : 'text-purple-700 hover:text-purple-900'}`}>
              Learn More
            </div>
          </Link>
          
          {/* Profile Avatar */}
          <button 
            className="flex items-center gap-2 group hover:scale-105 transition-all duration-200"
            onClick={() => {
              setShowUpgradePopup(true);
            }}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 shadow-md overflow-hidden transition-colors ${isDarkMode ? 'border-slate-400 bg-slate-700 group-hover:border-stone-300' : 'border-purple-400 bg-white group-hover:border-purple-600'}`}>
              <Image
                src="/avatars/user-avatar.png"
                alt="Profile"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className={`hidden sm:block text-sm font-medium ${isDarkMode ? 'text-slate-300 group-hover:text-stone-200' : 'text-purple-700 group-hover:text-purple-900'}`}>
              Profile
            </span>
          </button>

          {/* Upgrade Link */}
          <Link href="/cards/upsell" passHref>
            <div className={`flex items-center gap-2 text-sm sm:text-base font-medium transition-all cursor-pointer animate-bounce ${isDarkMode ? 'text-amber-200 hover:text-amber-100' : 'text-purple-700 hover:text-purple-900'}`}>
              Upgrade
              <ArrowRightIcon className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </div>
      
      {/* Upgrade Popup */}
      {showUpgradePopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl ${isDarkMode ? 'bg-slate-800 border border-slate-600' : 'bg-white'}`}>
            <div className="text-center">
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-stone-200' : 'text-purple-600'}`}>🚀 Upgrade to Premium</h3>
              <p className={`mb-6 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                Unlock unlimited conversations, advanced scenarios, and detailed performance analytics!
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/cards/upsell">
                  <button 
                    className={`px-6 py-3 text-white rounded-lg transition-colors ${isDarkMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                    onClick={() => setShowUpgradePopup(false)}
                  >
                    Upgrade Now
                  </button>
                </Link>
                <button 
                  className={`px-6 py-3 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
