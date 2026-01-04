"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingStateProps {
  progress?: number; // 0-100, optional for backward compatibility
  currentStep?: string; // Current step description
  estimatedTimeRemaining?: number; // seconds
}

export function LoadingState({ progress, currentStep, estimatedTimeRemaining }: LoadingStateProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Animate progress smoothly
  useEffect(() => {
    if (progress !== undefined) {
      const target = Math.min(100, Math.max(0, progress));
      const diff = target - animatedProgress;
      if (Math.abs(diff) > 0.5) {
        const duration = 300;
        const steps = 20;
        const increment = diff / steps;
        let current = animatedProgress;
        const interval = setInterval(() => {
          current += increment;
          if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            current = target;
            clearInterval(interval);
          }
          setAnimatedProgress(current);
        }, duration / steps);
        return () => clearInterval(interval);
      }
    }
  }, [progress, animatedProgress]);

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fallback: simulate progress if not provided (for backward compatibility)
  useEffect(() => {
    if (progress === undefined) {
      const interval = setInterval(() => {
        setAnimatedProgress((prev) => {
          // Slow down as it approaches 100%
          if (prev >= 95) return prev;
          const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5;
          return Math.min(95, prev + increment);
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [progress]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const displayProgress = progress !== undefined ? animatedProgress : animatedProgress;
  const isComplete = displayProgress >= 100;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 min-h-[500px]">
      {/* Spinner */}
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-slate-900" />
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-6">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-slate-900 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-600 font-medium">
            {Math.round(displayProgress)}%
          </span>
          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <span className="text-slate-500">
              ~{formatTime(estimatedTimeRemaining)} remaining
            </span>
          )}
        </div>
      </div>

      {/* Current Step */}
      {currentStep && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <p className="text-sm font-medium text-slate-900">{currentStep}</p>
        </motion.div>
      )}

      {/* Default message if no step provided */}
      {!currentStep && (
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-slate-900">
            Analyzing your product
          </p>
          <p className="text-xs text-slate-500 mt-1">
            This usually takes 2-3 minutes
          </p>
        </div>
      )}

      {/* Elapsed Time */}
      <div className="text-xs text-slate-400 mt-4">
        {formatTime(elapsedTime)} elapsed
      </div>
    </div>
  );
}
