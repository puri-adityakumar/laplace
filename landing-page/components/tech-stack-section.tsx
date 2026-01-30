"use client"

import { AnimatedSection } from "@/components/motion"

export function TechStackSection() {
  const tech = ["React", "TypeScript", "Vite", "Chrome Extension API", "OpenAI API"]

  return (
    <section className="border-b border-border py-16">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection>
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">
            <span className="text-sm text-muted-foreground">Built with</span>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {tech.map((item) => (
                <div
                  key={item}
                  className="tech-tag rounded-sm border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground cursor-default"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
