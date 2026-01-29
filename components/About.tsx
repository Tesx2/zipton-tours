
import React from 'react';
import { View } from '../App';

interface AboutProps {
  onNavigate: (view: View) => void;
}

const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <section id="about" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 relative">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-zipton-orange/10 rounded-full z-0"></div>
            <img 
              src="https://picsum.photos/id/1011/800/1000" 
              alt="Maasai culture and landscape" 
              className="rounded-2xl shadow-2xl relative z-10 w-full object-cover h-[500px]"
            />
            <div className="absolute -bottom-10 -right-10 bg-zipton-brown p-8 rounded-2xl shadow-xl text-white hidden md:block z-20 max-w-xs">
              <p className="italic text-lg mb-4">"We don't just show you Kenya; we help you belong to it."</p>
              <p className="font-bold text-zipton-orange">- Zipton Founder</p>
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <span className="text-zipton-orange font-bold uppercase tracking-widest text-sm mb-4 block">Our Story</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-zipton-brown mb-6 leading-tight">
              Bridging Exploration with Deep Cultural Immersion
            </h2>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              Zipton Tours was born from a simple realization: travelers were seeing Africa, but they weren't <em>feeling</em> it. We set out to bridge the gap between heart-pounding exploration and deep cultural respect.
            </p>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Based in the heart of Nairobi, our team of passionate explorers and cultural ambassadors curate journeys that go beyond the typical "tour." Every moment is crafted to spark connection.
            </p>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-zipton-brown mb-2 text-xl">Local Wisdom</h4>
                <p className="text-sm text-gray-500">Every guide is a resident of the land, sharing stories passed down through generations.</p>
              </div>
              <div>
                <h4 className="font-bold text-zipton-brown mb-2 text-xl">Wild Adventure</h4>
                <p className="text-sm text-gray-500">From trekking the peaks of Mt. Kenya to navigating hidden river paths.</p>
              </div>
            </div>

            <button 
              onClick={() => onNavigate('about')}
              className="text-zipton-brown font-extrabold border-b-2 border-zipton-orange pb-1 hover:text-zipton-orange transition-colors"
            >
              Read Our Full Philosophy →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
