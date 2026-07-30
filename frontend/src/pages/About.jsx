import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar isPublic={true} />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-16">
          <h1 className="text-base text-indigo-600 font-bold tracking-wide uppercase">Our Story</h1>
          <p className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">About Us</p>
        </div>

        <article className="prose prose-lg prose-blue mx-auto text-gray-600">
          <p className="lead text-xl font-medium text-gray-800">
            Founded with the sole purpose of bridging the gap between education and technology, CampusFlow is developed as a modern academic management solution.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Our Mission</h2>
          <p>
            We believe that administrative overhead shouldn't stand in the way of high-quality education. Our mission is to provide institutions with a clean, heavily secure, and incredibly fast interface to manage their daily workflows, grades, and attendance seamlessly.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">The Platform</h2>
          <p>
            Traditional academic management systems are bloated, extremely confusing, and suffer from poor user experiences. We created CampusFlow leveraging a cutting-edge MERN stack combined with enterprise-level Firebase Authentication to ensure that role separation and system scaling are handled perfectly.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mt-12 shadow-sm text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Development Team</h3>
            <p className="text-sm font-medium text-gray-500 mb-6 uppercase tracking-widest">RV Institute of Technology & Management</p>
            <div className="flex justify-center flex-wrap gap-8">
               <div className="text-center">
                 <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full font-bold flex items-center justify-center text-xl mx-auto mb-3 shadow-inner">N</div>
                 <p className="font-bold text-gray-900">Nandha</p>
               </div>
               <div className="text-center">
                 <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full font-bold flex items-center justify-center text-xl mx-auto mb-3 shadow-inner">M</div>
                 <p className="font-bold text-gray-900">Mohammed Mudassir</p>
               </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default About;
