import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Chrome, ArrowRight } from "lucide-react"

export function InstallSection() {
  return (
    <section id="install" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-sm border border-border">
          <div className="bg-card p-8 md:p-12">
            <div className="flex flex-col items-start">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-sm border border-border bg-muted">
                <Chrome className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tighter text-foreground md:text-3xl">Ready to ship faster?</h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Install Laplace and start generating PR descriptions in seconds. Free and open source.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer">
                    Chrome Web Store
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="gap-2 border-border bg-transparent text-foreground hover:bg-muted"
                >
                  <Link href="https://microsoftedge.microsoft.com/addons" target="_blank" rel="noopener noreferrer">
                    Edge Add-ons
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
