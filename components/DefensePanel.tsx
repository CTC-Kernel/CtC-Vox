import React, { useState } from 'react';
import { Shield, Lock, Terminal, Activity, CheckCircle, AlertTriangle, Play, RefreshCw, AlertOctagon } from 'lucide-react';
import { ThreatIntel, DefenseProtocol } from '../types';
import { GeminiService } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface DefensePanelProps {
  threats: ThreatIntel[];
  onLog: (module: string, message: string, status?: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS') => void;
  onLockdownToggle: (active: boolean) => void;
  isLockdown: boolean;
}

const DefensePanel: React.FC<DefensePanelProps> = ({ threats, onLog, onLockdownToggle, isLockdown }) => {
  const [protocols, setProtocols] = useState<DefenseProtocol[]>([]);
  const [advisory, setAdvisory] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const activeFirewall = true;
  const activeIDS = true;

  const handleGenerateDefense = async () => {
    setIsAnalyzing(true);
    onLog('DEFENSE', 'Initiation analyse IA Défense Tactique...', 'INFO');
    try {
        const result = await GeminiService.generateDefenseStrategies(threats);
        const mappedProtocols = result.protocols.map((p: any) => ({
            id: uuidv4(),
            ...p
        }));
        setProtocols(mappedProtocols);
        setAdvisory(result.advisory);
        onLog('DEFENSE', `${mappedProtocols.length} protocoles de contre-mesure générés.`, 'SUCCESS');
    } catch (e) {
        onLog('DEFENSE', 'Échec Analyse Défense IA.', 'ERROR');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const executeProtocol = (protocol: DefenseProtocol) => {
      onLog('EXEC', `Déploiement Protocole: ${protocol.title}...`, 'WARN');
      setTimeout(() => {
          onLog('SYS', `Commande exécutée: ${protocol.command.substring(0, 30)}...`, 'SUCCESS');
      }, 800);
  };

  const handleFlushDNS = () => {
      onLog('NET', 'Vidage Cache DNS Global...', 'INFO');
      setTimeout(() => onLog('NET', 'Cache DNS Effacé.', 'SUCCESS'), 1000);
  };

  const handleLockdown = () => {
      const newState = !isLockdown;
      onLockdownToggle(newState);
      if (newState) {
          onLog('DEFENSE', '!!! VERROUILLAGE RÉSEAU INITIÉ !!!', 'ERROR');
          onLog('DEFENSE', 'Tous ports externes bloqués. Mode Intranet uniquement.', 'WARN');
      } else {
          onLog('DEFENSE', 'Verrouillage levé. Trafic normal repris.', 'INFO');
      }
  };

  return (
    <div className="flex-1 bg-black/90 h-full p-8 overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-cyber-dim pb-4">
        <h2 className="text-3xl font-bold text-white flex items-center gap-4 tracking-tight">
          <Shield className="text-cyber" size={28} />
          MATRICE DÉFENSE ACTIVE
        </h2>
        <div className="flex gap-4">
             <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider px-3 py-1 bg-cyber/5 rounded border border-cyber/30 text-gray-300">
                 <CheckCircle size={12} className="text-green-400" />
                 PARE-FEU: EN LIGNE
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider px-3 py-1 bg-cyber/5 rounded border border-cyber/30 text-gray-300">
                 <CheckCircle size={12} className="text-green-400" />
                 IDS: ACTIF
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
          
          {/* Controls Column */}
          <div className="space-y-6">
              <div className="bg-cyber-panel border border-cyber-dim p-6 rounded-lg">
                  <h3 className="text-cyber font-bold text-xs tracking-widest mb-6 flex items-center gap-2 uppercase">
                      <Activity size={16} /> Opérations Système
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={handleFlushDNS}
                        className="flex items-center justify-between p-4 border border-cyber text-cyber hover:bg-cyber/10 rounded transition-all group"
                      >
                          <span className="font-medium text-sm">VIDER CACHE DNS</span>
                          <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                      <button 
                        onClick={handleLockdown}
                        className={`flex items-center justify-between p-4 border rounded transition-all font-bold tracking-wider ${
                            isLockdown 
                            ? 'bg-red-500 text-black border-red-500 animate-pulse' 
                            : 'border-cyber-alert text-cyber-alert hover:bg-cyber-alert/10'
                        }`}
                      >
                          <span className="text-sm">{isLockdown ? 'DÉSACTIVER VERROUILLAGE' : 'VERROUILLAGE URGENCE'}</span>
                          <AlertOctagon size={16} />
                      </button>
                  </div>
              </div>

              <div className="bg-cyber-panel border border-cyber-dim p-6 rounded-lg h-full relative overflow-hidden flex flex-col justify-center items-center">
                   <h3 className="text-cyber font-bold text-xs tracking-widest mb-2 flex items-center gap-2 uppercase absolute top-6 left-6">
                      <Lock size={16} /> Posture Menace
                  </h3>
                  <div className="text-center py-6 z-10">
                      <div className={`text-6xl font-bold mb-3 font-mono tracking-tighter ${isLockdown ? 'text-red-500' : threats.length > 5 ? 'text-orange-500' : 'text-green-400'}`}>
                          {isLockdown ? 'DEFCON 1' : threats.length > 5 ? 'DEFCON 3' : 'DEFCON 5'}
                      </div>
                      <div className="text-gray-400 text-xs font-bold tracking-widest uppercase">
                          {isLockdown ? 'PROTOCOLES SÉCURITÉ MAXIMALE' : 'SURVEILLANCE STANDARD'}
                      </div>
                  </div>
                  {isLockdown && (
                      <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse"></div>
                  )}
              </div>
          </div>

          {/* AI Strategy Column */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
               <div className="bg-cyber-panel border border-cyber-dim p-6 rounded-lg flex-1 flex flex-col overflow-hidden">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-cyber font-bold text-xs tracking-widest uppercase flex items-center gap-2">
                           <Terminal size={16} /> Contre-Mesures IA
                       </h3>
                       <button 
                         onClick={handleGenerateDefense}
                         disabled={isAnalyzing}
                         className="px-5 py-2 bg-cyber/10 hover:bg-cyber/20 text-cyber border border-cyber rounded-md text-xs font-bold tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
                       >
                           {isAnalyzing ? <RefreshCw className="animate-spin" size={14}/> : <Play size={14} />}
                           GÉNÉRER PROTOCOLES
                       </button>
                   </div>

                   {protocols.length === 0 ? (
                       <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded bg-black/20">
                           <Shield size={64} className="mb-6 opacity-20" strokeWidth={1} />
                           <p className="font-mono text-sm tracking-wide">EN ATTENTE ANALYSE MENACES...</p>
                           <p className="text-xs mt-2 font-light">Activez l'IA pour générer scripts de mitigation.</p>
                       </div>
                   ) : (
                       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                           {advisory && (
                               <div className="p-4 bg-blue-900/20 border-l-2 border-blue-400 text-sm text-blue-200 leading-relaxed rounded-r">
                                   <span className="font-bold block mb-1 tracking-wide text-xs uppercase">AVIS STRATÉGIQUE:</span>
                                   {advisory}
                               </div>
                           )}
                           
                           {protocols.map(p => (
                               <div key={p.id} className="border border-gray-700 rounded bg-black/40 p-4 hover:border-cyber/50 transition-colors">
                                   <div className="flex justify-between items-start mb-3">
                                       <div className="flex items-center gap-3">
                                           <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border uppercase ${
                                               p.type === 'FIREWALL' ? 'border-orange-500 text-orange-500' :
                                               p.type === 'IDS' ? 'border-purple-500 text-purple-500' :
                                               'border-blue-500 text-blue-500'
                                           }`}>{p.type}</span>
                                           <span className="text-white font-bold text-sm tracking-tight">{p.title}</span>
                                       </div>
                                       <button 
                                          onClick={() => executeProtocol(p)}
                                          className="text-[10px] font-bold px-3 py-1.5 bg-cyber/10 text-cyber hover:bg-cyber hover:text-black transition-colors rounded border border-cyber/50 tracking-wide"
                                       >
                                           EXÉCUTER
                                       </button>
                                   </div>
                                   <p className="text-gray-400 text-xs mb-3 font-mono">{p.description}</p>
                                   <div className="bg-black border border-gray-800 p-3 rounded relative group">
                                       <code className="text-green-500 text-xs font-mono break-all">{p.command}</code>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
          </div>
      </div>
    </div>
  );
};

export default DefensePanel;