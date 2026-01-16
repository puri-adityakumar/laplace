import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { TechStackSection } from "@/components/tech-stack-section"
import { InstallSection } from "@/components/install-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background">
      <div className="bg-grid-subtle pointer-events-none fixed inset-0" />
      <div className="relative">
        <Navigation />
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TechStackSection />
        <InstallSection />
        <Footer />
      </div>
    </main>
  )
}
