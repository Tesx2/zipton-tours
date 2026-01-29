
import React from 'react';
import { View } from '../App';

const AboutPage: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => (
  <div className="pt-24 animate-fade-in">
    <section className="bg-zipton-brown py-20 text-white text-center">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Our Story & Soul</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">Discover the people and passions behind Zipton Tours.</p>
      </div>
    </section>
    
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <img src="https://images.unsplash.com/photo-1523805081446-99395624ea91?auto=format&fit=crop&q=80&w=800" className="rounded-3xl shadow-2xl" alt="About Zipton" />
          </div>
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-bold text-zipton-brown mb-6">Born in the Heart of Nairobi</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">Zipton Tours wasn't built in a boardroom. It was built on the dusty trails of the Rift Valley and the vibrant streets of Mombasa. Our founders, lifelong explorers, felt that traditional tourism was missing the 'human' element.</p>
            <p className="text-gray-600 mb-8 leading-relaxed">We believe that travel is an exchange of energy. When you visit Kenya with us, you aren't just a spectator; you are a participant in our culture, a guest in our home, and a partner in our conservation efforts.</p>
            <button onClick={() => onNavigate('experiences')} className="bg-zipton-orange text-white px-8 py-4 rounded-full font-bold">See Our Journeys</button>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default AboutPage;
