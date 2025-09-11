"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface OptimizedCloudsProps {
  isDarkMode?: boolean;
}

export default function OptimizedClouds({ isDarkMode = false }: OptimizedCloudsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Lazy load clouds after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Static background gradient while loading */}
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-slate-900/50 to-blue-950/50' : 'bg-gradient-to-br from-sky-100/50 to-blue-50/50'}`}></div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Reduced to only 4 clouds for better performance */}
      <Image
        src="/backgrounds/cartooncloud.webp"
        alt="Floating cloud"
        width={300}
        height={120}
        className="absolute top-9 left-2 w-24 h-12 sm:w-32 sm:h-16 md:w-48 md:h-20 lg:w-64 lg:h-24 xl:w-80 xl:h-32 animate-floatX"
        loading="lazy"
        priority={false}
      />
      <Image
        src="/backgrounds/cartooncloud.webp"
        alt="Floating cloud"
        width={250}
        height={100}
        className="absolute top-20 right-2 w-20 h-10 sm:w-28 sm:h-14 md:w-40 md:h-16 lg:w-56 lg:h-20 xl:w-72 xl:h-24 opacity-80 animate-floatX"
        loading="lazy"
        priority={false}
      />
      <Image
        src="/backgrounds/cartooncloud.webp"
        alt="Floating cloud"
        width={200}
        height={80}
        className="absolute top-40 left-1/4 w-16 h-8 sm:w-24 sm:h-12 md:w-32 md:h-16 lg:w-40 lg:h-20 xl:w-48 xl:h-24 opacity-70 animate-drift"
        loading="lazy"
        priority={false}
      />
      <Image
        src="/backgrounds/cartooncloud.webp"
        alt="Floating cloud"
        width={180}
        height={72}
        className="absolute bottom-20 right-1/4 w-14 h-7 sm:w-20 sm:h-10 md:w-28 md:h-14 lg:w-36 lg:h-18 xl:w-44 xl:h-22 opacity-75 animate-floatX"
        loading="lazy"
        priority={false}
      />
      
      {/* Gentle mist effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
    </div>
  );
}
