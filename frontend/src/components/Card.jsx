import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, ...props }) => {
  return (
    <div 
      className={twMerge(
        clsx(
          "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }) => (
  <div className={twMerge(clsx("border-b border-slate-200 px-5 py-4 md:px-6", className))}>
    {children}
  </div>
);

export const CardBody = ({ children, className }) => (
  <div className={twMerge(clsx("p-5 md:p-6", className))}>
    {children}
  </div>
);

export const CardFooter = ({ children, className }) => (
  <div className={twMerge(clsx("border-t border-slate-200 bg-slate-50 px-5 py-4 md:px-6", className))}>
    {children}
  </div>
);

export default Card;
