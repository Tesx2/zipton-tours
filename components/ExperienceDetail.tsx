
import React, { useState } from 'react';
import { Experience } from '../data/experienceData';
import MpesaPayment from './MpesaPayment';

interface ExperienceDetailProps {
  experience: Experience;
  onBack: () => void;
}

const ExperienceDetail: React.FC<ExperienceDetailProps> = ({ experience, onBack }) => {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div className="relative h-[60vh] overflow-hidden">
        <img 
          src={experience.image} 
          className="w-full h-full object-cover"
          alt={experience.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zipton-brown via-transparent to-transparent"></div>
        <div className="absolute top-8 left-8">
          <button 
            onClick={onBack}
            className="bg-white/20 backdrop-blur-md text-white p-4 rounded-full hover:bg-white hover:text-zipton-brown transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
        </div>
        <div className="absolute bottom-12 left-12 right-12">
          <span className="bg-zipton-orange text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
            {experience.category}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">{experience.title}</h1>
          <div className="flex items-center space-x-6 text-white/80 font-semibold">
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-zipton-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{experience.duration}</span>
            </span>
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-zipton-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              <span>Kenyan Highlands</span>
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="lg:w-2/3">
            <h2 className="text-3xl font-extrabold text-zipton-brown mb-6">Overview</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-10">
              {experience.longDescription}
            </p>

            <h3 className="text-2xl font-extrabold text-zipton-brown mb-6">What to Expect</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {experience.highlights.map((h, i) => (
                <div key={i} className="flex items-center space-x-4 p-6 bg-gray-50 rounded-2xl">
                  <div className="w-8 h-8 bg-zipton-orange/10 rounded-full flex items-center justify-center text-zipton-orange">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="font-bold text-zipton-brown">{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-zipton-brown p-8 rounded-[2.5rem] text-white sticky top-24 shadow-2xl">
              <h4 className="text-xl font-bold mb-2">Book Your Slot</h4>
              <p className="text-gray-400 text-sm mb-6">Join a small group of max 8 people for an intimate experience.</p>
              
              <div className="mb-8 border-b border-white/10 pb-6">
                <span className="text-4xl font-extrabold text-zipton-orange">${experience.price}</span>
                <span className="text-gray-400 text-sm ml-2">per person</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Next Available</span>
                  <span className="font-bold">Oct 14, 2024</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Duration</span>
                  <span className="font-bold">{experience.duration}</span>
                </div>
              </div>

              <button 
                onClick={() => setShowPayment(true)}
                className="w-full bg-zipton-orange text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-zipton-orange/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>Reserve Now</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>

              <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span>M-Pesa, Airtel Money & Cards Accepted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <MpesaPayment 
          amount={experience.price} 
          experienceTitle={experience.title}
          onSuccess={() => {
            setShowPayment(false);
          }}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default ExperienceDetail;
