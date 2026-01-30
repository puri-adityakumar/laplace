"use client"

import { motion } from "framer-motion"
import { Sparkles, KeyRound, Cpu, Globe } from "lucide-react"
import { AnimatedSection, StaggerContainer, StaggerItem, springs } from "@/components/motion"

const features = [
  {
    icon: Sparkles,
    title: "No More Context Switching",
    description:
      "One button on the PR page. No alt-tabbing, no copy-pasting, no 'what did I change again?'",
  },
  {
    icon: KeyRound,
    title: "Your Key, Your Control",
    description:
      "Use your own OpenRouter API key. We never see it, never store it, never bill you. It stays in your browser only.",
  },
  {
    icon: Cpu,
    title: "Quality or Speed? You Choose",
    description:
      "Pick GPT-4o for detailed reviews when it matters. Use GPT-3.5 when you're in a hurry. Match the model to the moment.",
  },
  {
    icon: Globe,
    title: "Your Team Speaks Your Language",
    description:
      "Generate descriptions in 8 languages. Your international reviewers deserve clear context, not Google Translate.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold tracking-tighter text-foreground md:text-4xl">Built for developers</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">Everything you need to streamline your PR workflow</p>
        </AnimatedSection>
        <StaggerContainer 
          className="grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-2"
          staggerDelay={0.1}
        >
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.div 
                className="feature-card flex gap-6 bg-card p-6 transition-colors hover:bg-muted cursor-pointer"
                whileHover={{ scale: 1.02 }}
                transition={springs.gentle}
              >
                <motion.div 
                  className="feature-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-border bg-muted"
                  whileHover={{ scale: 1.1 }}
                  transition={springs.button}
                >
                  <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </motion.div>
                <div>
                  <h3 className="mb-2 font-medium text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
