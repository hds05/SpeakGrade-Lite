'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

interface HeaderProps {
  isDarkMode?: boolean;
}

function Header({ isDarkMode = false }: HeaderProps): React.JSX.Element {
  const { user, isLoaded } = useUser();

  const avatarSrc =
    user?.imageUrl && user.imageUrl.length > 0
      ? user.imageUrl
      : '/avatars/user-avatar.png';

  return (
    <header className={`w-full shadow-md ${isDarkMode ? 'bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800' : 'bg-gradient-to-r from-purple-300 via-violet-200 to-pink-200'}`}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className={`text-2xl sm:text-3xl font-bold text-transparent bg-clip-text ${isDarkMode ? 'bg-gradient-to-r from-stone-200 to-amber-100' : 'bg-gradient-to-r from-purple-600 to-pink-500'}`}>
          SpeakGrade<span className="font-light">-Lite</span>
        </h1>
        
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/cards/upsell"
            className={`hidden sm:inline text-sm font-medium underline-offset-4 hover:underline ${isDarkMode ? 'text-amber-200 hover:text-amber-100' : 'text-purple-800 hover:text-purple-950'}`}
          >
            Upgrade
          </Link>

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 group hover:scale-105 transition-all duration-200"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 shadow-md overflow-hidden transition-colors shrink-0 ${isDarkMode ? 'border-slate-400 bg-slate-700 group-hover:border-stone-300' : 'border-purple-400 bg-white group-hover:border-purple-600'}`}>
              {isLoaded ? (
                <Image
                  src={avatarSrc}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full animate-pulse bg-gray-300" />
              )}
            </div>
            <span className={`hidden sm:block text-sm font-medium ${isDarkMode ? 'text-slate-300 group-hover:text-stone-200' : 'text-purple-700 group-hover:text-purple-900'}`}>
              Profile
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
