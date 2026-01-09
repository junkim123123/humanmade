"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingStateProps {
  progress?: number; // 0-100, optional for backward compatibility
  currentStep?: string; // Current step description
  estimatedTimeRemaining?: number; // seconds
}

// Intelligence pipeline steps for streaming feed
const INTELLIGENCE_STEPS = [
  "Analyzing product images...",
  "Extracting product details...",
  "Identifying category and materials...",
  "Scanning trade data...",
  "Matching suppliers...",
  "Analyzing HS codes...",
  "Calculating duty rates...",
  "Estimating shipping costs...",
  "Computing landed costs...",
  "Generating market insights...",
  "Finalizing report...",
];

export function LoadingState({ progress, currentStep, estimatedTimeRemaining }: LoadingStateProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [streamingSteps, setStreamingSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Animate progress smoothly - fast at start, smooth at end
  useEffect(() => {
    if (progress !== undefined) {
      const target = Math.min(100, Math.max(0, progress));
      const diff = target - animatedProgress;
      if (Math.abs(diff) > 0.5) {
        // Initial progress (0-40%) is fast, late progress (40%+) is smooth
        const isEarlyStage = animatedProgress < 40;
        const duration = isEarlyStage 
          ? Math.max(200, Math.min(800, Math.abs(diff) * 10)) // Initial: 200-800ms (fast)
          : Math.max(500, Math.min(2000, Math.abs(diff) * 20)); // Late: 500-2000ms (smooth)
        const steps = isEarlyStage ? 20 : 30; // Fewer steps for faster initial progress
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

  // Intelligence Streaming Feed - Add steps based on progress
  useEffect(() => {
    if (progress === undefined) return;
    
    // Calculate which step we should be on based on progress
    const stepIndex = Math.min(
      Math.floor((progress / 100) * INTELLIGENCE_STEPS.length),
      INTELLIGENCE_STEPS.length - 1
    );
    
    // Add new step if we've progressed
    if (stepIndex > currentStepIndex) {
      setCurrentStepIndex(stepIndex);
      const newStep = INTELLIGENCE_STEPS[stepIndex];
      if (newStep && !streamingSteps.includes(newStep)) {
        setStreamingSteps((prev) => [...prev, newStep]);
      }
    }
    
    // Also add step if currentStep matches one of our intelligence steps
    if (currentStep && INTELLIGENCE_STEPS.includes(currentStep) && !streamingSteps.includes(currentStep)) {
      setStreamingSteps((prev) => [...prev, currentStep]);
    }
  }, [progress, currentStep, currentStepIndex, streamingSteps]);

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
      {/* Intelligence Streaming Feed */}
      {streamingSteps.length > 0 && (
        <div className="w-full max-w-md mb-8">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-48 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Intelligence Pipeline</h4>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {streamingSteps.map((step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="flex-1">{step}</span>
                    {index === streamingSteps.length - 1 && (
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Spinner & Magic Effect */}
      <div className="relative mb-8 w-24 h-24">
        {/* Outer circle */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="w-full h-full rounded-full border-4 border-slate-200/50 border-t-slate-900" />
        </motion.div>
        {/* Inner circle */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 p-4"
        >
          <div className="w-full h-full rounded-full border-2 border-blue-200/50 border-t-blue-500" />
        </motion.div>
        
        {/* Magic sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0], 
              opacity: [0, 1, 0],
              x: `${Math.cos((i / 6) * 2 * Math.PI) * 48}px`,
              y: `${Math.sin((i / 6) * 2 * Math.PI) * 48}px`,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full"
            style={{ originX: '0px', originY: '0px' }}
          />
        ))}
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
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h3 className="text-lg font-semibold text-slate-900">Let the magic happen</h3>
          <p className="text-sm text-slate-500 mt-1">
            Our AI is analyzing your product...
          </p>
        </motion.div>
      )}

      <p className="text-xs text-slate-500 -mt-2 mb-4">
        This usually takes around 2 minutes.
      </p>

      {/* Elapsed Time */}
      <div className="text-xs text-slate-400 mt-4">
        {formatTime(elapsedTime)} elapsed
      </div>
    </div>
  );
}
