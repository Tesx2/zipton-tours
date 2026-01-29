
import React from 'react';
import { View } from '../App';

interface HeroProps {
  onNavigate: (view: View) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url('https://picsum.photos/id/1023/1920/1080')` }}
      />
      <div className="absolute inset-0 hero-gradient z-10" />

      <div className="container mx-auto px-6 relative z-20 text-center md:text-left">
        <div className="max-w-4xl">
          <span className="inline-block bg-zipton-orange text-white text-xs md:text-sm font-bold tracking-widest px-4 py-1 rounded-full mb-6 uppercase animate-bounce">
            Authentic Kenyan Experiences
          </span>
          <h1 className="text-4xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            Where <span className="text-zipton-orange italic">Adventure</span> <br /> 
            Meets Culture
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl font-light leading-relaxed">
            Go beyond the safari. Connect with the heartbeat of Africa through transformative journeys designed for the soul.
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 justify-center md:justify-start">
            <button 
              onClick={() => onNavigate('contact')}
              className="w-full sm:w-auto bg-zipton-orange text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl hover:shadow-zipton-orange/20 transform hover:-translate-y-1"
            >
              Plan Your Journey
            </button>
            <button 
              onClick={() => onNavigate('experiences')}
              className="w-full sm:w-auto border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-zipton-black transition-all flex items-center justify-center space-x-2"
            >
              <span>Explore Safaris</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 w-full z-20 hidden lg:block">
        <div className="container mx-auto px-6 flex items-center space-x-12 opacity-80">
          <div className="flex items-center space-x-2 text-white border-r border-white/20 pr-12">
            <span className="text-3xl font-bold">15+</span>
            <span className="text-xs uppercase leading-tight font-semibold">Years of<br/>Experience</span>
          </div>
          <div className="flex items-center space-x-2 text-white border-r border-white/20 pr-12">
            <span className="text-3xl font-bold">100%</span>
            <span className="text-xs uppercase leading-tight font-semibold">Local Kenyan<br/>Guides</span>
          </div>
          <div className="flex items-center space-x-2 text-white">
            <span className="text-3xl font-bold">50+</span>
            <span className="text-xs uppercase leading-tight font-semibold">Cultural<br/>Partnerships</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
