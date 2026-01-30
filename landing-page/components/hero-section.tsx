"use client"

import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Github, Chrome } from "lucide-react"
import { TypewriterText, ShimmerBadge } from "@/components/animations/text-effects"
import { MagneticButton, Ripple } from "@/components/animations/interactive"
import { CodeParticles } from "@/components/animations/particles"
import { popVariants, fadeUpVariants, springs } from "@/components/motion"

const bulletPoints = [
  "Added AuthContext for global auth state",
  "Implemented login/logout API routes",
  "Created ProtectedRoute wrapper component",
  "Updated navigation with user menu",
]

export function HeroSection() {
  // Parallax effect for grid background
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30, restDelta: 0.001 })

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Hero particles layer - grid is handled by page background */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: smoothY, zIndex: 1 }}
      >
        <CodeParticles />
      </motion.div>
      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Badge with shimmer effect */}
          <motion.div
            className="mb-6"
            initial="hidden"
            animate="visible"
            variants={popVariants}
          >
            <ShimmerBadge className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1">
              <span className="text-xs text-primary font-medium">New</span>
              <span className="text-xs text-muted-foreground">Now with multi-language support</span>
            </ShimmerBadge>
          </motion.div>
          {/* SEO H1 - visually hidden but available to search engines */}
          <h1 className="sr-only">
            AI PR Description Generator for GitHub - Stop Writing PR Descriptions Manually
          </h1>
          {/* Typewriter H1 for visual display */}
          <motion.div
            className="max-w-3xl text-balance text-4xl font-bold tracking-tighter text-foreground md:text-5xl lg:text-6xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            role="text"
            aria-label="Stop writing PR descriptions"
          >
            <TypewriterText 
              text="Stop writing PR descriptions" 
              charDelay={50}
            />
          </motion.div>
          {/* Description with fade up */}
          <motion.p
            className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            transition={{ delay: 0.8 }}
          >
            One click on any GitHub PR page generates a professional description from your actual changes. 
            No more staring at blank text boxes.
          </motion.p>

          {/* Buttons with magnetic effect */}
          <motion.div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            transition={{ delay: 1 }}
          >
            <MagneticButton strength={0.2}>
              <Ripple>
                <Button 
                  asChild 
                  size="lg" 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={springs.button}
                  >
                    <Link href="#install" className="flex items-center gap-2">
                      <Chrome className="h-4 w-4" aria-hidden="true" />
                      Add to Chrome — It's Free
                    </Link>
                  </motion.div>
                </Button>
              </Ripple>
            </MagneticButton>

            <MagneticButton strength={0.2}>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 border-border bg-transparent text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={springs.button}
                >
                  <Link 
                    href="#how-it-works" 
                    className="flex items-center gap-2"
                  >
                    <Github className="h-4 w-4" aria-hidden="true" />
                    See How It Works
                  </Link>
                </motion.div>
              </Button>
            </MagneticButton>
          </motion.div>
        </div>

        {/* Browser Mockup with glow pulse and staggered bullets */}
        <motion.div
          className="mt-16 md:mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="mx-auto max-w-4xl overflow-hidden rounded-sm border border-border bg-card animate-glow-pulse">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="ml-4 flex-1">
                <div className="mx-auto max-w-md rounded-sm bg-background px-3 py-1 text-xs text-muted-foreground">
                  github.com/acme/project/pull/42
                </div>
              </div>
            </div>
            {/* PR Interface */}
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-sm bg-primary/20 px-2 py-0.5 text-xs text-primary">Open</div>
                <span className="text-sm text-foreground">feat: Add user authentication flow</span>
              </div>
              <div className="rounded-sm border border-border bg-muted p-4">
                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-4 w-4 rounded-full bg-primary/30" />
                  <span>Generated by Laplace</span>
                </div>
                <div className="space-y-2 text-sm text-foreground">
                  <p className="font-medium">Summary</p>
                  <p className="text-muted-foreground">
                    This PR implements user authentication including login, logout, and session management. It adds
                    protected routes and integrates with the existing user service.
                  </p>
                  <p className="mt-4 font-medium">Changes</p>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    {bulletPoints.map((point, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: 1.4 + index * 0.1,
                          duration: 0.4,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                      >
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
