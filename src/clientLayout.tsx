"use client";

import { useState, useEffect, ReactNode } from "react";
import Loader from "./app/components/loader/page";
import Header from "./app/components/header/page";
import Link from "next/link";

interface ComponentItem {
  id: number;
  title: string;
  description: string;
  image: string;
  path?: string;
}

// Example component data
const componentsList: ComponentItem[] = [
  {
    id: 1,
    title: "Interview Room",
    description:
      "You are in a professional interview room with three interviewers. ",
    image:
      "https://t4.ftcdn.net/jpg/03/34/41/37/360_F_334413713_bZTbjUAzd6ZhedjKLWGpYORJVIx4f0X7.jpg",
    path: "/cards/interviewRoom",
  },
  {
    id: 2,
    title: "Weekly Check-In",
    description: "Workplace conversation with your manager.",
    image:
      "https://png.pngtree.com/png-vector/20250110/ourmid/pngtree-marketing-manager-3d-icon-with-sleek-design-isolated-on-white-background-png-image_15137962.png",
    path: "/cards/weeklyCheckWithManager",
  },
  {
    id: 3,
    title: "Parking Ticket Encounter",
    description: "Police encounter - Explain your parking situation.",
    image:
      "https://thumbs.dreamstime.com/b/claymation-police-dog-parking-ticket-scene-detailed-look-stop-motion-animation-captivating-still-image-short-film-395049218.jpg",
    path: "/cards/parkingTicket",
  },
  {
    id: 4,
    title: "Fashion Outlet Customer",
    description: "You're a customer at Fashion Outlet with multiple issues that need to be resolved at checkout.",
    image:
      "outletConvo.png",
    path: "/cards/outletCustomer",
  },
  {
    id: 5,
    title: "911 Emergency",
    description: "You have called 911. Tell them your Emergency.",
    image:
      "https://cdn3d.iconscout.com/3d/premium/thumb/emergency-call-12217661-9967041.png",
    // path: "/cards/emergency911",
  },
];

interface ClientLayoutProps {
  children?: ReactNode;
}

export default function ClientLayout({
  children,
}: ClientLayoutProps): React.JSX.Element {
  const [loading, setLoading] = useState(true);

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
        {/* Large fluffy cloud */}
        <div className="absolute top-20 left-10 w-96 h-32 bg-white/80 rounded-full blur-sm animate-floatX">
          <div className="absolute -top-8 left-8 w-24 h-24 bg-white/80 rounded-full blur-sm"></div>
          <div className="absolute -top-4 left-16 w-32 h-32 bg-white/80 rounded-full blur-sm"></div>
          <div className="absolute -top-6 left-32 w-28 h-28 bg-white/80 rounded-full blur-sm"></div>
          <div className="absolute -top-2 left-48 w-20 h-20 bg-white/80 rounded-full blur-sm"></div>
        </div>

        {/* Medium cloud */}
        <div className="absolute top-40 right-20 w-64 h-24 bg-white/70 rounded-full blur-sm animate-floatY">
          <div className="absolute -top-6 left-6 w-20 h-20 bg-white/70 rounded-full blur-sm"></div>
          <div className="absolute -top-3 left-12 w-24 h-24 bg-white/70 rounded-full blur-sm"></div>
          <div className="absolute -top-5 left-24 w-16 h-16 bg-white/70 rounded-full blur-sm"></div>
        </div>

        {/* Small cloud */}
        <div className="absolute top-60 left-1/3 w-48 h-20 bg-white/60 rounded-full blur-sm animate-floatX">
          <div className="absolute -top-4 left-4 w-16 h-16 bg-white/60 rounded-full blur-sm"></div>
          <div className="absolute -top-2 left-12 w-20 h-20 bg-white/60 rounded-full blur-sm"></div>
        </div>

        {/* Floating cloud cluster */}
        <div className="absolute top-80 right-1/4 w-72 h-28 bg-white/50 rounded-full blur-sm animate-floatY">
          <div className="absolute -top-6 left-8 w-20 h-20 bg-white/50 rounded-full blur-sm"></div>
          <div className="absolute -top-3 left-20 w-24 h-24 bg-white/50 rounded-full blur-sm"></div>
          <div className="absolute -top-5 left-36 w-16 h-16 bg-white/50 rounded-full blur-sm"></div>
        </div>

        {/* High floating cloud */}
        <div className="absolute top-10 right-1/3 w-56 h-20 bg-white/40 rounded-full blur-sm animate-floatX">
          <div className="absolute -top-4 left-6 w-16 h-16 bg-white/40 rounded-full blur-sm"></div>
          <div className="absolute -top-2 left-16 w-20 h-20 bg-white/40 rounded-full blur-sm"></div>
        </div>

        {/* Gentle mist effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
      </div>

      {/* Foreground */}
      <div className="relative z-10 w-full h-full overflow-y-auto">
        <Header />

        <main className="w-full flex flex-col items-center py-6 sm:py-8 lg:py-12 px-3 sm:px-6">
          <div className="w-full max-w-7xl">
            {/* Hero Section - Floating Cloud Card */}
            <div className="relative overflow-hidden w-full rounded-3xl bg-gradient-to-r from-violet-200 to-pink-200 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6 sm:p-8 mb-8 sm:mb-10 lg:mb-12 text-center">
              {/* Cloud decorations */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/60 rounded-full blur-sm"></div>
              <div className="absolute -top-2 -left-2 w-12 h-12 bg-white/60 rounded-full blur-sm"></div>
              <div className="absolute -top-6 right-8 w-20 h-20 bg-white/60 rounded-full blur-sm"></div>
              <div className="absolute -top-3 right-4 w-14 h-14 bg-white/60 rounded-full blur-sm"></div>
              
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

          {/* Cards Grid - Floating Cloud Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-center gap-6 sm:gap-8 lg:gap-10 max-w-7xl w-full">
            {componentsList.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-3xl overflow-hidden transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-2xl hover:scale-[1.02]"
                style={{ boxShadow: "0 15px 35px rgba(0, 0, 0, 0.1)" }}
              >
                {/* Card frame - Cloud-like */}
                <div className="rounded-3xl bg-white/90 backdrop-blur-xl ring-1 ring-white/50 relative overflow-hidden">
                  {/* Cloud decorations on card */}
                  <div className="absolute top-2 left-2 w-8 h-8 bg-white/60 rounded-full blur-sm"></div>
                  <div className="absolute top-4 right-3 w-6 h-6 bg-white/60 rounded-full blur-sm"></div>
                  <div className="absolute bottom-4 left-3 w-10 h-10 bg-white/60 rounded-full blur-sm"></div>
                  
                  {/* Badge */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                    <span
                      className={`text-xs px-3 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg ${
                        item.path
                          ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white ring-1 ring-emerald-300/60"
                          : "bg-gradient-to-r from-gray-400 to-gray-500 text-white ring-1 ring-gray-300/60"
                      }`}
                    >
                      {item.path ? "Available" : "Coming Soon"}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="w-full h-44 sm:h-48 flex items-center justify-center p-4">
                    <div className="w-full h-full flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-2">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="object-contain h-full transition-transform duration-500 group-hover:scale-110"
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
                      <Link href={item.path}>
                        <button className="sm:hidden mt-4 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                          <span className="cursor-pointer">Begin Journey</span> 
                        </button>
                      </Link>
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

                {/* Hover layer (desktop) - Enhanced cloud effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-sky-50/95 backdrop-blur-xl p-6 sm:p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center text-center pointer-events-none sm:pointer-events-auto rounded-3xl">
                  {/* Floating elements on hover */}
                  <div className="absolute top-4 left-4 w-6 h-6 bg-white/80 rounded-full blur-sm animate-pulse"></div>
                  <div className="absolute top-6 right-6 w-4 h-4 bg-white/80 rounded-full blur-sm animate-pulse delay-100"></div>
                  <div className="absolute bottom-6 left-6 w-8 h-8 bg-white/80 rounded-full blur-sm animate-pulse delay-200"></div>
                  
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h4>
                  <p className="text-sm sm:text-base text-gray-700 max-w-xs px-2 leading-relaxed">
                    {item.description}
                  </p>
                  {item.path ? (
                    <Link href={item.path}>
                      <button className="mt-5 sm:mt-6 px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-base font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform">
                        Begin Journey
                      </button>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="mt-5 sm:mt-6 px-8 py-3 rounded-2xl bg-gray-300 text-gray-600 text-base font-semibold cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes floatX {
          0%, 100% { transform: translateX(0px) rotate(0deg); }
          25% { transform: translateX(10px) rotate(1deg); }
          50% { transform: translateX(-5px) rotate(-1deg); }
          75% { transform: translateX(15px) rotate(0.5deg); }
        }
        
        @keyframes floatY {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-0.5deg); }
          50% { transform: translateY(5px) rotate(0.5deg); }
          75% { transform: translateY(-12px) rotate(-1deg); }
        }
        
        .animate-floatX {
          animation: floatX 20s ease-in-out infinite;
        }
        
        .animate-floatY {
          animation: floatY 25s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}