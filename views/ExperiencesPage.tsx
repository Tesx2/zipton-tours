
import React from 'react';
import Experiences from '../components/Experiences';
import { Experience } from '../data/experienceData';
import { View } from '../App';

interface ExperiencesPageProps {
  onSelectExperience: (exp: Experience) => void;
  onNavigate: (view: View) => void;
}

const ExperiencesPage: React.FC<ExperiencesPageProps> = ({ onSelectExperience, onNavigate }) => (
  <div className="pt-24 animate-fade-in">
    <Experiences 
      onSelectExperience={onSelectExperience} 
      onNavigate={onNavigate}
    />
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-zipton-brown mb-6">Need Something Custom?</h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">We specialize in tailoring safaris and cultural escapes to your specific needs. From solo expeditions to corporate retreats.</p>
        <div className="flex justify-center space-x-4">
           <button 
             onClick={() => onNavigate('contact')}
             className="bg-zipton-orange text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-zipton-orange/20 transition-all"
           >
             Request Custom Quote
           </button>
        </div>
      </div>
    </section>
  </div>
);

export default ExperiencesPage;
