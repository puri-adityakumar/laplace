"use client"

import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/motion"
import { CountUpNumber } from "@/components/animations/text-effects"

const steps = [
  {
    number: 1,
    title: "Add to Browser (30 seconds)",
    description: "Chrome or Edge. Click install. Done.",
  },
  {
    number: 2,
    title: "Connect Your API Key",
    description: "Paste your OpenRouter key. It never leaves your browser.",
  },
  {
    number: 3,
    title: "Write Descriptions in 1 Click",
    description: "Open any PR. Hit the button. Get a professional description.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold tracking-tighter text-foreground md:text-4xl">How it works</h2>
          <p className="mt-4 text-muted-foreground">Get started in under a minute</p>
        </AnimatedSection>
        <StaggerContainer 
          className="grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-3"
          staggerDelay={0.15}
        >
          {steps.map((step) => (
            <StaggerItem key={step.number}>
              <div className="flex flex-col items-center bg-card p-8 text-center">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-muted text-sm font-medium text-primary">
                  <CountUpNumber 
                    end={step.number} 
                    duration={600}
                    format={(n) => String(n).padStart(2, "0")}
                  />
                </div>
                <h3 className="mb-2 font-medium text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
