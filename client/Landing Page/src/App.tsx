import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { ProblemSolution } from './components/ProblemSolution';
import { KeyFeatures } from './components/KeyFeatures';
import { CaseStudies } from './components/CaseStudies';
import { TechStack } from './components/TechStack';
import { Footer } from './components/Footer';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-[#0F172A]" style={{ fontSize: '1.5rem' }}>
        <Navigation darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
        <Hero />
        <ProblemSolution />
        <KeyFeatures />
        <CaseStudies />
        <TechStack />
        <Footer />
      </div>
    </div>
  );
}
