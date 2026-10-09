import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  centerContent?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 140,
  strokeWidth = 12,
  centerContent,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
          fill="transparent"
        />

        {/* Progress foreground circle with gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressRingGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />

        <defs>
          <linearGradient id="progressRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-600, #059669)" />
            <stop offset="50%" stopColor="var(--brand-500, #10b981)" />
            <stop offset="100%" stopColor="var(--brand-400, #34d399)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerContent || (
          <div>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              {clampedProgress}%
            </span>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Saved
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
