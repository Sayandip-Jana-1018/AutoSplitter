'use client';

import HeroSection from '@/components/landing/HeroSection';
import LogoMarquee from '@/components/landing/LogoMarquee';
import HowItWorks from '@/components/landing/HowItWorks';
import HighlightOCR from '@/components/landing/HighlightOCR';
import HighlightGraph from '@/components/landing/HighlightGraph';
import StatsCounter from '@/components/landing/StatsCounter';
import BentoFeatures from '@/components/landing/BentoFeatures';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import BottomCTA from '@/components/landing/BottomCTA';
import Footer from '@/components/landing/Footer';
import Navbar from '@/components/ui/Navbar';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landingPage}>
      {/* Ambient Animated Background Orbs */}
      <div className={styles.orbContainer}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <Navbar />

      <main className={styles.mainContent}>
        <HeroSection />
        <LogoMarquee />
        <HowItWorks />
        <HighlightOCR />
        <HighlightGraph />
        <StatsCounter />
        <BentoFeatures />
        <Testimonials />
        <FAQ />
        <BottomCTA />
      </main>

      <Footer />
    </div>
  );
}
