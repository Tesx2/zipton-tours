
import React from 'react';
import CTA from '../components/CTA';

const ContactPage: React.FC = () => (
  <div className="pt-24 animate-fade-in">
    <section className="bg-gray-100 py-16 text-center">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-extrabold text-zipton-brown mb-4">Let's Design Your Journey</h1>
        <p className="text-gray-500">Reach out for custom itineraries, group bookings, or just a chat about Kenya.</p>
      </div>
    </section>
    <CTA />
  </div>
);

export default ContactPage;
