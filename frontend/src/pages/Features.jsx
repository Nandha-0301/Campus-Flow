import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BarChart3, Shield, Users, Clock, Award, LayoutDashboard } from 'lucide-react';

const Features = () => {
  const features = [
    { title: 'Performance Analytics', desc: 'Predictive modeling on attendance and grades. Know who needs help before they ask.', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100', hover: 'hover:border-indigo-200 hover:shadow-indigo-900/5' },
    { title: 'Attendance Tracking', desc: 'Staff can mark absentees instantly via mobile-friendly fast toggles saving teaching time.', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', hover: 'hover:border-orange-200 hover:shadow-orange-900/5' },
    { title: 'Role-Based Access', desc: 'Enterprise-grade Firebase Auth mapped tightly with strict role checking to ensure data privacy.', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-100', hover: 'hover:border-emerald-200 hover:shadow-emerald-900/5' },
    { title: 'Communication System', desc: 'Real-time performance transparency ensuring guardians and staff are always kept in the loop.', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', hover: 'hover:border-purple-200 hover:shadow-purple-900/5' },
    { title: 'Digital Grades & Results', desc: 'Eliminate paper. Seamless online assignments, grade distributions, and official transcripts.', icon: Award, color: 'text-pink-600', bg: 'bg-pink-100', hover: 'hover:border-pink-200 hover:shadow-pink-900/5' },
    { title: 'Reports & Insights', desc: 'One central source of truth for the entire institution removing spreadsheet chaos entirely.', icon: LayoutDashboard, color: 'text-indigo-600', bg: 'bg-indigo-100', hover: 'hover:border-indigo-200 hover:shadow-indigo-900/5' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar isPublic={true} />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-base text-indigo-600 font-bold tracking-wide uppercase">Capabilities</h1>
          <p className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Powerful Features</p>
          <p className="mt-4 text-xl text-gray-500 font-medium">
            Everything your institution needs to operate at peak efficiency, beautifully designed into a single cohesive platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className={`group bg-white p-8 mb-2 rounded-[2rem] border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${feature.hover}`}>
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6 ring-4 ring-gray-50`}>
                  <Icon size={28} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
