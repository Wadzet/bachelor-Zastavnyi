import HeroSection from "@/components/home/HeroSection"
import FeaturedInsights from "@/components/home/FeaturedInsights"
import FeaturedInterviews from "@/components/home/FeaturedInterviews"
import ConsultationBanner from "@/components/home/ConsultationBanner"
import { getFeaturedInsights, getFeaturedInterviews } from "@/lib/data/posts"

// Revalidate every 60 seconds (ISR) — keeps homepage fresh without a full rebuild.
export const revalidate = 60

export default async function HomePage() {
  const [featuredInsights, featuredInterviews] = await Promise.all([
    getFeaturedInsights(),
    getFeaturedInterviews(),
  ])

  return (
    <>
      <HeroSection />
      <FeaturedInsights insights={featuredInsights} />
      <FeaturedInterviews interviews={featuredInterviews} />
      <ConsultationBanner />
    </>
  )
}
