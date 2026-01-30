"use client"

import { motion, useSpring, useTransform } from "framer-motion"
import { ReactNode, useRef, useState, MouseEvent } from "react"
import { ArrowRight } from "lucide-react"

// Magnetic button effect
interface MagneticButtonProps {
  children: ReactNode
  className?: string
  strength?: number
}

export function MagneticButton({ children, className = "", strength = 0.3 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  // Spring physics for smooth movement
  const x = useSpring(0, { stiffness: 150, damping: 15, mass: 0.1 })
  const y = useSpring(0, { stiffness: 150, damping: 15, mass: 0.1 })
  
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    
    x.set(distanceX * strength)
    y.set(distanceY * strength)
  }
  
  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }
  
  const handleMouseEnter = () => {
    setIsHovered(true)
  }
  
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </motion.div>
  )
}

// Spring button with enhanced interactions
interface SpringButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function SpringButton({ children, className = "", onClick }: SpringButtonProps) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      whileHover={{ 
        scale: 1.02, 
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{ 
        scale: 0.97,
        transition: { type: "spring", stiffness: 500, damping: 30 }
      }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.button>
  )
}

// Arrow link with slide effect
interface ArrowLinkProps {
  children: ReactNode
  href: string
  className?: string
  external?: boolean
}

export function ArrowLink({ children, href, className = "", external = false }: ArrowLinkProps) {
  return (
    <motion.a
      href={href}
      className={`inline-flex items-center gap-2 group ${className}`}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      whileHover="hover"
    >
      {children}
      <motion.span
        variants={{
          hover: { x: 4 }
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <ArrowRight className="h-4 w-4" />
      </motion.span>
    </motion.a>
  )
}

// Click ripple effect wrapper
interface RippleProps {
  children: ReactNode
  className?: string
}

export function Ripple({ children, className = "" }: RippleProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    
    setRipples(prev => [...prev, { x, y, id }])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)
  }
  
  return (
    <div className={`relative overflow-hidden ${className}`} onClick={handleClick}>
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ 
            width: 300, 
            height: 300, 
            opacity: 0 
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </div>
  )
}
