import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  /** Distance in px for the slide-up effect */
  slideDistance?: number;
}

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 0.7,
  className = "",
  slideDistance = 60,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: slideDistance }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: slideDistance }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
