import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function TechStack() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const heading = sectionRef.current?.querySelector('h2');
    const logos = logosRef.current?.children;

    gsap.fromTo(
      heading,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: heading,
          start: 'top 75%',
          once: true,
        },
      }
    );

    gsap.fromTo(
      logos,
      { opacity: 0, y: 20 },
      {
        opacity: 0.7,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: logosRef.current,
          start: 'top 75%',
          once: true,
        },
      }
    );
  }, []);

  const logos = [
    { name: 'Google Maps', icon: '🗺️' },
    { name: 'Google Earth Engine', icon: '🌍' },
    { name: 'Gemini', icon: '✨' },
    { name: 'React.js', icon: '⚛️' },
    { name: 'Python Flask', icon: '🐍' },
  ];

  return (
    <section ref={sectionRef} id="stack" className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl mb-4 text-[#1F2937] dark:text-[#E5E7EB] transition-colors duration-300">
          Powered by Industry-Leading Tech
        </h2>
      </div>

      <div ref={logosRef} className="flex flex-wrap justify-center items-center gap-12">
        {logos.map((logo, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-3 opacity-70 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          >
            <div className="text-5xl transition-all duration-300">
              {logo.icon}
            </div>
            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF] transition-colors duration-300">
              {logo.name}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] italic transition-colors duration-300">
          A Final Year Project. Not affiliated with the Government of Karnataka.
        </p>
      </div>
    </section>
  );
}