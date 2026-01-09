import { Github, FileText, Mail } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logoImage from 'figma:asset/e5d0273545aba19300d1b2e27ebb1158a8273f93.png';

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      footerRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 85%',
          once: true,
        },
      }
    );
  }, []);

  return (
    <footer ref={footerRef} className="bg-[#F7F9FC] dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="GeoCortex Logo" 
              className="h-8 object-contain"
            />
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            <a
              href="#"
              className="flex items-center gap-2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#6FAF8E] dark:hover:text-[#7CCBA2] transition-colors duration-300"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#6FAF8E] dark:hover:text-[#7CCBA2] transition-colors duration-300"
            >
              <FileText className="w-5 h-5" />
              <span>Documentation</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#6FAF8E] dark:hover:text-[#7CCBA2] transition-colors duration-300"
            >
              <Mail className="w-5 h-5" />
              <span>Contact</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-[#E5E7EB] dark:border-[#1F2937] text-center">
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] transition-colors duration-300">
            © 2026 GeoCortex Project. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}