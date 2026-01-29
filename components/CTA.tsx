
import React from 'react';
import AIItinerary from './AIItinerary';
import { View } from '../App';

interface CTAProps {
  onNavigate?: (view: View) => void;
}

const CTA: React.FC<CTAProps> = ({ onNavigate }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you! Your inquiry has been sent to ziptontours@gmail.com. Our team will contact you shortly.');
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="mb-20">
          <AIItinerary onNavigate={onNavigate} />
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-6xl font-extrabold text-zipton-brown mb-8 leading-tight">
              Ready to <span className="text-zipton-orange italic">Belong</span> to the Wild?
            </h2>
            <p className="text-gray-600 text-xl mb-10 leading-relaxed">
              Don't just book a trip. Invest in a transformation. Contact us today to begin crafting your unique Kenyan story.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <a 
                  href="tel:+254710142850" 
                  className="w-12 h-12 bg-zipton-orange/10 rounded-full flex items-center justify-center text-zipton-orange hover:bg-zipton-orange hover:text-white transition-all shadow-sm"
                >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </a>
                <div>
                  <h5 className="font-bold text-zipton-brown">Call or WhatsApp</h5>
                  <p className="text-gray-500 font-medium">+254 710 142850</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a 
                  href="mailto:ziptontours@gmail.com" 
                  className="w-12 h-12 bg-zipton-orange/10 rounded-full flex items-center justify-center text-zipton-orange hover:bg-zipton-orange hover:text-white transition-all shadow-sm"
                >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </a>
                <div>
                  <h5 className="font-bold text-zipton-brown">Email Us</h5>
                  <p className="text-gray-500 font-medium">ziptontours@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 w-full">
            <form onSubmit={handleSubmit} className="bg-gray-50 p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-zipton-brown ml-2">Full Name</label>
                  <input required type="text" className="px-6 py-4 rounded-2xl border border-gray-200 focus:border-zipton-orange outline-none bg-white transition-all shadow-sm" placeholder="Jane Doe" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-zipton-brown ml-2">Email Address</label>
                  <input required type="email" className="px-6 py-4 rounded-2xl border border-gray-200 focus:border-zipton-orange outline-none bg-white transition-all shadow-sm" placeholder="jane@example.com" />
                </div>
              </div>
              <div className="flex flex-col space-y-2 mb-6">
                <label className="text-sm font-bold text-zipton-brown ml-2">Which experience excites you most?</label>
                <select className="px-6 py-4 rounded-2xl border border-gray-200 focus:border-zipton-orange outline-none bg-white appearance-none transition-all shadow-sm">
                  <option>Maasai Mara Cultural Safari</option>
                  <option>Mt. Kenya Soul Trek</option>
                  <option>Lamu Heritage Escape</option>
                  <option>Custom Adventure</option>
                </select>
              </div>
              <div className="flex flex-col space-y-2 mb-8">
                <label className="text-sm font-bold text-zipton-brown ml-2">Message</label>
                <textarea className="px-6 py-4 rounded-2xl border border-gray-200 focus:border-zipton-orange outline-none bg-white h-32 transition-all shadow-sm" placeholder="Tell us about your dream trip..."></textarea>
              </div>
              <button type="submit" className="w-full bg-zipton-orange text-white py-5 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-zipton-orange/20 active:scale-[0.98]">
                Begin Your Journey
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
