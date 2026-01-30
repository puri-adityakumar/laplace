import Link from "next/link"
import { Github } from "lucide-react"
import { LaplaceLogo } from "@/components/laplace-logo"

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <LaplaceLogo size={24} />
            <span className="text-sm text-muted-foreground">Laplace</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">View on GitHub</span>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">MIT License. Built by developers, for developers.</p>
        </div>
      </div>
    </footer>
  )
}
