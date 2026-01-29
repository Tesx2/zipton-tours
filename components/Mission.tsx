
import React from 'react';
import { View } from '../App';

interface MissionProps {
  onNavigate?: (view: View) => void;
}

const Mission: React.FC<MissionProps> = ({ onNavigate }) => {
  return (
    <section id="mission" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto bg-zipton-brown rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-3xl text-center">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <svg width="200" height="200" viewBox="0 0 100 100" fill="white">
                <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                <path d="M50 10 L50 90 M10 50 L90 50" stroke="white" strokeWidth="1" />
             </svg>
          </div>

          <h4 className="text-zipton-orange font-bold uppercase tracking-[0.3em] text-sm mb-8">Our North Star</h4>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-10 leading-tight">
            "To bridge the gap between heart-pounding exploration and deep cultural immersion."
          </h2>
          <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto mb-12 italic">
            Transformative travel experiences that celebrate human connection and the spirit of discovery.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-white/10 pt-12 mb-10">
            <div>
              <h5 className="text-zipton-orange font-bold text-lg mb-2">Discovery</h5>
              <p className="text-white/70 text-sm">Seeking the unseen and respecting the ancient secrets of the wild.</p>
            </div>
            <div>
              <h5 className="text-zipton-orange font-bold text-lg mb-2">Connection</h5>
              <p className="text-white/70 text-sm">Building bridges between diverse cultures through shared laughter.</p>
            </div>
            <div>
              <h5 className="text-zipton-orange font-bold text-lg mb-2">Authenticity</h5>
              <p className="text-white/70 text-sm">No filters, no scripts. Just raw, honest, and beautiful Kenyan life.</p>
            </div>
          </div>
          
          {onNavigate && (
            <button 
              onClick={() => onNavigate('mission')}
              className="text-zipton-orange font-bold hover:underline"
            >
              Learn about our Impact
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Mission;
