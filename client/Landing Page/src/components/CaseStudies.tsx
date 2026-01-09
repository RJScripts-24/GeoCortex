import { ImageWithFallback } from './figma/ImageWithFallback';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function CaseStudies() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const cards = gridRef.current?.children;
    
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top center',
          once: true,
        },
      }
    );
  }, []);

  const cases = [
    {
      title: 'Silk Board Junction',
      tag: 'HOTSPOT',
      tagColor: 'bg-[#F4A261]/20 dark:bg-[#FBBF24]/20 text-[#F4A261] dark:text-[#FBBF24]',
      image: 'https://images.unsplash.com/photo-1717616408171-6cde78f9f68b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5nYWxvcmUlMjB0cmFmZmljJTIwaW50ZXJzZWN0aW9ufGVufDF8fHx8MTc2Nzg0NzExMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      description: 'High-traffic junction with severe thermal concentration during peak hours',
    },
    {
      title: 'Whitefield Tech Park',
      tag: 'ENERGY',
      tagColor: 'bg-[#F4A261]/20 dark:bg-[#FBBF24]/20 text-[#F4A261] dark:text-[#FBBF24]',
      image: 'https://images.unsplash.com/photo-1646153976497-14925728ff47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNoJTIwb2ZmaWNlJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzY3ODQ3MTExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      description: 'Commercial district with significant cooling energy demand and optimization potential',
    },
    {
      title: 'Indiranagar 12th Main',
      tag: 'ECOLOGY',
      tagColor: 'bg-[#4F8EF7]/20 dark:bg-[#60A5FA]/20 text-[#4F8EF7] dark:text-[#60A5FA]',
      image: 'https://images.unsplash.com/photo-1673984079540-b4debdd8a809?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0cmVldCUyMG5laWdoYm9yaG9vZHxlbnwxfHx8fDE3Njc4NDcxMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      description: 'Residential area showcasing successful green corridor implementation',
    },
  ];

  return (
    <section id="case-studies" className="bg-[#F7F9FC] dark:bg-[#111827] transition-colors duration-300 py-24">
      <div className="max-w-[90rem] mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4 text-[#1F2937] dark:text-[#E5E7EB] transition-colors duration-300">
            Impact Case Studies
          </h2>
        </div>

        <div ref={gridRef} className="grid md:grid-cols-3 gap-10">
          {cases.map((study, index) => (
            <div
              key={index}
              className="bg-white dark:bg-[#0F172A] rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#1F2937] hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <div className="relative h-80 overflow-hidden">
                <ImageWithFallback
                  src={study.image}
                  alt={study.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${study.tagColor} transition-colors duration-300`}>
                    {study.tag}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-semibold mb-3 text-[#1F2937] dark:text-[#E5E7EB] transition-colors duration-300">
                  {study.title}
                </h3>
                <p className="text-base text-[#6B7280] dark:text-[#9CA3AF] transition-colors duration-300">
                  {study.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}