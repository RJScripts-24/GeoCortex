import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Landing Page Component - Integrates all landing sections
export default function LandingPage() {
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();

    // Apply dark mode to document element for Tailwind
    useEffect(() => {
        // On initial mount and when darkMode is false, explicitly remove dark class
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // Cleanup when component unmounts
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, [darkMode]);

    // Ensure dark class is removed on initial mount (in case it was persisted)
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    // Clear forward history when landing page loads (prevents forward button navigation)
    // This runs when user navigates back to landing page, clearing any forward history
    useEffect(() => {
        window.history.replaceState(null, '', window.location.href);
    }, []);

    // Cleanup all GSAP ScrollTrigger instances when component unmounts
    // This prevents the blank screen issue when navigating back
    useEffect(() => {
        return () => {
            // Kill all ScrollTrigger instances to prevent memory leaks and rendering issues
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            // Clear any cached scroll positions
            ScrollTrigger.clearScrollMemory();
            // Refresh to clean up
            ScrollTrigger.refresh();
        };
    }, []);

    const handleLaunchMaps = () => {
        // Kill all ScrollTriggers before navigating
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        navigate('/map');
    };

    return (
        <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-slate-900">
            {/* Navigation */}
            <Navigation darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} onLaunchMaps={handleLaunchMaps} />

            {/* Hero Section */}
            <Hero onLaunchMaps={handleLaunchMaps} />

            {/* Problem / Solution Section */}
            <ProblemSolution />

            {/* Key Features */}
            <KeyFeatures />

            {/* Case Studies */}
            <CaseStudies />

            {/* Tech Stack */}
            <TechStack />

            {/* Footer */}
            <Footer />
        </div>
    );
}


// Navigation Component
function Navigation({ darkMode, toggleDarkMode, onLaunchMaps }) {
    const navRef = useRef(null);

    useEffect(() => {
        // Entrance animation
        gsap.fromTo(
            navRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        );
    }, []);

    return (
        <nav ref={navRef} className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
            <div className="w-full px-8 h-16 flex items-center justify-between">
                <img src="/GeoCortex-logo.png" alt="GeoCortex" className="h-10" />

                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                        Features
                    </a>
                    <a href="#case-studies" className="text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                        Case Studies
                    </a>
                    <a href="#stack" className="text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                        Stack
                    </a>
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-slate-700 transition-colors duration-300 flex items-center"
                        aria-label="Toggle dark mode"
                    >
                        <div
                            className={`absolute w-6 h-6 rounded-full bg-white dark:bg-blue-500 shadow-md transition-all duration-300 flex items-center justify-center ${darkMode ? 'translate-x-7' : 'translate-x-0.5'
                                }`}
                        >
                            {darkMode ? '🌙' : '☀️'}
                        </div>
                    </button>

                    {/* Launch Maps Button */}
                    <button
                        onClick={onLaunchMaps}
                        className="px-5 py-2.5 rounded-lg border-2 border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white dark:hover:bg-green-400 dark:hover:text-slate-900 transition-all duration-300 font-semibold"
                    >
                        Launch Maps
                    </button>
                </div>
            </div>
        </nav>
    );
}

// Hero Section with Cursor Movement Animations
function Hero({ onLaunchMaps }) {
    const badgeRef = useRef(null);
    const headingRef = useRef(null);
    const subheadingRef = useRef(null);
    const ctaRef = useRef(null);
    const videoRef = useRef(null);
    const sectionRef = useRef(null);
    const primaryButtonRef = useRef(null);
    const secondaryButtonRef = useRef(null);

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [buttonMousePos, setButtonMousePos] = useState({ primary: { x: 0, y: 0 }, secondary: { x: 0, y: 0 } });

    // Cursor movement tracking for parallax effect
    useEffect(() => {
        const handleMouseMove = (e) => {
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

    const handlePrimaryButtonMove = (e) => {
        if (!primaryButtonRef.current) return;
        const rect = primaryButtonRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setButtonMousePos(prev => ({ ...prev, primary: { x, y } }));
    };

    const handlePrimaryButtonLeave = () => {
        setButtonMousePos(prev => ({ ...prev, primary: { x: 0, y: 0 } }));
    };

    const handleSecondaryButtonMove = (e) => {
        if (!secondaryButtonRef.current) return;
        const rect = secondaryButtonRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setButtonMousePos(prev => ({ ...prev, secondary: { x, y } }));
    };

    const handleSecondaryButtonLeave = () => {
        setButtonMousePos(prev => ({ ...prev, secondary: { x: 0, y: 0 } }));
    };

    // GSAP entrance animations
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            // If reduced motion, just show everything immediately
            gsap.set([badgeRef.current, headingRef.current, subheadingRef.current, videoRef.current], { opacity: 1 });
            if (ctaRef.current?.children) {
                gsap.set(ctaRef.current.children, { opacity: 1 });
            }
            return;
        }

        // Set initial states
        gsap.set([badgeRef.current, headingRef.current, subheadingRef.current, videoRef.current], { opacity: 0 });
        if (ctaRef.current?.children) {
            gsap.set(ctaRef.current.children, { opacity: 0 });
        }

        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        tl.to(badgeRef.current, { opacity: 1, y: 0, duration: 0.6, delay: 0.1 })
            .fromTo(
                headingRef.current,
                { y: 20 },
                { opacity: 1, y: 0, duration: 0.6 },
                '-=0.4'
            )
            .fromTo(
                subheadingRef.current,
                { y: 20, filter: 'blur(4px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6 },
                '-=0.4'
            )
            .to(
                ctaRef.current?.children || [],
                { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1 },
                '-=0.4'
            )
            .to(
                videoRef.current,
                { opacity: 1, scale: 1, duration: 0.8 },
                '-=0.6'
            );

        // Cleanup: kill the timeline when component unmounts
        return () => {
            tl.kill();
        };
    }, []);

    return (
        <section ref={sectionRef} className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative overflow-hidden">
            {/* Cursor-Reactive Background Circle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                    className="w-[600px] h-[600px] rounded-full bg-green-500/10 dark:bg-green-400/10 blur-[100px] transition-transform duration-500 ease-out"
                    style={{
                        transform: `translate(${mousePosition.x * 25}px, ${mousePosition.y * 25}px)`,
                    }}
                />
            </div>

            {/* Floating Decorative Elements - Cursor Reactive */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Large Green Circle - Top Left */}
                <div
                    className="absolute w-[350px] h-[350px] rounded-full bg-green-500/10 dark:bg-green-400/10 animate-float-slow animate-fade-in-up"
                    style={{
                        top: '5%',
                        left: '8%',
                        transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 15}px)`,
                        transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                />

                {/* Medium Blue Circle - Top Right */}
                <div
                    className="absolute w-[220px] h-[220px] rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-float-medium animate-fade-in-up"
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
                    className="absolute w-[300px] h-[300px] rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-float-slow-reverse animate-fade-in-up"
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
                    className="absolute w-[100px] h-[100px] rounded-full bg-green-500/10 dark:bg-green-400/10 animate-float-fast animate-fade-in-up"
                    style={{
                        top: '50%',
                        right: '15%',
                        transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * 12}px)`,
                        transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.6s',
                    }}
                />

                {/* Additional Small Cursor-Responsive Circles */}
                <div
                    className="absolute w-[50px] h-[50px] rounded-full bg-green-500/10 dark:bg-green-400/10 animate-float-fast animate-fade-in-up"
                    style={{
                        top: '18%',
                        left: '25%',
                        transform: `translate(${mousePosition.x * 12}px, ${mousePosition.y * 10}px)`,
                        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.3s',
                    }}
                />

                <div
                    className="absolute w-[60px] h-[60px] rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-float-medium animate-fade-in-up"
                    style={{
                        top: '12%',
                        right: '28%',
                        transform: `translate(${mousePosition.x * -10}px, ${mousePosition.y * 14}px)`,
                        transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.5s',
                    }}
                />

                <div
                    className="absolute w-[45px] h-[45px] rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-float-slow animate-fade-in-up"
                    style={{
                        top: '40%',
                        left: '12%',
                        transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 8}px)`,
                        transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.7s',
                    }}
                />

                <div
                    className="absolute w-[55px] h-[55px] rounded-full bg-green-500/10 dark:bg-green-400/10 animate-float-fast animate-fade-in-up"
                    style={{
                        top: '45%',
                        left: '48%',
                        transform: `translate(${mousePosition.x * 8}px, ${mousePosition.y * 12}px)`,
                        transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.4s',
                    }}
                />

                <div
                    className="absolute w-[48px] h-[48px] rounded-full bg-green-500/10 dark:bg-green-400/10 animate-float-medium animate-fade-in-up"
                    style={{
                        top: '35%',
                        right: '22%',
                        transform: `translate(${mousePosition.x * -12}px, ${mousePosition.y * 9}px)`,
                        transition: 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.6s',
                    }}
                />

                <div
                    className="absolute w-[52px] h-[52px] rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-float-slow-reverse animate-fade-in-up"
                    style={{
                        bottom: '25%',
                        left: '30%',
                        transform: `translate(${mousePosition.x * 11}px, ${mousePosition.y * -13}px)`,
                        transition: 'transform 0.48s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.8s',
                    }}
                />

                <div
                    className="absolute w-[58px] h-[58px] rounded-full bg-green-500/10 dark:bg-green-400/10 animate-float-fast animate-fade-in-up"
                    style={{
                        bottom: '22%',
                        right: '32%',
                        transform: `translate(${mousePosition.x * -9}px, ${mousePosition.y * -11}px)`,
                        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.9s',
                    }}
                />

                <div
                    className="absolute w-[46px] h-[46px] rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-float-medium animate-fade-in-up"
                    style={{
                        bottom: '18%',
                        right: '12%',
                        transform: `translate(${mousePosition.x * -14}px, ${mousePosition.y * -10}px)`,
                        transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '1s',
                    }}
                />

                <div
                    className="absolute w-[44px] h-[44px] rounded-full bg-amber-500/10 dark:bg-amber-400/10 animate-float-slow animate-fade-in-up"
                    style={{
                        top: '8%',
                        left: '18%',
                        transform: `translate(${mousePosition.x * 13}px, ${mousePosition.y * 11}px)`,
                        transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.35s',
                    }}
                />

                <div
                    className="absolute w-[50px] h-[50px] rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-float-fast animate-fade-in-up"
                    style={{
                        bottom: '15%',
                        left: '55%',
                        transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * -12}px)`,
                        transition: 'transform 0.43s cubic-bezier(0.22, 1, 0.36, 1)',
                        animationDelay: '0.75s',
                    }}
                />
            </div>

            <div className="text-center relative z-10">
                {/* Badge */}
                <div ref={badgeRef} className="inline-flex items-center justify-center mb-6">
                    <span className="px-4 py-2 rounded-full bg-green-500/10 dark:bg-green-400/10 text-green-600 dark:text-green-400 text-sm font-medium">
                        The Digital Twin for Thermal Analysis
                    </span>
                </div>

                {/* Main Heading with Micro-Motion */}
                <h1
                    ref={headingRef}
                    className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-gray-100 tracking-tight leading-tight"
                    style={{
                        transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
                    }}
                >
                    Cool Down Your City
                    <br />
                    With Precision.
                </h1>

                {/* Subheading */}
                <p ref={subheadingRef} className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
                    Simulate urban heat islands and green interventions using 3D Tiles and AI.
                </p>

                {/* CTAs with 3D Cursor Interaction */}
                <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <button
                        ref={primaryButtonRef}
                        onClick={onLaunchMaps}
                        onMouseMove={handlePrimaryButtonMove}
                        onMouseLeave={handlePrimaryButtonLeave}
                        className="px-8 py-3.5 rounded-lg bg-green-600 dark:bg-green-500 text-white font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200"
                        style={{
                            transform: `perspective(1000px) rotateX(${buttonMousePos.primary.y * -3}deg) rotateY(${buttonMousePos.primary.x * 3}deg)`,
                            boxShadow: buttonMousePos.primary.x !== 0 || buttonMousePos.primary.y !== 0
                                ? '0 10px 25px -5px rgba(22, 163, 74, 0.4), 0 8px 10px -6px rgba(22, 163, 74, 0.3)'
                                : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        }}
                    >
                        Launch Planning Mode
                    </button>
                    <button
                        ref={secondaryButtonRef}
                        onMouseMove={handleSecondaryButtonMove}
                        onMouseLeave={handleSecondaryButtonLeave}
                        className="px-8 py-3.5 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 font-medium hover:border-green-500 dark:hover:border-green-400 transition-all duration-200"
                        style={{
                            transform: `perspective(1000px) rotateX(${buttonMousePos.secondary.y * -2}deg) rotateY(${buttonMousePos.secondary.x * 2}deg)`,
                            borderColor: buttonMousePos.secondary.x !== 0 || buttonMousePos.secondary.y !== 0
                                ? 'rgba(22, 163, 74, 0.5)'
                                : undefined,
                        }}
                    >
                        Watch Demo Video
                    </button>
                </div>

                {/* Hero Visual */}
                <div className="max-w-6xl mx-auto">
                    <div ref={videoRef} className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800">
                        <video className="w-full aspect-video object-cover" autoPlay loop muted playsInline>
                            <source src="/Video.mp4" type="video/mp4" />
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

// Problem & Solution Section with Scroll Trigger
function ProblemSolution() {
    const sectionRef = useRef(null);
    const crisisRef = useRef(null);
    const fixRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        gsap.fromTo(
            crisisRef.current,
            { opacity: 0, x: -50, scale: 0.95 },
            {
                opacity: 1, x: 0, scale: 1, duration: 0.8, ease: 'power2.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            }
        );

        gsap.fromTo(
            fixRef.current,
            { opacity: 0, x: 50, scale: 0.95 },
            {
                opacity: 1, x: 0, scale: 1, duration: 0.8, ease: 'power2.out', delay: 0.2,
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            }
        );
    }, []);

    return (
        <section ref={sectionRef} className="bg-gray-50 dark:bg-slate-800 transition-colors duration-300 py-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* The Crisis */}
                    <div ref={crisisRef} className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-gray-200 dark:border-slate-700 hover:border-orange-400/30 hover:shadow-lg transition-all duration-300">
                        <span className="text-orange-500 dark:text-amber-400 text-sm font-semibold uppercase tracking-wide block mb-4">
                            The Crisis
                        </span>
                        <h2 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                            Urban Heat Islands
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            Rising temperatures, urban heat islands, and unpredictable climate patterns are making cities less livable every year.
                        </p>
                    </div>

                    {/* The Fix */}
                    <div ref={fixRef} className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-gray-200 dark:border-slate-700 hover:border-green-500/30 hover:shadow-lg transition-all duration-300">
                        <span className="text-green-600 dark:text-green-400 text-sm font-semibold uppercase tracking-wide block mb-4">
                            The Fix
                        </span>
                        <h2 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                            Predictive AI Twin
                        </h2>
                        <p className="mt-6 text-gray-600 dark:text-gray-400">
                            Simulate green infrastructure interventions before implementation, optimizing placement and predicting thermal impact with AI.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Key Features Section with Scroll Trigger
function KeyFeatures() {
    const sectionRef = useRef(null);
    const titleRef = useRef(null);
    const feature1Ref = useRef(null);
    const feature2Ref = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        gsap.fromTo(
            titleRef.current,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            }
        );

        gsap.fromTo(
            feature1Ref.current,
            { opacity: 0, y: 50 },
            {
                opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.2,
                scrollTrigger: {
                    trigger: feature1Ref.current,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
            }
        );

        gsap.fromTo(
            feature2Ref.current,
            { opacity: 0, y: 50 },
            {
                opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.2,
                scrollTrigger: {
                    trigger: feature2Ref.current,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
            }
        );
    }, []);

    return (
        <section ref={sectionRef} id="features" className="max-w-7xl mx-auto px-6 py-24">
            <div ref={titleRef} className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl mb-4 text-gray-900 dark:text-gray-100">
                    Key Features
                </h2>
            </div>

            <div className="space-y-20">
                {/* Feature 1 */}
                <div ref={feature1Ref} className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <img
                            src="/first.png"
                            alt="3D City View"
                            className="w-full h-80 object-cover rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 hover:border-green-500/20 transition-all duration-300"
                        />
                    </div>
                    <div className="order-1 md:order-2">
                        <h3 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                            Photorealistic Digital Twin
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    Real time heatmap updated from google earth engine with timeline from 2015 to 2025
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    Accurate LST analysis with AI powered Temperature analysis causes and solutions
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Feature 2 */}
                <div ref={feature2Ref} className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                            AI-Powered Planning
                        </h3>
                        <ul className="space-y-4 mb-6">
                            <li className="flex items-start gap-3">
                                <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    Chatbot to solve custom doubts of user and download report option
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    Planning mode complete analysis and plan implementation report generation as pdf
                                </span>
                            </li>
                        </ul>
                        <a href="#" className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:gap-3 transition-all duration-300 font-medium">
                            View Sample Report →
                        </a>
                    </div>
                    <div>
                        <img
                            src="/second.png"
                            alt="AI Planning Interface"
                            className="w-full h-80 object-cover rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 hover:border-green-500/20 transition-all duration-300"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

// Case Studies Section with Scroll Trigger
function CaseStudies() {
    const sectionRef = useRef(null);
    const titleRef = useRef(null);
    const cardsRef = useRef(null);

    const cases = [
        {
            title: 'Silk Board Junction',
            tag: 'HOTSPOT',
            tagColor: 'bg-orange-500/20 text-orange-600 dark:text-amber-400',
            image: 'https://images.unsplash.com/photo-1717616408171-6cde78f9f68b?w=600',
            description: 'High-traffic junction with severe thermal concentration during peak hours',
        },
        {
            title: 'Whitefield Tech Park',
            tag: 'ENERGY',
            tagColor: 'bg-orange-500/20 text-orange-600 dark:text-amber-400',
            image: 'https://images.unsplash.com/photo-1646153976497-14925728ff47?w=600',
            description: 'Commercial district with significant cooling energy demand and optimization potential',
        },
        {
            title: 'Indiranagar 12th Main',
            tag: 'ECOLOGY',
            tagColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
            image: 'https://images.unsplash.com/photo-1673984079540-b4debdd8a809?w=600',
            description: 'Residential area showcasing successful green corridor implementation',
        },
    ];

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        gsap.fromTo(
            titleRef.current,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            }
        );

        gsap.fromTo(
            cardsRef.current?.children || [],
            { opacity: 0, y: 50, scale: 0.95 },
            {
                opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power2.out', stagger: 0.15,
                scrollTrigger: {
                    trigger: cardsRef.current,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
            }
        );
    }, []);

    return (
        <section ref={sectionRef} id="case-studies" className="bg-gray-50 dark:bg-slate-800 transition-colors duration-300 py-24">
            <div className="max-w-7xl mx-auto px-8">
                <div ref={titleRef} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl mb-4 text-gray-900 dark:text-gray-100">
                        Impact Case Studies
                    </h2>
                </div>

                <div ref={cardsRef} className="grid md:grid-cols-3 gap-10">
                    {cases.map((study, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        >
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src={study.image}
                                    alt={study.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4">
                                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${study.tagColor}`}>
                                        {study.tag}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                    {study.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
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

// Tech Stack Section with Scroll Trigger
function TechStack() {
    const sectionRef = useRef(null);
    const titleRef = useRef(null);
    const logosRef = useRef(null);

    const logos = [
        { name: 'Google Maps', icon: '🗺️' },
        { name: 'Google Earth Engine', icon: '🌍' },
        { name: 'Gemini', icon: '✨' },
        { name: 'React.js', icon: '⚛️' },
        { name: 'Python Flask', icon: '🐍' },
    ];

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        gsap.fromTo(
            titleRef.current,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            }
        );

        gsap.fromTo(
            logosRef.current?.children || [],
            { opacity: 0, y: 30, scale: 0.9 },
            {
                opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1,
                scrollTrigger: {
                    trigger: logosRef.current,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
            }
        );
    }, []);

    return (
        <section ref={sectionRef} id="stack" className="max-w-7xl mx-auto px-6 py-24">
            <div ref={titleRef} className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl mb-4 text-gray-900 dark:text-gray-100">
                    Powered by Industry-Leading Tech
                </h2>
            </div>

            <div ref={logosRef} className="flex flex-wrap justify-center items-center gap-12">
                {logos.map((logo, index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center gap-3 opacity-70 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    >
                        <div className="text-5xl">{logo.icon}</div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {logo.name}
                        </span>
                    </div>
                ))}
            </div>

            
        </section>
    );
}

// Footer Component with Scroll Trigger
function Footer() {
    const footerRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        gsap.fromTo(
            footerRef.current,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
                scrollTrigger: {
                    trigger: footerRef.current,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse',
                },
            }
        );
    }, []);

    return (
        <footer ref={footerRef} className="bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/GeoCortex-logo.png"
                            alt="GeoCortex Logo"
                            className="h-8 object-contain"
                        />
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-8">
                        <a href="https://github.com/RJScripts-24/GeoCortex" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300">
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z"/></svg>
                            </span>
                            <span>GitHub</span>
                        </a>
                        <a href="#" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300">
                            <span>📄</span>
                            <span>Documentation</span>
                        </a>
                        <a href="https://www.linkedin.com/in/rishabh-kumar-jha-8b5761325/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300">
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595z"/></svg>
                            </span>
                            <span>LinkedIn</span>
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        © 2026 GeoCortex Project. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
