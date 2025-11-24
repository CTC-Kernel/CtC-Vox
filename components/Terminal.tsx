import React, { useEffect, useRef } from 'react';
import { SystemLog } from '../types';

interface TerminalProps {
  logs: SystemLog[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col font-mono text-sm overflow-hidden p-2">
      <div className="flex items-center justify-between border-b border-cyber-dim pb-2 mb-2">
        <span className="text-cyber font-bold tracking-wider">JOURNAUX SYSTÈME // TTY-1</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 hover:bg-white/5 transition-colors p-1 rounded">
            <span className="text-gray-500 whitespace-nowrap">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
            <span className={`font-bold w-20 whitespace-nowrap ${
              log.status === 'ERROR' ? 'text-cyber-alert' :
              log.status === 'WARN' ? 'text-yellow-400' :
              log.status === 'SUCCESS' ? 'text-green-400' : 'text-cyber'
            }`}>
              {log.module}
            </span>
            <span className="text-gray-300 break-all">> {log.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default Terminal;