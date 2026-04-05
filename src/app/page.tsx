import HeroSection from "@/features/landing/HeroSection";
import DemoVideoSection from "@/features/landing/DemoVideoSection";
import ProblemSolutionSection from "@/features/landing/ProblemSolutionSection";
import FeaturesSection from "@/features/landing/FeaturesSection";
import HowItWorksSection from "@/features/landing/HowItWorksSection";
import SetupRequirementsSection from "@/features/landing/SetupRequirementsSection";
import BenefitsSection from "@/features/landing/BenefitsSection";
import FinalCTASection from "@/features/landing/FinalCTASection";
import LocalTrustSection from "@/features/landing/LocalTrustSection";
import Footer from "@/features/landing/Footer";
import Navigation from "@/features/landing/Navigation";
import ScrollToTop from "@/features/landing/ScrollToTop";
import WhatsAppFloat from "@/features/landing/WhatsAppFloat";
import MobileStickyWhatsApp from "@/features/landing/MobileStickyWhatsApp";
import { Inter, Poppins } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export default function LandingPage() {
  return (
    <main
      className={`landing-theme min-h-[100dvh] min-h-screen w-full min-w-0 overflow-x-hidden ${inter.variable} ${poppins.variable} font-sans antialiased`}
    >
      <Navigation />
      <HeroSection />
      <DemoVideoSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SetupRequirementsSection />
      <BenefitsSection />
      <FinalCTASection />
      <LocalTrustSection />
      <Footer />
      <ScrollToTop />
      <WhatsAppFloat />
      <MobileStickyWhatsApp />
    </main>
  );
}
