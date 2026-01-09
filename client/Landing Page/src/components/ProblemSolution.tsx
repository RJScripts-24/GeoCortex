import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { InteractiveCard } from './InteractiveCard';

gsap.registerPlugin(ScrollTrigger);

export function ProblemSolution() {
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      leftCardRef.current,
      { opacity: 0, x: -40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: leftCardRef.current,
          start: 'top 75%',
          once: true,
        },
      }
    );

    gsap.fromTo(
      rightCardRef.current,
      { opacity: 0, x: 40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: rightCardRef.current,
          start: 'top 75%',
          once: true,
        },
      }
    );
  }, []);

  return (
    <section className="bg-[#F7F9FC] dark:bg-[#111827] transition-colors duration-300 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* The Crisis */}
          <InteractiveCard>
            <div ref={leftCardRef} className="bg-white dark:bg-[#0F172A] rounded-xl p-8 border border-[#E5E7EB] dark:border-[#1F2937] hover:border-[#F4A261]/30 dark:hover:border-[#FBBF24]/30 hover:shadow-lg transition-all duration-300">
              <span className="text-[#F4A261] dark:text-[#FBBF24] text-sm font-semibold uppercase tracking-wide block mb-4">
                The Crisis
              </span>
              <h2 className="text-3xl font-semibold mb-6 text-[#1F2937] dark:text-[#E5E7EB] transition-colors duration-300">
                Urban Heat Islands
              </h2>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed transition-colors duration-300">
                Rising temperatures, urban heat islands, and unpredictable climate patterns are making cities less livable every year.
              </p>
            </div>
          </InteractiveCard>

          {/* The Fix */}
          <InteractiveCard>
            <div ref={rightCardRef} className="bg-white dark:bg-[#0F172A] rounded-xl p-8 border border-[#E5E7EB] dark:border-[#1F2937] hover:border-[#6FAF8E]/30 dark:hover:border-[#7CCBA2]/30 hover:shadow-lg transition-all duration-300">
              <span className="text-[#6FAF8E] dark:text-[#7CCBA2] text-sm font-semibold uppercase tracking-wide block mb-4">
                The Fix
              </span>
              <h2 className="text-3xl font-semibold mb-6 text-[#1F2937] dark:text-[#E5E7EB] transition-colors duration-300">
                Predictive AI Twin
              </h2>
              <p className="mt-6 text-[#6B7280] dark:text-[#9CA3AF] transition-colors duration-300">
                Simulate green infrastructure interventions before implementation, optimizing placement and predicting thermal impact with AI.
              </p>
            </div>
          </InteractiveCard>
        </div>
      </div>
    </section>
  );
}