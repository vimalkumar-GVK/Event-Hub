import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Rocket, Shield, Zap, Calendar } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary-500/20 to-transparent blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-6 leading-tight"
          >
            Smart Campus <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Events Management</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10"
          >
            Elevate your campus experience with our production-ready, real-time event platform. 
            Seamless registrations, instant notifications, and premium security.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/login" className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2">
              <Zap size={20} /> Get Started
            </Link>
            <Link to="/login" className="px-8 py-4 glass text-slate-900 dark:text-white rounded-2xl font-bold border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center gap-2">
              <Calendar size={20} /> Browse Events
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Shield className="text-primary-500" />}
            title="Premium Security"
            description="JWT-based authentication and BCrypt hashing keep your data safe and sound."
          />
          <FeatureCard 
            icon={<Zap className="text-primary-500" />}
            title="Real-time Updates"
            description="WebSockets ensure you never miss a registration approval or a chat message."
          />
          <FeatureCard 
            icon={<Rocket className="text-primary-500" />}
            title="Blazing Fast"
            description="Built with React, Vite, and Bun for the ultimate developer and user experience."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-8"
  >
    <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-4 dark:text-white">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400">{description}</p>
  </motion.div>
);

export default Landing;
