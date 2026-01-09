import { CheckCircle2, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { InteractiveCard } from './InteractiveCard';

gsap.registerPlugin(ScrollTrigger);

export function KeyFeatures() {
  const feature1ImageRef = useRef<HTMLDivElement>(null);
  const feature1TextRef = useRef<HTMLDivElement>(null);
  const feature2ImageRef = useRef<HTMLDivElement>(null);
  const feature2TextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Feature 1 - Image from left
    gsap.fromTo(
      feature1ImageRef.current,
      { opacity: 0, scale: 0.96 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: feature1ImageRef.current,
          start: 'top 75%',
          once: true,
        },
      }
    );

    // Feature 1 - Text from right
    const bullets1 = feature1TextRef.current?.querySelectorAll('li');
    gsap.fromTo(
      feature1TextRef.current?.querySelector('h3'),
      { opacity: 0, x: 40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: feature1TextRef.current,
          start: 'top 75%',
          once: true,
        },
      }
    );
    
    gsap.fromTo(
      bullets1,
      { opacity: 0, x: 40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: feature1TextRef.current,
          start: 'top 75%',
          once: true,
        },
      }
    );

    // Feature 2 - Text from left
    const bullets2 = feature2TextRef.current?.querySelectorAll('li');
    gsap.fromTo(
      feature2TextRef.current?.querySelector('h3'),
      { opacity: 0, x: -40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: feature2TextRef.current,
          start: 'top 75%',
          once: true,
        },
      }
    );
    
    gsap.fromTo(
      bullets2,
      { opacity: 0, x: -40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: feature2TextRef.current,
          start: 'top 75%',
          once: true,
        },
      }
    );

    // Feature 2 - Image from right
    gsap.fromTo(
      feature2ImageRef.current,
      { opacity: 0, scale: 0.96 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: feature2ImageRef.current,
          start: 'top 75%',
          once: true,
        },
      }
    );
  }, []);

  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl mb-4 text-[#1F2937] dark:text-[#E5E7EB] transition-colors duration-300">
          Key Features
        </h2>
      </div>

      <div className="space-y-20">
        {/* Feature 1 - Z-Layout (Image Left) */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <InteractiveCard className="order-2 md:order-1">
            <div ref={feature1ImageRef}>
              <ImageWithFallback
                src="/src/assets/first.png"
                alt="3D City View"
                className="w-full h-80 object-cover rounded-xl shadow-lg border border-[#E5E7EB] dark:border-[#1F2937] hover:border-[#6FAF8E]/20 dark:hover:border-[#7CCBA2]/20 transition-all duration-300"
              />
            </div>
          </InteractiveCard>
          <div ref={feature1TextRef} className="order-1 md:order-2">
            <h3 className="text-3xl font-semibold mb-6 text-[#1F2937] dark:text-[#E5E7EB] transition-colors duration-300">
              Photorealistic Digital Twin
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#6FAF8E] dark:text-[#7CCBA2] flex-shrink-0 mt-0.5" />
                <span className="text-[#6B7280] dark:text-[#9CA3AF] transition-colors duration-300">
                  Real time heatmap updated from google earth engine with timeline from 2015 to 2025
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#6FAF8E] dark:text-[#7CCBA2] flex-shrink-0 mt-0.5" />
                <span className="text-[#6B7280] dark:text-[#9CA3AF] transition-colors duration-300">
                  Accurate LST analysis with AI powered Temperature analysis causes and solutions
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 2 - Z-Layout (Image Right) */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div ref={feature2TextRef}>
            <h3 className="text-3xl font-semibold mb-6 text-[#1F2937] dark:text-[#E5E7EB] transition-colors duration-300">
              AI-Powered Planning
            </h3>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#6FAF8E] dark:text-[#7CCBA2] flex-shrink-0 mt-0.5" />
                <span className="text-[#6B7280] dark:text-[#9CA3AF] transition-colors duration-300">
                  Chatbot to solve custom doubts of user and download report option
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#6FAF8E] dark:text-[#7CCBA2] flex-shrink-0 mt-0.5" />
                <span className="text-[#6B7280] dark:text-[#9CA3AF] transition-colors duration-300">
                  Planning mode complete analysis and plan implementation report generation as pdf
                </span>
              </li>
            </ul>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-[#6FAF8E] dark:text-[#7CCBA2] hover:gap-3 transition-all duration-300 font-medium"
            >
              View Sample Report
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <InteractiveCard>
            <div ref={feature2ImageRef}>
              <div className="aspect-video bg-gradient-to-br from-[#6FAF8E]/20 via-[#4F8EF7]/20 to-[#F4A261]/20 dark:from-[#7CCBA2]/20 dark:via-[#60A5FA]/20 dark:to-[#FBBF24]/20 rounded-lg border border-[#E5E7EB] dark:border-[#1F2937] hover:border-[#6FAF8E]/30 dark:hover:border-[#7CCBA2]/30 flex items-center justify-center transition-all duration-300 hover:shadow-lg">
                <ImageWithFallback
                  src="/src/assets/second.png"
                  alt="Interactive 3D visualization"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          </InteractiveCard>
        </div>
      </div>
    </section>
  );
}