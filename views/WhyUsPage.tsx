
import React from 'react';
import { View } from '../App';
import WhyChoose from '../components/WhyChoose';

const WhyUsPage: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => (
  <div className="pt-24 animate-fade-in">
    <section className="bg-zipton-orange py-20 text-white text-center">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6">The Zipton Difference</h1>
        <p className="text-xl max-w-2xl mx-auto opacity-90">Why thousands of global explorers trust us with their African dreams.</p>
      </div>
    </section>
    <WhyChoose />
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-zipton-brown mb-8">Unmatched Local Access</h2>
        <p className="max-w-3xl mx-auto text-gray-600 mb-12">Because our guides are from the very communities you visit, doors open for you that stay closed to others. From private meals with village elders to hidden waterfall treks known only to locals.</p>
        <button onClick={() => onNavigate('contact')} className="bg-zipton-brown text-white px-10 py-4 rounded-full font-bold">Start Your Custom Plan</button>
      </div>
    </section>
  </div>
);

export default WhyUsPage;
