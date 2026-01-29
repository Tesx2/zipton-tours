
import React, { useState } from 'react';
import { generateItinerary } from '../services/geminiService';
import { View } from '../App';

interface AIItineraryProps {
  onNavigate?: (view: View) => void;
}

const AIItinerary: React.FC<AIItineraryProps> = ({ onNavigate }) => {
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!preferences) return;
    setLoading(true);
    try {
      const res = await generateItinerary(preferences);
      setResult(res);
    } catch (error) {
      setResult("Oops! The safari trail got a bit dusty. Please try again or contact us directly!");
    }
    setLoading(false);
  };

  return (
    <div className="bg-zipton-orange/5 p-8 md:p-12 rounded-[2rem] border-2 border-zipton-orange/20 shadow-xl max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-extrabold text-zipton-brown mb-2">Instant AI Itinerary</h3>
        <p className="text-gray-600">Tell us what makes your soul happy (e.g., "elephants and local food") and we'll sketch a dream journey.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input 
          type="text" 
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="e.g. Wildlife photography, Maasai culture, hiking..."
          className="flex-grow px-6 py-4 rounded-full border-2 border-gray-200 focus:border-zipton-orange outline-none text-zipton-brown transition-all"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="bg-zipton-brown text-white px-8 py-4 rounded-full font-bold hover:bg-zipton-black transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
          ) : (
            <>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               <span>Generate Draft</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="bg-white p-8 rounded-2xl shadow-inner border border-gray-100 max-h-[400px] overflow-y-auto animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-zipton-orange uppercase tracking-widest text-sm">Your AI-Generated Safari Concept</h4>
            <button 
              onClick={() => setResult(null)}
              className="text-gray-400 hover:text-zipton-brown"
            >
              Clear
            </button>
          </div>
          <div className="prose prose-zipton text-zipton-brown whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
             <p className="text-sm text-gray-400 italic">This is just a starting point. Let's make it real.</p>
             {onNavigate && (
               <button 
                 onClick={() => onNavigate('contact')}
                 className="text-zipton-orange font-bold hover:underline"
               >
                 Book This Trip →
               </button>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIItinerary;
