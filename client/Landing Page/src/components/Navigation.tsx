import { Sun, Moon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import logoImage from 'figma:asset/e5d0273545aba19300d1b2e27ebb1158a8273f93.png';

interface NavigationProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function Navigation({ darkMode, toggleDarkMode }: NavigationProps) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Initial navbar animation
    gsap.fromTo(
      navRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    // Navbar scroll behavior
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      
      if (currentScroll > 50) {
        gsap.to(navRef.current, {
          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          duration: 0.3,
        });
      } else {
        gsap.to(navRef.current, {
          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          duration: 0.3,
        });
      }
      
      lastScroll = currentScroll;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [darkMode]);

  return (
    <nav ref={navRef} className="sticky top-0 z-50 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-300">
      <div className="w-full px-8 h-16 flex items-center justify-between">
        <img src={logoImage} alt="GeoCortex" className="h-10" />
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[#1F2937] dark:text-[#E5E7EB] hover:text-[#6FAF8E] dark:hover:text-[#7CCBA2] transition-colors">
            Features
          </a>
          <a href="#case-studies" className="text-[#1F2937] dark:text-[#E5E7EB] hover:text-[#6FAF8E] dark:hover:text-[#7CCBA2] transition-colors">
            Case Studies
          </a>
          <a href="#stack" className="text-[#1F2937] dark:text-[#E5E7EB] hover:text-[#6FAF8E] dark:hover:text-[#7CCBA2] transition-colors">
            Stack
          </a>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="relative w-14 h-7 rounded-full bg-[#E5E7EB] dark:bg-[#1F2937] transition-colors duration-300 flex items-center"
            aria-label="Toggle dark mode"
          >
            <div
              className={`absolute w-6 h-6 rounded-full bg-white dark:bg-[#4F8EF7] shadow-md transition-all duration-300 flex items-center justify-center ${
                darkMode ? 'translate-x-7' : 'translate-x-0.5'
              }`}
            >
              {darkMode ? (
                <Moon className="w-3.5 h-3.5 text-white" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-[#F4A261]" />
              )}
            </div>
          </button>

          {/* Console Login */}
          <button className="px-4 py-2 rounded-lg border-2 border-[#6FAF8E] dark:border-[#7CCBA2] text-[#6FAF8E] dark:text-[#7CCBA2] hover:bg-[#6FAF8E] hover:text-white dark:hover:bg-[#7CCBA2] dark:hover:text-[#0F172A] transition-all duration-300">
            Launch Maps
          </button>
        </div>
      </div>
    </nav>
  );
}