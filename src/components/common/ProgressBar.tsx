import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  size = 'md',
  animated = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  const heightClass = {
    sm: 'h-2',
    md: 'h-3.5',
    lg: 'h-5',
  }[size];

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span>Progress</span>
          <span className="text-brand-600 dark:text-brand-400 font-bold">{clampedProgress}%</span>
        </div>
      )}
      <div
        className={`w-full ${heightClass} rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden relative shadow-inner`}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 transition-all duration-700 ease-out relative shadow-sm ${
            animated && clampedProgress > 0 ? 'shadow-brand-500/30' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        >
          {/* Subtle light sheen highlight */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
};
