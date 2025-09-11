"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCartIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface ConditionalNavigationProps {
  isDarkMode?: boolean;
}

export default function ConditionalNavigation({ isDarkMode = false }: ConditionalNavigationProps) {
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has purchased on component mount
  useEffect(() => {
    const checkPurchaseStatus = () => {
      try {
        const purchaseStatus = localStorage.getItem('speakgrade_purchase_status');
        if (purchaseStatus === 'purchased') {
          setIsPurchased(true);
        }
      } catch (error) {
        console.error('Error checking purchase status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPurchaseStatus();
  }, []);

  // Handle purchase completion
  const handlePurchaseComplete = () => {
    localStorage.setItem('speakgrade_purchase_status', 'purchased');
    setIsPurchased(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <div className="animate-pulse bg-gray-300 rounded-lg h-8 w-24"></div>
      </div>
    );
  }

  if (!isPurchased) {
    // Show purchase button
    return (
      <div className="flex items-center gap-4">
        <Link href="/purchase" passHref>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
          }`}>
            <ShoppingCartIcon className="w-5 h-5" />
            <span className="text-sm sm:text-base font-semibold">Get Lite Version</span>
          </div>
        </Link>
      </div>
    );
  }

  // Show navigation after purchase
  return (
    <div className="flex items-center gap-4">
      {/* Dashboard Link */}
      <Link href="/dashboard" passHref>
        <div className={`flex items-center gap-2 text-sm font-medium transition-all cursor-pointer ${
          isDarkMode ? 'text-slate-300 hover:text-stone-200' : 'text-blue-700 hover:text-purple-900'
        }`}>
          <CheckCircleIcon className="w-4 h-4" />
          Dashboard
        </div>
      </Link>
      
      {/* Learn More Link */}
      {/* <Link href="/" passHref>
        <div className={`flex items-center gap-2 text-sm font-medium transition-all cursor-pointer ${
          isDarkMode ? 'text-slate-300 hover:text-stone-200' : 'text-purple-700 hover:text-purple-900'
        }`}>
          Learn More
        </div>
      </Link> */}
    </div>
  );
}
