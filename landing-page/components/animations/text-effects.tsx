"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useState, useEffect, ReactNode } from "react"

// Typewriter text effect
interface TypewriterTextProps {
  text: string
  className?: string
  charDelay?: number
  cursorBlinkSpeed?: number
  onComplete?: () => void
}

export function TypewriterText({ 
  text, 
  className = "", 
  charDelay = 50,
  cursorBlinkSpeed = 600,
  onComplete,
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [hasVisited, setHasVisited] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  
  // Check sessionStorage on mount
  useEffect(() => {
    const visited = window.sessionStorage.getItem("laplace-visited")
    if (visited) {
      setHasVisited(true)
      setDisplayText(text)
      setCurrentIndex(text.length)
      setIsComplete(true)
    }
  }, [text])
  
  // Typewriter animation
  useEffect(() => {
    if (hasVisited || shouldReduceMotion || currentIndex >= text.length) {
      return
    }
    
    const timeout = setTimeout(() => {
      setDisplayText(text.slice(0, currentIndex + 1))
      setCurrentIndex(prev => prev + 1)
    }, charDelay)
    
    return () => clearTimeout(timeout)
  }, [currentIndex, text, charDelay, hasVisited, shouldReduceMotion])
  
  // Handle completion
  useEffect(() => {
    if (currentIndex >= text.length && !isComplete && !hasVisited) {
      setIsComplete(true)
      window.sessionStorage.setItem("laplace-visited", "true")
      onComplete?.()
    }
  }, [currentIndex, text.length, isComplete, hasVisited, onComplete])
  
  // Cursor blink - runs continuously until complete
  useEffect(() => {
    if (isComplete || hasVisited || shouldReduceMotion) return
    
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, cursorBlinkSpeed)
    
    return () => clearInterval(interval)
  }, [isComplete, hasVisited, shouldReduceMotion, cursorBlinkSpeed])
  
  // Fade out cursor after completion
  useEffect(() => {
    if (!isComplete) return
    
    const timeout = setTimeout(() => {
      setShowCursor(false)
    }, 1500)
    
    return () => clearTimeout(timeout)
  }, [isComplete])
  
  return (
    <span className={className}>
      {displayText}
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: showCursor ? 1 : 0 }}
        transition={{ duration: 0.1 }}
        className="text-primary inline-block"
        style={{ 
          marginLeft: "2px",
          fontWeight: 100,
        }}
      >
        |
      </motion.span>
    </span>
  )
}

// Shimmer badge effect
interface ShimmerBadgeProps {
  children: ReactNode
  className?: string
}

export function ShimmerBadge({ children, className = "" }: ShimmerBadgeProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 5,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 3,
        }}
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        }}
      />
    </div>
  )
}

// Count up number animation
interface CountUpNumberProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  format?: (n: number) => string
}

export function CountUpNumber({
  end,
  duration = 600,
  prefix = "",
  suffix = "",
  className = "",
  format = (n) => String(n).padStart(2, "0"),
}: CountUpNumberProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  
  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(end)
      return
    }
    
    if (!isVisible) return
    
    const startTime = Date.now()
    const endTime = startTime + duration
    
    const updateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      
      // easeOutQuart
      const easedProgress = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.floor(easedProgress * end)
      
      setCount(currentCount)
      
      if (now < endTime) {
        requestAnimationFrame(updateCount)
      } else {
        setCount(end)
      }
    }
    
    requestAnimationFrame(updateCount)
  }, [isVisible, end, duration, shouldReduceMotion])
  
  return (
    <motion.span
      className={className}
      onViewportEnter={() => setIsVisible(true)}
      viewport={{ once: true, margin: "-50px" }}
    >
      {prefix}{format(count)}{suffix}
    </motion.span>
  )
}

// Keyword highlight pulse effect
interface KeywordPulseProps {
  children: ReactNode
  className?: string
}

export function KeywordPulse({ children, className = "" }: KeywordPulseProps) {
  return (
    <motion.span
      className={`text-primary ${className}`}
      animate={{
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {children}
    </motion.span>
  )
}
