import { motion } from "framer-motion";
import type{ ReactNode } from "react";

interface SlideInProps {
  children: ReactNode;
  delay?: number; 
  duration?: number;
  direction?: "left" | "right" | "up" | "down"; 
  className?: string;
}

export default function SlideIn({ 
  children, 
  delay = 0, 
  duration = 0.8, 
  direction = "left", 
  className =""
}: SlideInProps) {
  
  // Xác định vị trí bắt đầu dựa trên hướng
  const directions = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    up: { x: 0, y: 100 },
    down: { x: 0, y: -100 },
  };

  return (
    <motion.div
      className={className}
      initial={{ 
        opacity: 0, 
        x: directions[direction].x, 
        y: directions[direction].y 
      }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration: duration, 
        delay: delay, 
        ease: "easeOut" 
      }}
    >
      {children}
    </motion.div>
  );
}