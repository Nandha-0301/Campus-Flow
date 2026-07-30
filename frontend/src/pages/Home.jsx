import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rolePathMap } from '../constants/rolePathMap';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero3D from '../components/Hero3D';
import { Shield, BarChart3, Users, ChevronRight, Award, Clock, ArrowRight, CheckCircle2, LayoutDashboard } from 'lucide-react';

const Home = () => {
  const { user, role, loading } = useAuth();

  // Auto redirect authenticated users
  if (!loading && user && role && rolePathMap[role]) {
    return <Navigate to={rolePathMap[role]} replace />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar isPublic={true} />

      {/* Hero Section */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-10 pb-10 md:pt-16 md:pb-16 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Subtle background decorations */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Left Content */}
            <div className="text-center lg:text-left flex flex-col items-center lg:items-start max-w-2xl mx-auto lg:mx-0">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-6">
                Smart Academic Management <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
                  for Modern Institutions
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 font-medium">
                Unify attendance, grading, and communication in one clean, role-based platform designed for tomorrow's educators.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link 
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-all duration-300 text-white rounded-xl font-bold shadow-sm shadow-indigo-600/25 text-lg flex items-center justify-center group"
                >
                  Login
                  <ArrowRight size={20} strokeWidth={2.5} className="ml-2 group-hover:translate-x-1.5 transition-transform" />
                </Link>
                <Link 
                  to="/features"
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:shadow-md transition-all text-lg flex items-center justify-center"
                >
                  Explore Features
                </Link>
              </div>
            </div>

            {/* Right Content - Spline 3D */}
            <div className="w-full relative z-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-400/20 rounded-full blur-[100px] -z-10 mix-blend-multiply pointer-events-none"></div>
              <Hero3D />
            </div>

          </div>
        </div>
      </main>

      {/* Features Showcase */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base text-indigo-600 font-bold tracking-wide uppercase">Core Platform</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Everything you need to succeed</p>
            <p className="mt-4 text-xl text-gray-500">
              Purpose-built tools tailored for the distinct responsibilities of every campus participant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Rich Analytics', desc: 'Predictive modeling on attendance and grades. Know who needs help before they ask.', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'hover:border-indigo-200' },
              { title: 'Secure Access', desc: 'Enterprise-grade Firebase Auth mapped tightly with MERN-based strict role checking.', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'hover:border-emerald-200' },
              { title: 'Parent Portal', desc: 'Real-time performance transparency ensuring guardians are always kept in the loop.', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', border: 'hover:border-purple-200' },
              { title: 'Instant Tracking', desc: 'Staff can mark absentees instantly via mobile-friendly fast toggles saving teaching time.', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', border: 'hover:border-orange-200' },
              { title: 'Digital Grades', desc: 'Eliminate paper. Seamless online assignments, grade distributions, and curve alignments.', icon: Award, color: 'text-pink-600', bg: 'bg-pink-100', border: 'hover:border-pink-200' },
              { title: 'Unified Data', desc: 'One central source of truth for the entire institution removing spreadsheet chaos entirely.', icon: LayoutDashboard, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'hover:border-indigo-200' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className={`group bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${feature.border}`}>
                  <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6 ring-4 ring-white`}>
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-600 rounded-full blur-3xl opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
             <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Three steps to integration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg mb-6 ring-8 ring-gray-800">1</div>
              <h3 className="text-xl font-bold mb-3">Sign Up Securely</h3>
              <p className="text-gray-400 font-medium px-4">Create your account and select your designated role within the institution.</p>
            </div>
            <div className="relative">
               {/* Line connector for md+ screens */}
              <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gray-800 -z-10 -ml-[50%]"></div>
              <div className="w-16 h-16 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg mb-6 ring-8 ring-gray-800">2</div>
              <h3 className="text-xl font-bold mb-3">System Validates</h3>
              <p className="text-gray-400 font-medium px-4">Firebase authenticates your credentials while our MERN backend locks in your role permissions.</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gray-800 -z-10 -ml-[50%]"></div>
              <div className="w-16 h-16 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg mb-6 ring-8 ring-gray-800">3</div>
              <h3 className="text-xl font-bold mb-3">Access Dashboard</h3>
              <p className="text-gray-400 font-medium px-4">Instantly redirected to a personalized SaaS dashboard filled with relevant tools and data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50 border-b border-gray-200">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-center text-gray-900 tracking-tight mb-16">Trusted by Educators Worldwide</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Dr. Sarah Jenkins', role: 'University Dean', quote: 'This platform completely eliminated our manual grading paperwork. The Admin overview alone is worth its weight in gold.' },
                { name: 'Michael Chen', role: 'Computer Science Student', quote: 'I love being able to see my attendance and grades in real-time. The UI is clean, modern, and never crashes.' },
                { name: 'Elena Rodriguez', role: 'Parent', quote: 'Finally, I don\'t have to wait for end-of-term meetings to know how my child is doing. Transparency is beautifully executed.' },
              ].map((t, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, j) => (
                       <svg key={j} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ))}
                  </div>
                  <p className="text-gray-600 font-medium italic flex-1 mb-6 leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
         </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
