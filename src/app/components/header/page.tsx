'use client';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

function Header(): React.JSX.Element {
  return (
    <header className="w-full bg-gradient-to-r from-purple-300 via-violet-200 to-pink-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
          SpeakGrade<span className="font-light">-Lite</span>
        </h1>
        
        {/* Navigation Link */}
        <Link href="/cards/upsell" passHref>
          <div className="flex items-center gap-2 text-sm sm:text-base text-purple-700 font-medium hover:text-purple-900 transition-all cursor-pointer">
            Upgrade
            <ArrowRightIcon className="w-5 h-5" />
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header;
