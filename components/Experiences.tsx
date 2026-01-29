
import React from 'react';
import { experiences, Experience } from '../data/experienceData';
import { View } from '../App';

interface ExperiencesProps {
  onSelectExperience: (exp: Experience) => void;
  onNavigate?: (view: View) => void;
}

const Experiences: React.FC<ExperiencesProps> = ({ onSelectExperience, onNavigate }) => {
  return (
    <section id="experiences" className="py-24 bg-zipton-brown text-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div className="max-w-2xl">
            <span className="text-zipton-orange font-bold uppercase tracking-widest text-sm mb-4 block">Curated Journeys</span>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Signature Experiences</h2>
            <p className="text-gray-300 text-lg">Every Zipton experience is hand-crafted to ensure you witness the majesty of nature and the warmth of our people.</p>
          </div>
          {onNavigate && (
            <button 
              onClick={() => onNavigate('experiences')}
              className="mt-8 md:mt-0 bg-transparent border-2 border-zipton-orange text-zipton-orange px-8 py-3 rounded-full font-bold hover:bg-zipton-orange hover:text-white transition-all"
            >
              View All Experiences
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {experiences.map((exp) => (
            <div 
              key={exp.id} 
              className="group bg-white/5 rounded-3xl overflow-hidden border border-white/10 hover:border-zipton-orange/50 transition-all cursor-pointer"
              onClick={() => onSelectExperience(exp)}
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={exp.image} 
                  alt={exp.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-zipton-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                  {exp.category}
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold">{exp.title}</h3>
                  <span className="text-zipton-orange font-bold whitespace-nowrap">From ${exp.price}</span>
                </div>
                <p className="text-gray-400 mb-6 line-clamp-2">{exp.description}</p>
                <button 
                  className="flex items-center space-x-2 text-zipton-orange font-bold group-hover:translate-x-2 transition-transform"
                >
                  <span>Explore Details</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experiences;
