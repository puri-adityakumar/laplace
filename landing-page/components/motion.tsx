"use client"

import { motion, useReducedMotion, useScroll, useTransform, useSpring, Variants, Transition } from "framer-motion"
import { ReactNode, useEffect, useState } from "react"

// Spring presets for consistent animations
export const springs = {
  button: { type: "spring", stiffness: 400, damping: 25 },
  smooth: { type: "spring", stiffness: 100, damping: 20 },
  bounce: { type: "spring", stiffness: 300, damping: 15 },
  gentle: { type: "spring", stiffness: 50, damping: 15 },
} as const

// Reduced motion friendly transitions
export const safeTransition = (transition: Transition): Transition => {
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (prefersReducedMotion) {
    return { duration: 0 }
  }
  return transition
}

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedSection({ children, className = "", delay = 0 }: AnimatedSectionProps) {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={safeTransition({
        duration: 0.5,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      })}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({ children, className = "", staggerDelay = 0.1 }: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: safeTransition({
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
          }),
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Parallax wrapper component
interface ParallaxProps {
  children: ReactNode
  className?: string
  speed?: number
}

export function Parallax({ children, className = "", speed = 0.3 }: ParallaxProps) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, 1000 * speed])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30, restDelta: 0.001 })
  
  return (
    <motion.div style={{ y: smoothY }} className={className}>
      {children}
    </motion.div>
  )
}

// Magnetic effect hook
export function useMagnetic(strength: number = 0.3) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches)
  }, [])
  
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (isTouchDevice) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    
    setPosition({
      x: distanceX * strength,
      y: distanceY * strength,
    })
  }
  
  const handleMouseLeave = () => {
    setIsHovered(false)
    setPosition({ x: 0, y: 0 })
  }
  
  const handleMouseEnter = () => {
    setIsHovered(true)
  }
  
  return {
    position,
    isHovered,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      onMouseEnter: handleMouseEnter,
    },
  }
}

// Spring button animation variants
export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.02,
    y: -2,
    transition: springs.button,
  },
  tap: { 
    scale: 0.97,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
}

// Stagger children variants for lists
export const staggerChildrenVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
}

// Fade up entrance variant
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Pop scale variant for badges
export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
}
