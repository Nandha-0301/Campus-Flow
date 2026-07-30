import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Github, Linkedin, Send } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar isPublic={true} />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-base text-indigo-600 font-bold tracking-wide uppercase">Get in Touch</h1>
          <p className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Contact Us</p>
          <p className="mt-4 text-xl text-gray-500 font-medium">
            Have questions about our platform or enterprise plans? We're here to help.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row max-w-5xl mx-auto">
          {/* Left: Form */}
          <div className="flex-1 p-8 sm:p-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h3>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <label className="text-sm font-bold text-gray-700">First Name</label>
                   <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="John" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-sm font-bold text-gray-700">Last Name</label>
                   <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="Doe" />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-bold text-gray-700">Email Address</label>
                 <input type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="john@example.com" />
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-bold text-gray-700">Message</label>
                 <textarea rows="4" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors resize-none" placeholder="How can we help?"></textarea>
               </div>
               <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                  <Send size={18} /> Send Message
               </button>
               {/* Note: In production, we'll embed a Google form or actual API handler here. */}
            </form>
          </div>

          {/* Right: Info */}
          <div className="w-full lg:w-[400px] bg-gray-900 text-white p-8 sm:p-12 flex flex-col justify-between">
             <div>
               <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
               <p className="text-gray-400 font-medium mb-12">
                 Fill out the form and our team will get back to you within 24 hours.
               </p>

               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                     <Mail className="text-indigo-400" size={20} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Us</p>
                     <p className="font-medium mt-0.5">nandhanprem21@gmail.com</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                     <Phone className="text-emerald-400" size={20} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Call Us</p>
                     <p className="font-medium mt-0.5">7483327794</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                     <MapPin className="text-orange-400" size={20} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Visit Us</p>
                     <p className="font-medium mt-0.5">RVITM<br/>Bangalore</p>
                   </div>
                 </div>
               </div>
             </div>

             <div className="mt-12 pt-8 border-t border-gray-800 flex gap-4">
                <a href="https://github.com/Nandha-0301" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 hover:text-indigo-400 transition-colors">
                  <Github size={18} />
                </a>
                <a href="https://www.linkedin.com/in/nandha-dev" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 hover:text-indigo-400 transition-colors">
                  <Linkedin size={18} />
                </a>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
