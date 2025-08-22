"use client";

interface SoundWaveProps {
  speaking: boolean;
}

export default function SoundWave({ speaking }: SoundWaveProps): React.JSX.Element {
  const bars = [...Array(10)];
  
  return (
    <div className="flex items-center space-x-1 mt-2 bg-white p-1 rounded-full overflow-hidden">
      {bars.map((_, i) => (
        <div
          key={i}
          className="w-[1px] bg-gradient-to-t from-purple-900 to-pink-500"
          style={{
            height: speaking ? `${Math.random() * 30 + 10}px` : "2px",
            animation: speaking
              ? `wave 1s infinite ease-in-out ${i * 0.05}s`
              : "none",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes wave {
          0%,
          100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}
