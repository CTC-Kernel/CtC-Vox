import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, 
  Cpu, 
  Search, 
  Terminal as TerminalIcon, 
  Radio, 
  Wifi, 
  Lock,
  Globe,
  AlertOctagon,
  Eye,
  RotateCcw,
  Zap,
  Target,
  FileCode,
  X,
  Filter,
  Download,
  Activity
} from 'lucide-react';
import VoxelMap from './components/VoxelMap';
import Terminal from './components/Terminal';
import ThreatCard from './components/ThreatCard';
import NewsFeed from './components/NewsFeed';
import SystemMonitor from './components/SystemMonitor';
import DefensePanel from './components/DefensePanel';
import { GeminiService } from './services/geminiService';
import { AgentStatus, SystemLog, ThreatIntel, ThreatLevel, NetworkBlip, NewsArticle, SystemMetrics } from './types';
import { v4 as uuidv4 } from 'uuid';

type ViewMode = 'MAP' | 'SYSTEM' | 'FEED' | 'DEFENSE';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('MAP');
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [threats, setThreats] = useState<ThreatIntel[]>([]);
  const [blips, setBlips] = useState<NetworkBlip[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const [isDeepScanning, setIsDeepScanning] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  
  // New State for Defense
  const [isLockdown, setIsLockdown] = useState(false);
  
  // Refs for accessing state inside intervals without dependencies
  const threatsRef = useRef<ThreatIntel[]>([]);
  const autonomousModeRef = useRef(autonomousMode);
  
  // Update refs when state changes
  useEffect(() => {
    threatsRef.current = threats;
  }, [threats]);

  useEffect(() => {
    autonomousModeRef.current = autonomousMode;
  }, [autonomousMode]);

  // Metrics
  const startTime = useRef(Date.now());
  const [metrics, setMetrics] = useState<SystemMetrics>({
    threatCount: 0,
    apiLatency: 0,
    memoryUsage: 0,
    uptime: 0,
    lastUpdate: new Date().toISOString()
  });

  // Filtering state
  const [filterSeverity, setFilterSeverity] = useState<ThreatLevel | 'ALL'>('ALL');

  const selectedThreat = threats.find(t => t.id === selectedThreatId);
  const filteredThreats = threats.filter(t => 
    filterSeverity === 'ALL' ? true : t.severity === filterSeverity
  );

  const addLog = useCallback((module: string, message: string, status: SystemLog['status'] = 'INFO') => {
    setLogs(prev => {
      const newLogs = [...prev, {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        module: module.toUpperCase(),
        message,
        status
      }];
      return newLogs.slice(-50);
    });
  }, []);

  // Update System Metrics
  useEffect(() => {
    const interval = setInterval(() => {
        const mem = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 50 * 1024 * 1024;
        setMetrics(prev => ({
            ...prev,
            threatCount: threatsRef.current.length,
            memoryUsage: mem,
            uptime: (Date.now() - startTime.current) / 1000,
        }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real Autonomous Mode: Polling
  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval>;

    const runAutonomousCycle = async () => {
        // Double check ref to be safe inside async
        if (!autonomousModeRef.current) return;
        
        addLog('AUTO', 'Initiation du cycle de surveillance autonome...', 'INFO');
        const start = performance.now();
        
        try {
            // 1. Check for News
            const newsData = await GeminiService.fetchLatestNews();
            let latestHeadline = "";

            if (newsData && newsData.articles && newsData.articles.length > 0) {
                const newArticles = newsData.articles.map((a: any) => ({
                    id: uuidv4(),
                    ...a
                }));
                latestHeadline = newsData.articles[0].title;
                
                setNews(prev => {
                    // Avoid duplicates roughly
                    const existingTitles = new Set(prev.map(p => p.title));
                    const uniqueNew = newArticles.filter((n: any) => !existingTitles.has(n.title));
                    if (uniqueNew.length > 0) {
                        addLog('AUTO', `Ingestion de ${uniqueNew.length} nouveaux rapports.`, 'SUCCESS');
                        return [...uniqueNew, ...prev].slice(0, 50);
                    }
                    return prev;
                });
            } else {
                 addLog('AUTO', 'Aucune nouvelle intelligence détectée ce cycle.', 'INFO');
            }

            // 2. Random check for threats (simulating finding something on the wire based on news)
            // Note: We use the news summary to perform a threat scan to keep it relevant
            // Check threatsRef to avoid dependency loop
            if (latestHeadline && threatsRef.current.length < 8) {
                addLog('AUTO', `Analyse croisée : "${latestHeadline.substring(0, 40)}..."`, 'WARN');
                const scanResult = await GeminiService.scanThreatLandscape(`Analyze threats related to: ${latestHeadline}`);
                
                if (scanResult.data.threats && scanResult.data.threats.length > 0) {
                      const newThreats: ThreatIntel[] = scanResult.data.threats.map((t: any) => ({
                        id: uuidv4(),
                        name: t.name,
                        type: t.type,
                        description: t.description,
                        severity: t.severity as ThreatLevel,
                        affectedSectors: t.affectedSectors,
                        dateDetected: new Date().toISOString(),
                        coordinates: [
                            t.approximateLocation?.lat || (Math.random() * 160 - 80), 
                            t.approximateLocation?.lon || (Math.random() * 360 - 180)
                        ]
                    }));
                    setThreats(prev => [...prev, ...newThreats]);
                    addLog('AUTO', `${newThreats.length} menaces actives identifiées.`, 'ALERT');
                }
            }
            
            setMetrics(prev => ({ ...prev, apiLatency: performance.now() - start, lastUpdate: new Date().toISOString() }));

        } catch (e) {
            addLog('AUTO', 'Cycle interrompu. Erreur API/Réseau.', 'ERROR');
        }
    };

    if (autonomousMode) {
        setStatus(AgentStatus.SCANNING);
        runAutonomousCycle(); // Run immediately on enable
        pollTimer = setInterval(runAutonomousCycle, 60000); // Poll every 60s
    } else {
        if (status === AgentStatus.SCANNING) setStatus(AgentStatus.IDLE);
    }

    return () => clearInterval(pollTimer);
  }, [autonomousMode, addLog]); // Removed threats.length dependency

  // Visual Blips - Still needed for map aesthetics, but now tied to app 'heartbeat'
  useEffect(() => {
    if (activeView === 'MAP') {
        const interval = setInterval(() => {
            // Only show blips if there are actual threats or we are in auto mode
            if (threatsRef.current.length > 0 || autonomousModeRef.current) {
                const newBlip: NetworkBlip = {
                    id: uuidv4(),
                    coordinates: [(Math.random() * 160 - 80), (Math.random() * 360 - 180)],
                    color: Math.random() > 0.9 ? '#ff2a6d' : '#00f3ff',
                    timestamp: Date.now()
                };
                setBlips(prev => [...prev.slice(-20), newBlip]);
            }
        }, autonomousMode ? 800 : 2000);
        return () => clearInterval(interval);
    }
  }, [activeView, autonomousMode]);
  
  // Cleanup blips
  useEffect(() => {
    const timeout = setTimeout(() => {
        setBlips(prev => prev.filter(b => Date.now() - b.timestamp < 3000));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [blips]);


  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;

    setAutonomousMode(false);
    setStatus(AgentStatus.ANALYZING);
    setSelectedThreatId(null);
    setActiveView('MAP'); // Switch to map to see results
    
    addLog('USER', `Commande Manuelle : "${inputQuery}"`);
    const start = performance.now();

    try {
      const result = await GeminiService.scanThreatLandscape(inputQuery);
      
      setMetrics(prev => ({ ...prev, apiLatency: performance.now() - start }));
      
      if (result.sources.length > 0) {
        setSources(result.sources);
      }
      
      if (result.data.threats) {
        const newThreats: ThreatIntel[] = result.data.threats.map((t: any) => ({
            id: uuidv4(),
            name: t.name,
            type: t.type,
            description: t.description,
            severity: t.severity as ThreatLevel,
            affectedSectors: t.affectedSectors,
            dateDetected: new Date().toISOString(),
            coordinates: [
                t.approximateLocation?.lat || (Math.random() * 160 - 80), 
                t.approximateLocation?.lon || (Math.random() * 360 - 180)
            ]
        }));
        setThreats(newThreats);
        setStatus(AgentStatus.IDLE);
        addLog('SYSTEM', `Scan terminé. ${newThreats.length} cibles acquises.`, 'SUCCESS');
      } else {
        addLog('SYSTEM', 'Aucune menace détectée dans le secteur.', 'INFO');
        setStatus(AgentStatus.IDLE);
      }

    } catch (error) {
      addLog('SYSTEM', 'Échec du scan. Vérifiez liaison API.', 'ERROR');
      setStatus(AgentStatus.IDLE);
    }
  };

  const handleDeepScan = async () => {
    if (!selectedThreat) return;
    setIsDeepScanning(true);
    addLog('AI', `Lancement scan profond sur ${selectedThreat.name}...`, 'WARN');
    const start = performance.now();

    try {
      const details = await GeminiService.generateThreatDeepDive(selectedThreat);
      setThreats(prev => prev.map(t => 
        t.id === selectedThreat.id ? { ...t, details: details } : t
      ));
      setMetrics(prev => ({ ...prev, apiLatency: performance.now() - start }));
      addLog('AI', 'Structure analytique générée.', 'SUCCESS');
    } catch (e) {
      addLog('AI', 'Analyse profonde annulée.', 'ERROR');
    } finally {
      setIsDeepScanning(false);
    }
  };

  const fetchNewsManual = async () => {
      setIsLoadingNews(true);
      addLog('NET', 'Récupération du flux de renseignement...', 'INFO');
      try {
          const data = await GeminiService.fetchLatestNews();
          if (data && data.articles && data.articles.length > 0) {
             const newArticles = data.articles.map((a: any) => ({ id: uuidv4(), ...a }));
             setNews(newArticles);
             addLog('NET', 'Flux mis à jour avec succès.', 'SUCCESS');
          } else {
             addLog('NET', 'Aucun résultat dans le flux.', 'WARN');
          }
      } catch (e) {
          addLog('NET', 'Échec mise à jour flux.', 'ERROR');
      } finally {
          setIsLoadingNews(false);
      }
  };

  // Initial Boot
  useEffect(() => {
      addLog('BOOT', 'NOYAU CTC V4.2 INITIALISÉ', 'SUCCESS');
      // Fetch initial news
      fetchNewsManual();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => {
      const report = {
          metadata: {
              generatedAt: new Date(),
              version: "4.2",
              systemStatus: metrics
          },
          intelligence: {
              activeThreats: threats,
              recentNews: news.slice(0, 10)
          },
          logs: logs
      };
      const dataStr = JSON.stringify(report, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RAPPORT_CTC_${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addLog('SYS', 'Rapport Sécurisé généré et exporté.', 'SUCCESS');
  };

  return (
    <div className={`w-full h-screen font-sans antialiased flex overflow-hidden selection:bg-cyber selection:text-black ${isLockdown ? 'bg-red-950/20' : 'bg-cyber-dark text-white'}`}>
      
      {/* Lockdown Overlay */}
      {isLockdown && (
        <div className="fixed inset-0 pointer-events-none z-50 border-[10px] border-red-600/50 animate-pulse box-border shadow-[inset_0_0_100px_rgba(255,0,0,0.5)]"></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-20 border-r flex flex-col items-center py-6 gap-8 z-20 shadow-[5px_0_20px_rgba(0,0,0,0.5)] transition-colors duration-500
          ${isLockdown ? 'bg-red-950/90 border-red-800' : 'bg-cyber-panel border-cyber-dim'}`}>
        <div className={`text-cyber animate-pulse-fast mb-4 ${isLockdown ? 'text-red-500' : ''}`}>
          <AlertOctagon size={32} />
        </div>
        
        <nav className="flex flex-col gap-6 w-full">
            <button 
                onClick={() => setActiveView('MAP')}
                className={`flex flex-col items-center gap-1 p-2 border-l-2 transition-all hover:bg-white/5
                ${activeView === 'MAP' ? 'border-cyber text-cyber bg-cyber/10' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Globe size={20} strokeWidth={1.5} />
                <span className="text-[9px] font-mono tracking-wider font-medium">CARTE</span>
            </button>
            
            <button 
                onClick={() => setActiveView('SYSTEM')}
                className={`flex flex-col items-center gap-1 p-2 border-l-2 transition-all hover:bg-white/5
                ${activeView === 'SYSTEM' ? 'border-cyber text-cyber bg-cyber/10' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Cpu size={20} strokeWidth={1.5} />
                <span className="text-[9px] font-mono tracking-wider font-medium">SYSTÈME</span>
            </button>

            <button 
                onClick={() => setActiveView('FEED')}
                className={`flex flex-col items-center gap-1 p-2 border-l-2 transition-all hover:bg-white/5
                ${activeView === 'FEED' ? 'border-cyber text-cyber bg-cyber/10' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Radio size={20} strokeWidth={1.5} />
                <span className="text-[9px] font-mono tracking-wider font-medium">FLUX</span>
            </button>

             <button 
                onClick={() => setActiveView('DEFENSE')}
                className={`flex flex-col items-center gap-1 p-2 border-l-2 transition-all hover:bg-white/5
                ${activeView === 'DEFENSE' ? (isLockdown ? 'border-red-500 text-red-500 bg-red-900/20' : 'border-cyber text-cyber bg-cyber/10') : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Shield size={20} strokeWidth={1.5} className={isLockdown ? 'animate-pulse' : ''} />
                <span className="text-[9px] font-mono tracking-wider font-medium">DÉFENSE</span>
            </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4">
             <button 
                onClick={() => setAutonomousMode(!autonomousMode)}
                className={`flex flex-col items-center gap-1 p-2 transition-all rounded-full border 
                ${autonomousMode 
                    ? 'border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                    : 'border-gray-700 text-gray-600 hover:border-gray-500'}`}
                title="Mode Autonome"
            >
                <RotateCcw size={18} strokeWidth={1.5} className={autonomousMode ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        
        {/* Top Bar Overlay */}
        <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-10 pointer-events-none">
             <div className="flex items-center gap-4 pointer-events-auto bg-black/40 backdrop-blur-md p-2 rounded border border-cyber-dim shadow-lg">
                <div className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-tight text-lg uppercase">Cyber Threat Consulting</span>
                    <span className="text-cyber text-xs border border-cyber px-1.5 py-0.5 rounded font-medium">V4.2</span>
                </div>
                <div className="h-4 w-[1px] bg-gray-700 mx-2"></div>
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className={status === AgentStatus.IDLE ? 'text-gray-500' : 'text-cyber animate-pulse'}>
                        {status}
                    </span>
                    {autonomousMode && <span className="text-green-500 font-bold">[AUTO]</span>}
                </div>
             </div>

             <div className="flex items-center gap-3 pointer-events-auto">
                <form onSubmit={handleScan} className="relative group">
                    <input 
                        type="text" 
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        placeholder="INITIALISER SCAN..."
                        className="bg-black/60 border border-cyber-dim text-white text-sm px-4 py-2 w-64 focus:w-80 transition-all outline-none focus:border-cyber rounded font-mono placeholder-gray-600 tracking-tight"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-cyber hover:text-white">
                        <Search size={16} strokeWidth={1.5} />
                    </button>
                </form>
             </div>
        </header>

        {/* View Switcher */}
        <div className="flex-1 relative">
            {activeView === 'MAP' && (
                <VoxelMap 
                    threats={filteredThreats} 
                    blips={blips}
                    selectedId={selectedThreatId}
                    onSelect={setSelectedThreatId}
                />
            )}
            {activeView === 'SYSTEM' && <SystemMonitor metrics={metrics} />}
            {activeView === 'FEED' && <NewsFeed articles={news} isLoading={isLoadingNews} onRefresh={fetchNewsManual} />}
            {activeView === 'DEFENSE' && <DefensePanel threats={threats} onLog={addLog} onLockdownToggle={setIsLockdown} isLockdown={isLockdown} />}
        </div>

        {/* Bottom Terminal & Details Panel */}
        <div className={`h-72 border-t border-cyber-dim bg-cyber-panel backdrop-blur-md flex z-20 transition-colors ${isLockdown ? 'border-red-800 bg-red-950/80' : ''}`}>
            {/* Left: Detail Panel / Threat Info */}
            <div className="w-1/3 border-r border-cyber-dim p-4 flex flex-col min-w-[350px]">
                {selectedThreat ? (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                                    <Target className="text-cyber" size={18} strokeWidth={2} />
                                    {selectedThreat.name}
                                </h3>
                                <div className="flex gap-2 text-[10px] font-mono mt-1 text-gray-400">
                                    <span>{selectedThreat.type}</span>
                                    <span>|</span>
                                    <span>{selectedThreat.coordinates?.[0].toFixed(4)}, {selectedThreat.coordinates?.[1].toFixed(4)}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedThreatId(null)} className="text-gray-500 hover:text-white">
                                <X size={16} strokeWidth={1.5} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar text-sm text-gray-300 leading-relaxed font-sans space-y-3 p-3 bg-black/20 rounded border border-white/5">
                            <p className="font-light">{selectedThreat.description}</p>
                            
                            {selectedThreat.details ? (
                                <div className="mt-4 space-y-4">
                                    <div className="p-3 bg-cyber/5 border-l-2 border-cyber rounded-r">
                                        <div className="text-[10px] text-cyber font-bold tracking-wider mb-1 uppercase">ANALYSE TECHNIQUE</div>
                                        <p className="text-xs font-light">{selectedThreat.details.technicalAnalysis}</p>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-orange-400 font-bold tracking-wider mb-2 uppercase">VECTEURS MITIGATION</div>
                                        <ul className="space-y-1">
                                            {selectedThreat.details.mitigationStrategies.map((s, i) => (
                                                <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                                    <span className="text-orange-500/50 mt-1">›</span> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 flex flex-col items-center justify-center p-6 border border-dashed border-gray-700 rounded gap-2 opacity-50">
                                    <FileCode size={24} strokeWidth={1} />
                                    <span className="text-xs tracking-widest font-mono">DONNÉES PROFONDES CRYPTÉES</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/10 flex justify-end">
                            <button 
                                onClick={handleDeepScan}
                                disabled={isDeepScanning || !!selectedThreat.details}
                                className="flex items-center gap-2 px-4 py-2 bg-cyber text-black font-semibold text-xs rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                            >
                                {isDeepScanning ? <Zap className="animate-spin" size={14} /> : <Eye size={14} />}
                                {selectedThreat.details ? 'ANALYSE COMPLÈTE' : isDeepScanning ? 'DÉCRYPTAGE...' : 'SCAN PROFOND'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 font-mono">
                        <Target size={48} strokeWidth={1} className="mb-4 opacity-20" />
                        <p className="tracking-widest text-xs">SÉLECTIONNEZ UNE CIBLE SUR LA GRILLE</p>
                    </div>
                )}
            </div>

            {/* Middle: Threat Feed List */}
            <div className="w-1/4 border-r border-cyber-dim flex flex-col bg-black/20">
                 <div className="p-3 border-b border-cyber-dim flex justify-between items-center bg-black/20">
                    <span className="text-xs font-bold text-cyber font-mono flex items-center gap-2 tracking-wide">
                        <Activity size={14} />
                        MENACES ({filteredThreats.length})
                    </span>
                    <div className="flex gap-1">
                        <button onClick={() => setFilterSeverity('ALL')} title="Tous" className={`p-1.5 rounded transition-all ${filterSeverity === 'ALL' ? 'bg-cyber/20 text-cyber' : 'text-gray-500 hover:text-gray-300'}`}><Filter size={14}/></button>
                        <button onClick={() => setFilterSeverity(ThreatLevel.CRITICAL)} title="Critique" className={`p-1.5 rounded transition-all ${filterSeverity === ThreatLevel.CRITICAL ? 'bg-red-500/20 text-red-500' : 'text-gray-500 hover:text-gray-300'}`}><AlertOctagon size={14}/></button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                     {filteredThreats.map(threat => (
                         <ThreatCard 
                            key={threat.id} 
                            threat={threat} 
                            isSelected={selectedThreatId === threat.id}
                            onSelect={() => setSelectedThreatId(threat.id)}
                         />
                     ))}
                     {filteredThreats.length === 0 && (
                         <div className="text-center p-8 text-xs text-gray-500 font-mono">
                             AUCUNE MENACE ACTIVE
                         </div>
                     )}
                 </div>
            </div>

            {/* Right: Terminal Logs */}
            <div className="flex-1 flex flex-col min-w-0 bg-black/40">
                <div className="absolute top-[-40px] right-4 flex gap-2">
                     <button 
                        onClick={handleExport}
                        className="bg-cyber-dark/80 backdrop-blur border border-cyber text-cyber px-4 py-1.5 rounded text-xs font-mono font-medium flex items-center gap-2 hover:bg-cyber/10 transition-colors shadow-lg"
                     >
                         <Download size={14} />
                         EXPORTER RAPPORT
                     </button>
                </div>
                <Terminal logs={logs} />
            </div>
        </div>

      </main>
    </div>
  );
}