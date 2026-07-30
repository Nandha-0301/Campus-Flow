import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white pt-16 pb-8 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
           <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-lg leading-none">C</span>
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">CampusFlow</span>
              </Link>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Building the digital infrastructure for modern educational institutions gracefully.
              </p>
           </div>
           <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm font-medium text-gray-500">
                <li><Link to="/features" className="hover:text-indigo-600 transition-colors">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</Link></li>
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Login</Link></li>
              </ul>
           </div>
           <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm font-medium text-gray-500">
                <li><Link to="/about" className="hover:text-indigo-600 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link></li>
              </ul>
           </div>
           <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm font-medium text-gray-500">
                <li><Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
              </ul>
           </div>
         </div>
         <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-sm font-medium text-gray-400">© {new Date().getFullYear()} College Management System. All rights reserved.</p>
           <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors"><Shield size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors"><Users size={20} /></a>
           </div>
         </div>
      </div>
    </footer>
  );
};

export default Footer;
