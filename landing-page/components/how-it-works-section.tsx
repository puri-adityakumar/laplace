const steps = [
  {
    number: "01",
    title: "Install the Extension",
    description: "Add Laplace to Chrome or Edge from the browser extension store.",
  },
  {
    number: "02",
    title: "Add Your API Key",
    description: "Enter your OpenAI API key in the extension settings. It stays local.",
  },
  {
    number: "03",
    title: "Generate Descriptions",
    description: "Open any PR page and click the Laplace button to generate instantly.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tighter text-foreground md:text-4xl">How it works</h2>
          <p className="mt-4 text-muted-foreground">Get started in under a minute</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center bg-card p-8 text-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-muted text-sm font-medium text-primary">
                {step.number}
              </div>
              <h3 className="mb-2 font-medium text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
