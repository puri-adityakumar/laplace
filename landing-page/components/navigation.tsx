import Link from "next/link"
import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LaplaceLogo } from "@/components/laplace-logo"

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <LaplaceLogo size={28} />
            <span className="text-sm font-medium text-foreground">Laplace</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="nav-link text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="nav-link text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link href="#install" className="nav-link text-sm text-muted-foreground transition-colors hover:text-foreground">
              Install
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">View on GitHub</span>
          </Link>
          <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
            <Link href="#install">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
