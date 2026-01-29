
import React, { useState } from 'react';
import Layout from './components/Layout';
import HomeView from './views/HomeView';
import AboutPage from './views/AboutPage';
import WhyUsPage from './views/WhyUsPage';
import MissionPage from './views/MissionPage';
import ContactPage from './views/ContactPage';
import ExperiencesPage from './views/ExperiencesPage';
import ExperienceDetail from './components/ExperienceDetail';
import { Experience } from './data/experienceData';

export type View = 'home' | 'about' | 'why-us' | 'mission' | 'contact' | 'experiences' | 'experience-detail';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);

  const navigateTo = (view: View, exp: Experience | null = null) => {
    setCurrentView(view);
    setSelectedExp(exp);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch (currentView) {
      case 'about':
        return <AboutPage onNavigate={navigateTo} />;
      case 'why-us':
        return <WhyUsPage onNavigate={navigateTo} />;
      case 'mission':
        return <MissionPage onNavigate={navigateTo} />;
      case 'contact':
        return <ContactPage />;
      case 'experiences':
        // Fixed: Added missing onNavigate prop as required by ExperiencesPageProps definition
        return <ExperiencesPage onSelectExperience={(exp) => navigateTo('experience-detail', exp)} onNavigate={navigateTo} />;
      case 'experience-detail':
        return selectedExp ? (
          <ExperienceDetail 
            experience={selectedExp} 
            onBack={() => navigateTo('home')} 
          />
        ) : <HomeView onNavigate={navigateTo} />;
      case 'home':
      default:
        return <HomeView onNavigate={navigateTo} />;
    }
  };

  return (
    <Layout onNavigate={navigateTo} currentView={currentView}>
      {renderView()}
    </Layout>
  );
};

export default App;