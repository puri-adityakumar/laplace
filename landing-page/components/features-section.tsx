import { Sparkles, KeyRound, Cpu, Globe } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "One-Click Generation",
    description:
      "Click the Laplace button on any GitHub PR page to instantly generate a comprehensive description based on your diff.",
  },
  {
    icon: KeyRound,
    title: "Bring Your Own Key",
    description:
      "Use your own OpenAI API key. Your key is stored locally in your browser and never sent to external servers.",
  },
  {
    icon: Cpu,
    title: "Model Selection",
    description:
      "Choose from multiple GPT models (GPT-4o, GPT-4, GPT-3.5) to balance quality and cost based on your needs.",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description:
      "Generate PR descriptions in English, Japanese, Chinese, Spanish, French, German, Korean, or Portuguese.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tighter text-foreground md:text-4xl">Built for developers</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">Everything you need to streamline your PR workflow</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="flex gap-6 bg-card p-6 transition-colors hover:bg-muted">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-border bg-muted">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
