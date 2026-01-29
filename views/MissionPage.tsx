
import React from 'react';
import { View } from '../App';
import Mission from '../components/Mission';

const MissionPage: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => (
  <div className="pt-24 animate-fade-in">
    <section className="bg-zipton-black py-20 text-white text-center">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Our Impact & Values</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">Tourism that builds, heals, and respects.</p>
      </div>
    </section>
    <Mission />
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h3 className="text-2xl font-bold text-zipton-brown mb-4">Conservation First</h3>
            <p className="text-gray-600">A portion of every booking goes directly to community-led conservation projects. We believe that protecting wildlife means empowering the people who live alongside it.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-zipton-brown mb-4">Cultural Integrity</h3>
            <p className="text-gray-600">We do not stage "performances." We facilitate genuine interaction. Our goal is to preserve the dignity and traditions of our hosts while fostering mutual understanding.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default MissionPage;
