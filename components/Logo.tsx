
import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = 'dark', className = '' }) => {
  // To use an actual image file later, simply replace the SVG below with:
  // <img src="/path/to/logo.png" alt="Zipton Tours" className={className} />
  
  const textColor = variant === 'light' ? 'text-white' : 'text-zipton-brown';
  
  return (
    <div className={`flex items-center space-x-2 transition-transform hover:scale-105 ${className}`}>
      {/* Icon portion of the logo */}
      <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#f19021" />
        <path d="M12 28L20 12L28 28H12Z" fill="white" />
        <path d="M18 20L20 17L22 20H18Z" fill="#4a2b1f" />
      </svg>
      
      {/* Text portion */}
      <span className={`text-xl md:text-2xl font-extrabold tracking-tighter uppercase ${textColor}`}>
        Zipton<span className="text-zipton-orange">Tours</span>
      </span>
    </div>
  );
};

export default Logo;
