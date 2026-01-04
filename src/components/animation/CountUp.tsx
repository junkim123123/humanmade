"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({
  from = 0,
  to,
  duration = 2,
  decimals = 2,
  prefix = "",
  suffix = "",
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const spring = useSpring(from, {
    stiffness: 100,
    damping: 30,
  });

  const display = useTransform(spring, (current) => {
    if (decimals === 0) {
      return Math.floor(current).toString();
    }
    return current.toFixed(decimals);
  });

  useEffect(() => {
    if (isInView) {
      spring.set(to);
    }
  }, [isInView, to, spring]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

