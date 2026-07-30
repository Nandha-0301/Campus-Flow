import React from 'react';

const Loader = ({ className, size = 32 }) => {
  return (
    <div className={`flex justify-center items-center ${className || ''}`}>
      <svg 
        className="animate-spin text-indigo-500" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
    </div>
  );
};

export default Loader;
