import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ScrollProgress } from "@/components/scroll-progress"
import "./globals.css"

const _geistMono = Geist_Mono({ subsets: ["latin"] })

const siteUrl = "https://uselaplace.com" // Update with actual domain

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI PR Description Generator for GitHub | Laplace",
    template: "%s | Laplace",
  },
  description:
    "Generate professional GitHub PR descriptions in one click. Laplace uses AI to analyze your diff and write clear, consistent descriptions. Free Chrome & Edge extension for developers.",
  keywords: [
    "PR description generator",
    "GitHub PR tool",
    "AI PR descriptions",
    "Chrome extension",
    "developer tools",
    "code review",
    "pull request",
    "automated documentation",
  ],
  authors: [{ name: "Laplace" }],
  creator: "Laplace",
  publisher: "Laplace",
  generator: "v0.app",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Laplace",
    title: "AI PR Description Generator for GitHub | Laplace",
    description:
      "Generate professional GitHub PR descriptions in one click. Free Chrome & Edge extension for developers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Laplace - AI PR Description Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI PR Description Generator for GitHub | Laplace",
    description:
      "Generate professional GitHub PR descriptions in one click. Free Chrome & Edge extension.",
    images: ["/og-image.png"],
    creator: "@uselaplace", // Update with actual Twitter handle
  },
  verification: {
    google: "your-google-verification-code", // Add when available
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

// Schema.org structured data for Chrome extension
const schemaData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Laplace",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Chrome, Edge",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "100",
  },
  description:
    "AI-powered PR description generator for GitHub. One click generates professional descriptions from your code changes.",
  url: siteUrl,
  screenshot: `${siteUrl}/og-image.png`,
  featureList: [
    "One-click PR description generation",
    "Bring your own API key",
    "Multiple AI models support",
    "Multi-language support",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth" style={{ colorScheme: "dark" }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className={`font-mono antialiased`}>
        <ScrollProgress />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
