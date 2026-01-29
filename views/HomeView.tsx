
import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import WhyChoose from '../components/WhyChoose';
import Experiences from '../components/Experiences';
import Mission from '../components/Mission';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import { View } from '../App';
import { Experience } from '../data/experienceData';

interface HomeViewProps {
  onNavigate: (view: View, exp?: Experience) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => (
  <div className="animate-fade-in">
    <Hero onNavigate={onNavigate} />
    <About onNavigate={onNavigate} />
    <WhyChoose onNavigate={onNavigate} />
    <Experiences 
      onSelectExperience={(exp) => onNavigate('experience-detail', exp)} 
      onNavigate={onNavigate}
    />
    <Mission onNavigate={onNavigate} />
    <Testimonials />
    <CTA onNavigate={onNavigate} />
  </div>
);

export default HomeView;
