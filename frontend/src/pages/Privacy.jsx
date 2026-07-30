import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar isPublic={true} />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-gray-500 font-medium">Last updated: October 24, 2026</p>
        </div>

        <article className="prose prose-lg prose-blue mx-auto text-gray-600">
           <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Data Collection</h2>
           <p>
             We collect information that you explicitly provide directly to us through our platform. This includes names, email addresses, and metadata associated with user interactions. Furthermore, when accessing our SaaS solutions, our database may securely store institutional data like performance and attendance records solely for providing functional services.
           </p>

           <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Usage of Data</h2>
           <p>
             All collected data is utilized exclusively to maintain the College Management ecosystem. We process role-based parameters strictly locally and within heavily restricted endpoints to verify user routing. We do not sell your academic telemetry.
           </p>

           <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Security Operations</h2>
           <p>
             Data integrity is our utmost priority. The system interfaces securely via Firebase's enterprise-grade Authentication SDKs. We ensure payloads transmitted to our endpoints contain encoded JSON web tokens guaranteeing requests exclusively manifest from permitted users. By utilizing our service, you acknowledge our use of cookies and local storage tokens.
           </p>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
