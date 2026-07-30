import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HowItWorks = () => {
  const steps = [
    { num: '1', title: 'Sign Up', desc: 'Register securely and select your designated role (Admin, Staff, Student, or Parent).' },
    { num: '2', title: 'Login & Authenticate', desc: 'Securely verify your identity via Firebase email or Google login.' },
    { num: '3', title: 'Access Dashboard', desc: 'Instantly view a customized SaaS portal filled only with the tools relevant to you.' },
    { num: '4', title: 'Manage Academic Data', desc: 'Track attendance, evaluate performance, and communicate seamlessly.' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar isPublic={true} />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-base text-indigo-600 font-bold tracking-wide uppercase">Onboarding</h1>
          <p className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">How It Works</p>
          <p className="mt-4 text-xl text-gray-500 font-medium">
            Join the ecosystem in four simple steps and transform the way you interact with academic operations.
          </p>
        </div>

        <div className="space-y-12">
           {steps.map((step, i) => (
             <div key={i} className="flex flex-col md:flex-row items-center gap-8 bg-gray-50 border border-gray-100 rounded-3xl p-8 hover:shadow-lg transition-shadow">
               <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-black shadow-lg shadow-indigo-600/20 ring-8 ring-indigo-50">
                    {step.num}
                  </div>
               </div>
               <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-lg text-gray-600 font-medium">{step.desc}</p>
               </div>
             </div>
           ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
