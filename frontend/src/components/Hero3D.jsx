import React from 'react';
import Spline from '@splinetool/react-spline';

const Hero3D = () => {
  return (
    <div className="w-full h-[420px] md:h-[500px] overflow-hidden rounded-2xl flex items-center justify-center relative">
      <div className="w-full h-full scale-[1.35] md:scale-[1.5] origin-center flex items-center justify-center">
        <Spline scene="https://prod.spline.design/wA9xLzcW4J6b2zf2/scene.splinecode" className="w-full h-full" />
      </div>
      <style>{`
        /* Hide Spline Logo if rendered as an absolute link */
        a[href*="spline.design"] {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
};

export default Hero3D;
