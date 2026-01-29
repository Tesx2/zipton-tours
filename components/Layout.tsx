
import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { View } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: View) => void;
  currentView: View;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentView }) => {
  const isDetailView = currentView === 'experience-detail';

  return (
    <div className="min-h-screen bg-white font-montserrat antialiased overflow-x-hidden flex flex-col">
      {!isDetailView && <Navbar onNavigate={onNavigate} currentView={currentView} />}
      <main className="flex-grow">
        {children}
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default Layout;
