
import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { View } from '../App';

interface NavbarProps {
  onNavigate: (view: View) => void;
  currentView: View;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50 || currentView !== 'home');
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const navLinks: { name: string; view: View }[] = [
    { name: 'About', view: 'about' },
    { name: 'Why Us', view: 'why-us' },
    { name: 'Experiences', view: 'experiences' },
    { name: 'Mission', view: 'mission' },
  ];

  const handleLinkClick = (view: View) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const isLight = !isScrolled && currentView === 'home';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <button onClick={() => handleLinkClick('home')}>
          <Logo variant={isLight ? 'light' : 'dark'} />
        </button>

        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleLinkClick(link.view)}
              className={`font-semibold text-sm uppercase tracking-wider hover:text-zipton-orange transition-colors ${isLight ? 'text-white' : 'text-zipton-black'} ${currentView === link.view ? 'text-zipton-orange' : ''}`}
            >
              {link.name}
            </button>
          ))}
          <button
            onClick={() => handleLinkClick('contact')}
            className="bg-zipton-orange text-white px-6 py-2 rounded-full font-bold hover:bg-opacity-90 transition-all transform hover:scale-105 text-sm"
          >
            Plan Your Journey
          </button>
        </div>

        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <svg className={`w-8 h-8 ${isLight ? 'text-white' : 'text-zipton-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white absolute top-full left-0 w-full shadow-2xl p-6 flex flex-col space-y-4 animate-fade-in-down border-t border-gray-100">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleLinkClick(link.view)}
              className="text-left text-zipton-black font-bold uppercase tracking-widest text-sm hover:text-zipton-orange"
            >
              {link.name}
            </button>
          ))}
          <button
            onClick={() => handleLinkClick('contact')}
            className="bg-zipton-orange text-white px-6 py-4 rounded-xl font-bold text-center text-sm uppercase tracking-widest"
          >
            Plan Your Journey
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
