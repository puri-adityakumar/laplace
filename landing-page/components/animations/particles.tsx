"use client"

import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { useEffect, useState, useMemo } from "react"

interface Particle {
  id: number
  char: string
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
}

const codeSymbols = ["{", "}", "//", "<>", "+", "-", "*", "=", "|", "&", ";", ":", "[", "]", "(", ")", "?", "!", "~", "`"]

export function CodeParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return
    
    // Generate random particles
    const newParticles: Particle[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      char: codeSymbols[Math.floor(Math.random() * codeSymbols.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 12 + 10,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.08 + 0.03,
    }))
    
    setParticles(newParticles)
  }, [])
  
  if (!isClient || particles.length === 0) return null
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute font-mono text-foreground select-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: particle.size,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {particle.char}
        </motion.div>
      ))}
    </div>
  )
}

// Multi-layer parallax container
interface ParallaxContainerProps {
  children: React.ReactNode
}

export function ParallaxContainer({ children }: ParallaxContainerProps) {
  const { scrollY } = useScroll()
  
  // Different layers move at different speeds
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 200])
  const midgroundY = useTransform(scrollY, [0, 1000], [0, 100])
  const foregroundY = useTransform(scrollY, [0, 1000], [0, 50])
  
  // Smooth the values
  const smoothBackgroundY = useSpring(backgroundY, { stiffness: 100, damping: 30 })
  const smoothMidgroundY = useSpring(midgroundY, { stiffness: 100, damping: 30 })
  const smoothForegroundY = useSpring(foregroundY, { stiffness: 100, damping: 30 })
  
  return (
    <div className="relative">
      {/* Background Layer - Grid + Particles */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        style={{ y: smoothBackgroundY, zIndex: -3 }}
      >
        <div className="bg-grid-subtle absolute inset-0 opacity-40" />
        <CodeParticles />
      </motion.div>
      
      {/* Midground Layer - Could be used for decorative elements */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        style={{ y: smoothMidgroundY, zIndex: -2 }}
      />
      
      {/* Foreground Layer - Content moves naturally */}
      <motion.div style={{ y: smoothForegroundY }}>
        {children}
      </motion.div>
    </div>
  )
}

// Depth layer component for specific sections
interface DepthLayerProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export function DepthLayer({ children, speed = 0.5, className = "" }: DepthLayerProps) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, 1000 * speed])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 })
  
  return (
    <motion.div style={{ y: smoothY }} className={className}>
      {children}
    </motion.div>
  )
}
