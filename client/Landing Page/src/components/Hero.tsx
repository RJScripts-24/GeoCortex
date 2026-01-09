import { Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import videoSrc from '../assets/Video.mp4';

export function Hero() {
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const secondaryButtonRef = useRef<HTMLButtonElement>(null);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [buttonMousePos, setButtonMousePos] = useState({ primary: { x: 0, y: 0 }, secondary: { x: 0, y: 0 } });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / rect.width,
          y: (e.clientY - rect.top - rect.height / 2) / rect.height,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handlePrimaryButtonMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!primaryButtonRef.current) return;
    const rect = primaryButtonRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setButtonMousePos(prev => ({ ...prev, primary: { x, y } }));
  };

  const handlePrimaryButtonLeave = () => {
    setButtonMousePos(prev => ({ ...prev, primary: { x: 0, y: 0 } }));
  };

  const handleSecondaryButtonMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!secondaryButtonRef.current) return;
    const rect = secondaryButtonRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setButtonMousePos(prev => ({ ...prev, secondary: { x, y } }));
  };

  const handleSecondaryButtonLeave = () => {
    setButtonMousePos(prev => ({ ...prev, secondary: { x: 0, y: 0 } }));
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.fromTo(
      badgeRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.1 }
    )
      .fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.4'
      )
      .fromTo(
        subheadingRef.current,
        { opacity: 0, y: 20, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6 },
        '-=0.4'
      )
      .fromTo(
        ctaRef.current?.children || [],
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1 },
        '-=0.4'
      )
      .fromTo(
        videoRef.current,
        { opacity: 0, scale: 0.97 },
        { opacity: 1, scale: 1, duration: 0.8 },
        '-=0.6'
      );
  }, []);

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative overflow-hidden">
      {/* Cursor-Reactive Background Circle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className="w-[600px] h-[600px] rounded-full bg-[#6FAF8E]/8 dark:bg-[#7CCBA2]/8 blur-[100px] transition-transform duration-500 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 25}px, ${mousePosition.y * 25}px)`,
          }}
        />
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large Green Circle - Top Left */}
        <div
          className="absolute w-[350px] h-[350px] rounded-full bg-[#6FAF8E]/7 dark:bg-[#7CCBA2]/7 animate-float-slow opacity-0 animate-fade-in-up"
          style={{
            top: '5%',
            left: '8%',
            transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 15}px)`,
            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0s',
          }}
        />

        {/* Medium Blue Circle - Top Right */}
        <div
          className="absolute w-[220px] h-[220px] rounded-full bg-[#4F8EF7]/6 dark:bg-[#60A5FA]/6 animate-float-medium opacity-0 animate-fade-in-up"
          style={{
            top: '15%',
            right: '10%',
            transform: `translate(${mousePosition.x * -18}px, ${mousePosition.y * 20}px)`,
            transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.2s',
          }}
        />

        {/* Large Blue Circle - Bottom Left */}
        <div
          className="absolute w-[300px] h-[300px] rounded-full bg-[#4F8EF7]/5 dark:bg-[#60A5FA]/5 animate-float-slow-reverse opacity-0 animate-fade-in-up"
          style={{
            bottom: '10%',
            left: '5%',
            transform: `translate(${mousePosition.x * 22}px, ${mousePosition.y * -18}px)`,
            transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.4s',
          }}
        />

        {/* Small Green Circle - Middle Right */}
        <div
          className="absolute w-[100px] h-[100px] rounded-full bg-[#6FAF8E]/8 dark:bg-[#7CCBA2]/8 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            top: '50%',
            right: '15%',
            transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * 12}px)`,
            transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.6s',
          }}
        />

        {/* 10 Small Cursor-Responsive Circles */}
        {/* Small Circle 1 - Top Center Left */}
        <div
          className="absolute w-[50px] h-[50px] rounded-full bg-[#6FAF8E]/6 dark:bg-[#7CCBA2]/6 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            top: '18%',
            left: '25%',
            transform: `translate(${mousePosition.x * 12}px, ${mousePosition.y * 10}px)`,
            transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.3s',
          }}
        />

        {/* Small Circle 2 - Top Center Right */}
        <div
          className="absolute w-[60px] h-[60px] rounded-full bg-[#4F8EF7]/5 dark:bg-[#60A5FA]/5 animate-float-medium opacity-0 animate-fade-in-up"
          style={{
            top: '12%',
            right: '28%',
            transform: `translate(${mousePosition.x * -10}px, ${mousePosition.y * 14}px)`,
            transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.5s',
          }}
        />

        {/* Small Circle 3 - Middle Left */}
        <div
          className="absolute w-[45px] h-[45px] rounded-full bg-[#4F8EF7]/7 dark:bg-[#60A5FA]/7 animate-float-slow opacity-0 animate-fade-in-up"
          style={{
            top: '40%',
            left: '12%',
            transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 8}px)`,
            transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.7s',
          }}
        />

        {/* Small Circle 4 - Middle Center */}
        <div
          className="absolute w-[55px] h-[55px] rounded-full bg-[#6FAF8E]/5 dark:bg-[#7CCBA2]/5 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            top: '45%',
            left: '48%',
            transform: `translate(${mousePosition.x * 8}px, ${mousePosition.y * 12}px)`,
            transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.4s',
          }}
        />

        {/* Small Circle 5 - Middle Right Upper */}
        <div
          className="absolute w-[48px] h-[48px] rounded-full bg-[#6FAF8E]/7 dark:bg-[#7CCBA2]/7 animate-float-medium opacity-0 animate-fade-in-up"
          style={{
            top: '35%',
            right: '22%',
            transform: `translate(${mousePosition.x * -12}px, ${mousePosition.y * 9}px)`,
            transition: 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.6s',
          }}
        />

        {/* Small Circle 6 - Bottom Center Left */}
        <div
          className="absolute w-[52px] h-[52px] rounded-full bg-[#4F8EF7]/6 dark:bg-[#60A5FA]/6 animate-float-slow-reverse opacity-0 animate-fade-in-up"
          style={{
            bottom: '25%',
            left: '30%',
            transform: `translate(${mousePosition.x * 11}px, ${mousePosition.y * -13}px)`,
            transition: 'transform 0.48s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.8s',
          }}
        />

        {/* Small Circle 7 - Bottom Center Right */}
        <div
          className="absolute w-[58px] h-[58px] rounded-full bg-[#6FAF8E]/6 dark:bg-[#7CCBA2]/6 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            bottom: '22%',
            right: '32%',
            transform: `translate(${mousePosition.x * -9}px, ${mousePosition.y * -11}px)`,
            transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.9s',
          }}
        />

        {/* Small Circle 8 - Bottom Right */}
        <div
          className="absolute w-[46px] h-[46px] rounded-full bg-[#4F8EF7]/8 dark:bg-[#60A5FA]/8 animate-float-medium opacity-0 animate-fade-in-up"
          style={{
            bottom: '18%',
            right: '12%',
            transform: `translate(${mousePosition.x * -14}px, ${mousePosition.y * -10}px)`,
            transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '1s',
          }}
        />

        {/* Small Circle 9 - Upper Left Corner */}
        <div
          className="absolute w-[44px] h-[44px] rounded-full bg-[#6FAF8E]/8 dark:bg-[#7CCBA2]/8 animate-float-slow opacity-0 animate-fade-in-up"
          style={{
            top: '8%',
            left: '18%',
            transform: `translate(${mousePosition.x * 13}px, ${mousePosition.y * 11}px)`,
            transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.35s',
          }}
        />

        {/* Small Circle 10 - Lower Middle */}
        <div
          className="absolute w-[50px] h-[50px] rounded-full bg-[#4F8EF7]/7 dark:bg-[#60A5FA]/7 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            bottom: '15%',
            left: '55%',
            transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * -12}px)`,
            transition: 'transform 0.43s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.75s',
          }}
        />

        {/* Additional Small Circles - Set 2 */}
        {/* Small Circle 11 - Top Far Left */}
        <div
          className="absolute w-[42px] h-[42px] rounded-full bg-[#F4A261]/6 dark:bg-[#FBBF24]/6 animate-float-medium opacity-0 animate-fade-in-up"
          style={{
            top: '22%',
            left: '6%',
            transform: `translate(${mousePosition.x * 16}px, ${mousePosition.y * 9}px)`,
            transition: 'transform 0.46s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.55s',
          }}
        />

        {/* Small Circle 12 - Top Far Right */}
        <div
          className="absolute w-[54px] h-[54px] rounded-full bg-[#6FAF8E]/5 dark:bg-[#7CCBA2]/5 animate-float-slow opacity-0 animate-fade-in-up"
          style={{
            top: '25%',
            right: '8%',
            transform: `translate(${mousePosition.x * -13}px, ${mousePosition.y * 11}px)`,
            transition: 'transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.65s',
          }}
        />

        {/* Small Circle 13 - Upper Center */}
        <div
          className="absolute w-[48px] h-[48px] rounded-full bg-[#4F8EF7]/6 dark:bg-[#60A5FA]/6 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            top: '10%',
            left: '45%',
            transform: `translate(${mousePosition.x * 9}px, ${mousePosition.y * 13}px)`,
            transition: 'transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.45s',
          }}
        />

        {/* Small Circle 14 - Middle Left Lower */}
        <div
          className="absolute w-[46px] h-[46px] rounded-full bg-[#6FAF8E]/7 dark:bg-[#7CCBA2]/7 animate-float-medium opacity-0 animate-fade-in-up"
          style={{
            top: '55%',
            left: '10%',
            transform: `translate(${mousePosition.x * 14}px, ${mousePosition.y * -10}px)`,
            transition: 'transform 0.49s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.85s',
          }}
        />

        {/* Small Circle 15 - Middle Right Lower */}
        <div
          className="absolute w-[52px] h-[52px] rounded-full bg-[#4F8EF7]/5 dark:bg-[#60A5FA]/5 animate-float-slow-reverse opacity-0 animate-fade-in-up"
          style={{
            top: '60%',
            right: '18%',
            transform: `translate(${mousePosition.x * -11}px, ${mousePosition.y * -14}px)`,
            transition: 'transform 0.44s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.7s',
          }}
        />

        {/* Small Circle 16 - Center Left */}
        <div
          className="absolute w-[40px] h-[40px] rounded-full bg-[#F4A261]/7 dark:bg-[#FBBF24]/7 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            top: '48%',
            left: '20%',
            transform: `translate(${mousePosition.x * 12}px, ${mousePosition.y * 10}px)`,
            transition: 'transform 0.39s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.5s',
          }}
        />

        {/* Small Circle 17 - Center Right */}
        <div
          className="absolute w-[56px] h-[56px] rounded-full bg-[#6FAF8E]/6 dark:bg-[#7CCBA2]/6 animate-float-medium opacity-0 animate-fade-in-up"
          style={{
            top: '52%',
            right: '25%',
            transform: `translate(${mousePosition.x * -10}px, ${mousePosition.y * 12}px)`,
            transition: 'transform 0.47s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.6s',
          }}
        />

        {/* Small Circle 18 - Bottom Far Left */}
        <div
          className="absolute w-[44px] h-[44px] rounded-full bg-[#4F8EF7]/8 dark:bg-[#60A5FA]/8 animate-float-slow opacity-0 animate-fade-in-up"
          style={{
            bottom: '12%',
            left: '8%',
            transform: `translate(${mousePosition.x * 13}px, ${mousePosition.y * -9}px)`,
            transition: 'transform 0.51s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.95s',
          }}
        />

        {/* Small Circle 19 - Bottom Far Right */}
        <div
          className="absolute w-[50px] h-[50px] rounded-full bg-[#6FAF8E]/7 dark:bg-[#7CCBA2]/7 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            bottom: '20%',
            right: '6%',
            transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -11}px)`,
            transition: 'transform 0.41s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '1.1s',
          }}
        />

        {/* Small Circle 20 - Upper Left */}
        <div
          className="absolute w-[38px] h-[38px] rounded-full bg-[#4F8EF7]/6 dark:bg-[#60A5FA]/6 animate-float-medium opacity-0 animate-fade-in-up"
          style={{
            top: '14%',
            left: '32%',
            transform: `translate(${mousePosition.x * 11}px, ${mousePosition.y * 8}px)`,
            transition: 'transform 0.37s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.42s',
          }}
        />

        {/* Small Circle 21 - Upper Right */}
        <div
          className="absolute w-[46px] h-[46px] rounded-full bg-[#F4A261]/5 dark:bg-[#FBBF24]/5 animate-float-slow-reverse opacity-0 animate-fade-in-up"
          style={{
            top: '20%',
            right: '35%',
            transform: `translate(${mousePosition.x * -12}px, ${mousePosition.y * 10}px)`,
            transition: 'transform 0.48s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.58s',
          }}
        />

        {/* Small Circle 22 - Lower Left Center */}
        <div
          className="absolute w-[50px] h-[50px] rounded-full bg-[#6FAF8E]/6 dark:bg-[#7CCBA2]/6 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            bottom: '28%',
            left: '22%',
            transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * -13}px)`,
            transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.72s',
          }}
        />

        {/* Small Circle 23 - Lower Right Center */}
        <div
          className="absolute w-[42px] h-[42px] rounded-full bg-[#4F8EF7]/7 dark:bg-[#60A5FA]/7 animate-float-medium opacity-0 animate-fade-in-up"
          style={{
            bottom: '30%',
            right: '20%',
            transform: `translate(${mousePosition.x * -9}px, ${mousePosition.y * -12}px)`,
            transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.88s',
          }}
        />

        {/* Small Circle 24 - Top Center-Left */}
        <div
          className="absolute w-[36px] h-[36px] rounded-full bg-[#6FAF8E]/8 dark:bg-[#7CCBA2]/8 animate-float-slow opacity-0 animate-fade-in-up"
          style={{
            top: '16%',
            left: '38%',
            transform: `translate(${mousePosition.x * 8}px, ${mousePosition.y * 11}px)`,
            transition: 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.38s',
          }}
        />

        {/* Small Circle 25 - Top Center-Right */}
        <div
          className="absolute w-[44px] h-[44px] rounded-full bg-[#F4A261]/6 dark:bg-[#FBBF24]/6 animate-float-fast opacity-0 animate-fade-in-up"
          style={{
            top: '18%',
            right: '38%',
            transform: `translate(${mousePosition.x * -11}px, ${mousePosition.y * 9}px)`,
            transition: 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: '0.52s',
          }}
        />
      </div>

      <div className="text-center relative z-10">
        {/* Badge */}
        <div ref={badgeRef} className="inline-flex items-center justify-center mb-6">
          <span className="px-4 py-2 rounded-full bg-[#6FAF8E]/10 dark:bg-[#7CCBA2]/10 text-[#6FAF8E] dark:text-[#7CCBA2] text-sm font-medium transition-colors duration-300">
            The Digital Twin for Thermal Analysis
          </span>
        </div>

        {/* Main Heading with Micro-Motion */}
        <h1
          ref={headingRef}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-[#1F2937] dark:text-[#E5E7EB] transition-all duration-200 tracking-tight leading-tight"
          style={{
            transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
          }}
        >
          Cool Down Your City
          <br />
          With Precision.
        </h1>

        {/* Subheading */}
        <p ref={subheadingRef} className="text-lg md:text-xl text-[#6B7280] dark:text-[#9CA3AF] mb-10 max-w-3xl mx-auto transition-colors duration-300">
          Simulate urban heat islands and green interventions using 3D Tiles and AI.
        </p>

        {/* CTAs with Cursor Interaction */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            ref={primaryButtonRef}
            onMouseMove={handlePrimaryButtonMove}
            onMouseLeave={handlePrimaryButtonLeave}
            onClick={() => window.location.href = 'http://localhost:5173'}
            className="px-8 py-3.5 rounded-lg bg-[#6FAF8E] dark:bg-[#7CCBA2] text-white dark:text-[#0F172A] transition-all duration-200 font-medium"
            style={{
              transform: `perspective(1000px) rotateX(${buttonMousePos.primary.y * -3}deg) rotateY(${buttonMousePos.primary.x * 3}deg)`,
              boxShadow: buttonMousePos.primary.x !== 0 || buttonMousePos.primary.y !== 0
                ? '0 10px 25px -5px rgba(111, 175, 142, 0.4), 0 8px 10px -6px rgba(111, 175, 142, 0.3)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            Launch Planning Mode
          </button>
          <button
            ref={secondaryButtonRef}
            onMouseMove={handleSecondaryButtonMove}
            onMouseLeave={handleSecondaryButtonLeave}
            className="px-8 py-3.5 rounded-lg border-2 text-[#1F2937] dark:text-[#E5E7EB] transition-all duration-200 font-medium"
            style={{
              transform: `perspective(1000px) rotateX(${buttonMousePos.secondary.y * -2}deg) rotateY(${buttonMousePos.secondary.x * 2}deg)`,
              borderColor: buttonMousePos.secondary.x !== 0 || buttonMousePos.secondary.y !== 0
                ? 'rgba(111, 175, 142, 0.5)'
                : 'rgb(229, 231, 235)',
            }}
          >
            Watch Demo Video
          </button>
        </div>

        {/* Hero Visual */}
        <div className="max-w-6xl mx-auto">
          <div ref={videoRef} className="relative rounded-xl overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1F2937] bg-[#F7F9FC] dark:bg-[#111827] transition-colors duration-300">
            {/* Video */}
            <video className="w-full aspect-video object-cover" autoPlay loop muted playsInline>
              <source src={videoSrc} type="video/mp4" />
            </video>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <p className="text-white text-sm font-medium">Interactive 3D Preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}