"use client"

import Link from "next/link"
import { AnimatedSection } from "@/components/motion"
import { Button } from "@/components/ui/button"
import { Chrome, ArrowRight } from "lucide-react"

// Microsoft Edge icon SVG
function EdgeIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21.86 11.16c.04-2.62-.48-4.94-1.54-6.9-.54-.97-1.23-1.84-2.04-2.57-.93-.85-2.04-1.5-3.27-1.91-1.42-.47-2.95-.67-4.54-.56-2.03.14-3.84.74-5.37 1.75-1.42.93-2.55 2.2-3.28 3.7-.57 1.18-.88 2.5-.88 3.9 0 .53.05 1.04.14 1.53.19 1.01.55 1.95 1.04 2.79.76 1.35 1.85 2.45 3.16 3.17 1.23.67 2.64 1.02 4.12 1.02 1.27 0 2.47-.27 3.56-.76.88-.39 1.68-.91 2.38-1.54.73-.65 1.35-1.42 1.84-2.28.4-.71.69-1.47.87-2.27.06-.26.1-.52.13-.79.02-.19.03-.38.03-.58H12.5c0-2.48 2.02-4.5 4.5-4.5 1.23 0 2.34.49 3.16 1.29.34.33.63.71.86 1.13.11.21.21.43.29.66.1.28.17.57.21.87.04.28.06.56.06.85 0 .2-.01.4-.04.59-.02.17-.05.34-.09.51-.07.29-.16.57-.27.84-.21.52-.49 1-.83 1.44-.63.82-1.43 1.47-2.36 1.93-.91.45-1.92.71-2.98.76-.17.01-.34.02-.51.02-.87 0-1.7-.17-2.47-.48-.77-.31-1.46-.77-2.04-1.35-.58-.58-1.04-1.27-1.35-2.04-.31-.77-.48-1.6-.48-2.47 0-.87.17-1.7.48-2.47.31-.77.77-1.46 1.35-2.04.58-.58 1.27-1.04 2.04-1.35.77-.31 1.6-.48 2.47-.48.87 0 1.7.17 2.47.48.77.31 1.46.77 2.04 1.35.19.19.36.39.52.6.26.34.48.71.66 1.1.18.39.32.81.42 1.24.1.43.15.88.15 1.34 0 .46-.05.91-.15 1.34-.1.43-.24.85-.42 1.24-.18.39-.4.76-.66 1.1-.16.21-.33.41-.52.6-.58.58-1.27 1.04-2.04 1.35-.77.31-1.6.48-2.47.48-.17 0-.34-.01-.51-.02-1.06-.05-2.07-.31-2.98-.76-.93-.46-1.73-1.11-2.36-1.93-.34-.44-.62-.92-.83-1.44-.11-.27-.2-.55-.27-.84-.04-.17-.07-.34-.09-.51-.03-.19-.04-.39-.04-.59 0-.29.02-.57.06-.85.04-.3.11-.59.21-.87.08-.23.18-.45.29-.66.23-.42.52-.8.86-1.13.82-.8 1.93-1.29 3.16-1.29 2.48 0 4.5 2.02 4.5 4.5h4.36z"/>
    </svg>
  )
}

export function InstallSection() {
  return (
    <section id="install" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection>
          <div className="overflow-hidden rounded-sm border border-border">
            <div className="bg-card p-8 md:p-12">
              <div className="flex flex-col items-start">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-sm border border-border bg-muted">
                  <Chrome className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold tracking-tighter text-foreground md:text-3xl">Stop Writing "Updated Files"</h2>
                <p className="mt-4 max-w-md text-muted-foreground">
                  Install in 30 seconds. Join developers who've reclaimed their time from paperwork.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Chrome className="h-5 w-5" aria-hidden="true" />
                      Get It for Chrome
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="gap-2 border-border bg-transparent text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Link href="https://microsoftedge.microsoft.com/addons" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <EdgeIcon className="h-5 w-5" />
                      Get It for Edge
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
