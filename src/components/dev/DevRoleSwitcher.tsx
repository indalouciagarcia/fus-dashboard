import React from 'react';
import { motion } from 'framer-motion';
import { usePermissions } from '../../context/PermissionsContext';

const DevRoleSwitcher: React.FC = () => {
  // Hide in production mode
  if (import.meta.env.MODE === 'production') return null;

  const { authState, loginAs } = usePermissions();
  const roles = ['super_admin', 'coach', 'technical_director', 'match_operator', 'viewer'];

  return (
    <motion.div 
      drag
      dragMomentum={false}
      whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
      className="fixed bottom-6 right-6 z-[9999] bg-slate-900/95 backdrop-blur-xl border border-white/20 p-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 max-w-[420px] cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          🕹️ Dev Role Switcher
        </div>
        <div className="text-[9px] font-bold text-white/20 uppercase">Draggable</div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
      {roles.map(r => {
        const isActive = authState.roles.includes(r);
        return (
          <button
            key={r}
            onClick={() => loginAs(r)}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-2xl transition-all duration-300 border ${isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/20'}`}
          >
            {r.split('_').join(' ')}
          </button>
        )
      })}
      </div>
      <p className="text-[9px] text-center text-emerald-400/60 font-medium px-4 leading-relaxed italic">
        Cliquez sur un rôle pour recharger dynamiquement les permissions.
      </p>
    </motion.div>
  );
};

export default DevRoleSwitcher;
