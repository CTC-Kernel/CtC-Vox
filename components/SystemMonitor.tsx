import React from 'react';
import { SystemMetrics } from '../types';
import { Cpu, Activity, Database, Server, Clock } from 'lucide-react';

interface SystemMonitorProps {
  metrics: SystemMetrics;
}

const MetricCard = ({ icon: Icon, label, value, subtext }: any) => (
    <div className="bg-cyber-panel border border-cyber-dim p-5 rounded-lg flex items-center gap-5 relative overflow-hidden group hover:border-cyber/30 transition-all">
        <div className="p-3.5 bg-cyber/10 rounded-xl text-cyber border border-cyber/20 group-hover:bg-cyber/20 transition-colors">
            <Icon size={26} strokeWidth={1.5} />
        </div>
        <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</div>
            <div className="text-3xl font-medium text-white font-mono tracking-tight">{value}</div>
            {subtext && <div className="text-[11px] text-cyber-dim font-medium mt-0.5">{subtext}</div>}
        </div>
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyber/5 rounded-full blur-2xl group-hover:bg-cyber/10 transition-colors"></div>
    </div>
);

const SystemMonitor: React.FC<SystemMonitorProps> = ({ metrics }) => {
  return (
    <div className="flex-1 bg-black/90 h-full p-8 overflow-y-auto">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4 border-b border-cyber-dim pb-4 tracking-tight">
            <Activity className="text-cyber" size={28} />
            DIAGNOSTIC SYSTÈME
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <MetricCard 
                icon={Database} 
                label="Menaces Actives" 
                value={metrics.threatCount} 
                subtext="Entités Voxel" 
            />
            <MetricCard 
                icon={Server} 
                label="Latence API" 
                value={`${metrics.apiLatency.toFixed(0)}ms`} 
                subtext="Passerelle Gemini" 
            />
            <MetricCard 
                icon={Cpu} 
                label="Mémoire Heap" 
                value={`${(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB`} 
                subtext="Allocation JS" 
            />
            <MetricCard 
                icon={Clock} 
                label="Uptime" 
                value={`${Math.floor(metrics.uptime)}s`} 
                subtext="Session Courante" 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-cyber-panel border border-cyber-dim rounded-lg p-6">
                <h3 className="text-cyber font-bold text-xs tracking-widest uppercase mb-6 flex items-center gap-2">
                    <Activity size={14} /> État de Santé
                </h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                            <span className="text-gray-400">STATUT_MOTEUR_NOYAU</span>
                            <span className="text-green-400 font-bold">OPÉRATIONNEL</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                            <span className="text-gray-400">LIAISON_RÉSEAU</span>
                            <span className="text-cyber font-bold">STABLE</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="w-[98%] h-full bg-cyber shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                            <span className="text-gray-400">RENDU_VOXEL</span>
                            <span className="text-purple-400 font-bold">60 FPS</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="w-[92%] h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex flex-col justify-center">
                <div className="text-yellow-500 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                    <Activity size={14} />
                    Note de Performance
                </div>
                <p className="text-gray-300 text-sm leading-relaxed font-light">
                    Le système fonctionne en mode <strong className="text-white font-medium">PRODUCTION</strong>. Les flux de données temps réel sont actifs et optimisés. 
                    <br/><br/>
                    L'utilisation des quotas API est surveillée. Intervalle de sondage autonome réglé à <strong>60s</strong> pour optimiser le débit et réduire la charge cognitive.
                </p>
            </div>
        </div>
    </div>
  );
};

export default SystemMonitor;