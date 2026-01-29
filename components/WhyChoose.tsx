
import React from 'react';
import { View } from '../App';

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-2xl transition-all duration-300 border border-transparent hover:border-zipton-orange/10 flex flex-col items-center text-center group">
    <div className="mb-6 p-4 bg-zipton-orange/10 rounded-2xl text-zipton-orange group-hover:bg-zipton-orange group-hover:text-white transition-colors duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-zipton-brown mb-3">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

interface WhyChooseProps {
  onNavigate?: (view: View) => void;
}

const WhyChoose: React.FC<WhyChooseProps> = ({ onNavigate }) => {
  return (
    <section id="why-us" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-zipton-brown mb-6">Why Zipton Tours?</h2>
          <p className="text-gray-600 text-lg">We prioritize meaningful engagement over massive crowds, ensuring your Kenyan journey is as unique as your own story.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Empathetic Design"
            desc="We listen to your heart's desires. Each itinerary is balanced between comfort and raw authenticity."
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
          />
          <FeatureCard 
            title="Grounded Expertise"
            desc="No intermediaries. You deal directly with Kenyan locals who know every secret trail and cultural nuance."
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <FeatureCard 
            title="Energetic Spirits"
            desc="We don't do boring. Expect high-energy encounters, spirited laughter, and vibrant celebrations of life."
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
        </div>
        
        {onNavigate && (
          <div className="text-center mt-12">
            <button 
              onClick={() => onNavigate('why-us')}
              className="text-zipton-orange font-bold hover:underline"
            >
              Discover More Reasons to Travel With Us
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default WhyChoose;
