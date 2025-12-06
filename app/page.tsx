import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { WaitlistSection } from "@/components/waitlist-section"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <WaitlistSection />
    </main>
  )
}
