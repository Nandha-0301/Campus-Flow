import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar isPublic={true} />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-gray-500 font-medium">Last updated: October 24, 2026</p>
        </div>

        <article className="prose prose-lg prose-blue mx-auto text-gray-600">
           <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
           <p>
             By registering an account within the College Management System portal, you unequivocally agree to be bound by these Terms of Service. If you disagree with any segment, please do not use our services.
           </p>

           <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. User Responsibilities</h2>
           <p>
             Users represent their distinct roles truthfully (Admin, Staff, Student, Parent) during registration. It is strictly prohibited to extract unauthorized information beyond your allocated dashboard scope. Administrators are authorized to execute removals on accounts breaching these rules immediately.
           </p>

           <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Acceptable Use and Disclaimers</h2>
           <p>
             The portal layout and the associated tools remain properties of the CampusFlow ecosystem. We offer no direct guarantees for continual uptime, though we project a high standard of functional stability. Institutional management takes full responsibility for validating user actions via the site.
           </p>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
