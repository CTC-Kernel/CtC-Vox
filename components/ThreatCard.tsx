import React, { useEffect, useRef } from 'react';
import { ThreatIntel, ThreatLevel } from '../types';
import { ShieldAlert, Globe, Activity, Target, Zap } from 'lucide-react';

interface ThreatCardProps {
  threat: ThreatIntel;
  isSelected: boolean;
  onSelect: () => void;
}

const ThreatCard: React.FC<ThreatCardProps> = ({ threat, isSelected, onSelect }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isCritical = threat.severity === ThreatLevel.CRITICAL;
  
  // Dynamic glow based on selection or severity
  const glowClass = isSelected 
    ? (isCritical
        ? 'shadow-[0_0_20px_rgba(255,42,109,0.5)] bg-cyber-alert/10 border-cyber-alert' 
        : 'shadow-[0_0_20px_rgba(0,243,255,0.4)] bg-cyber/10 border-cyber')
    : (isCritical
        ? 'border-l-4 border-l-cyber-alert border-y border-r border-transparent hover:border-cyber-alert/50' 
        : 'border-l-4 border-l-cyber-alert border-y border-r border-transparent hover:border-cyber/50');

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isSelected]);

  return (
    <div 
      ref={cardRef}
      onClick={onSelect}
      className={`
        relative p-4 mb-3 cursor-pointer transition-all duration-300
        ${glowClass} 
        backdrop-blur-sm group
      `}
    >
      {/* Decorative corners for selected state */}
      {isSelected && (
        <>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50"></div>
        </>
      )}

      <div className="flex justify-between items-start mb-2">
        <h3 className="text-md font-bold text-white flex items-center gap-2 tracking-wide">
          {isCritical ? <ShieldAlert className="text-cyber-alert animate-pulse" size={16} /> : <Activity className="text-cyber" size={16} />}
          {threat.name}
        </h3>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
          isCritical
            ? 'border-cyber-alert text-cyber-alert' 
            : 'border-cyber text-cyber'
        }`}>
          {threat.severity}
        </span>
      </div>
      
      <p className="text-gray-400 text-xs mb-3 font-mono leading-relaxed line-clamp-3 group-hover:text-gray-300 transition-colors">
        {threat.description}
      </p>

      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-gray-500">
        <div className="flex items-center gap-1 text-cyber-dim group-hover:text-cyber/70 transition-colors">
          <Globe size={10} />
          <span className="truncate max-w-[150px]">{threat.affectedSectors.join(', ')}</span>
        </div>
        
        {isSelected ? (
           <div className="flex items-center gap-1 text-cyber animate-pulse font-bold">
             <Target size={10} />
             <span>CIBLÉ</span>
           </div>
        ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-cyber/50 flex items-center gap-1">
                <Zap size={10} />
                <span>SÉLECTION</span>
            </div>
        )}
      </div>
      
      {/* Animated Scanline for selected card */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm">
            <div className="w-full h-[2px] bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-[scanline_2s_linear_infinite]"></div>
        </div>
      )}
    </div>
  );
};

export default ThreatCard;