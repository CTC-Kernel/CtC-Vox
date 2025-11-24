import React from 'react';
import { NewsArticle } from '../types';
import { ExternalLink, Clock, Radio } from 'lucide-react';

interface NewsFeedProps {
  articles: NewsArticle[];
  isLoading: boolean;
  onRefresh: () => void;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ articles, isLoading, onRefresh }) => {
  return (
    <div className="flex-1 flex flex-col bg-black/90 h-full overflow-hidden p-8 relative">
      <div className="flex justify-between items-center mb-8 border-b border-cyber-dim pb-4">
        <h2 className="text-3xl font-bold text-white flex items-center gap-4 tracking-tight">
          <Radio className="text-cyber animate-pulse" size={28} />
          FLUX DE RENSEIGNEMENT
        </h2>
        <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="px-5 py-2 border border-cyber text-cyber hover:bg-cyber/10 rounded-md text-xs font-bold tracking-widest disabled:opacity-50 transition-all uppercase"
        >
            {isLoading ? 'SYNC EN COURS...' : 'ACTUALISER'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pb-20">
        {articles.length === 0 && !isLoading && (
            <div className="col-span-full text-center text-gray-500 font-mono py-20 tracking-wide text-sm">
                AUCUN SIGNAL DÉTECTÉ. INITIALISEZ ACTUALISATION.
            </div>
        )}
        
        {articles.map((article) => (
          <div key={article.id} className="bg-cyber-panel/50 border border-cyber-dim p-6 rounded-lg hover:border-cyber/50 transition-all group hover:bg-cyber-panel/80">
            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] text-cyber font-bold tracking-wider px-2 py-1 border border-cyber/20 rounded bg-cyber/5 uppercase">
                    {article.source}
                </span>
                <span className="text-gray-500 text-[11px] font-mono flex items-center gap-1.5">
                    <Clock size={12} />
                    {article.publishedDate}
                </span>
            </div>
            <h3 className="text-lg text-white font-semibold mb-3 group-hover:text-cyber transition-colors leading-snug tracking-tight">
                {article.title}
            </h3>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed font-sans font-light">
                {article.summary}
            </p>
            <div className="flex justify-end pt-2 border-t border-white/5">
                <a 
                    href={article.url || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs font-medium text-cyber hover:text-white transition-colors uppercase tracking-wide"
                >
                    LIRE LA SOURCE <ExternalLink size={12} />
                </a>
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="animate-pulse space-y-4 col-span-full">
                {[1,2,3].map(i => (
                    <div key={i} className="h-32 bg-cyber-dim/10 rounded border border-cyber-dim/20"></div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;