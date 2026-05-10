import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
import { useFakeSocialProof, SocialProofMessage } from '@/hooks/useFakeSocialProof';

interface LiveOrderBookProps {
  className?: string;
}

const LiveOrderBook = ({ className = '' }: LiveOrderBookProps) => {
  const messages = useFakeSocialProof();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages]);

  const getMessageIcon = (type: SocialProofMessage['type']) => {
    switch (type) {
      case 'bet':
        return <Target size={12} className="text-primary" />;
      case 'win':
        return <TrendingUp size={12} className="text-profit" />;
      case 'loss':
        return <TrendingDown size={12} className="text-loss" />;
      default:
        return null;
    }
  };

  const getMessageColor = (type: SocialProofMessage['type']) => {
    switch (type) {
      case 'bet':
        return 'text-primary';
      case 'win':
        return 'text-profit';
      case 'loss':
        return 'text-loss';
      default:
        return 'text-muted-foreground';
    }
  };

  const getMessageBg = (type: SocialProofMessage['type']) => {
    switch (type) {
      case 'bet':
        return 'bg-primary/5 border-primary/20';
      case 'win':
        return 'bg-profit/5 border-profit/20';
      case 'loss':
        return 'bg-loss/5 border-loss/20';
      default:
        return 'bg-secondary/30 border-border/50';
    }
  };

  return (
    <div className={`bg-background/60 backdrop-blur-sm rounded-lg p-3 border border-border/50 ${className}`}>
      {/* Header with pulsing Live indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 bg-profit rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-profit rounded-full animate-ping"></div>
          </div>
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Live Activity
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Activity size={10} className="text-profit" />
          <span>{messages.length} updates</span>
        </div>
      </div>

      {/* Messages feed */}
      <div
        ref={scrollRef}
        className="space-y-1.5 max-h-52 overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)'
        }}
      >
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex items-center gap-2 p-2 rounded-md border transition-all ${getMessageBg(message.type)} ${
              index === 0 ? 'animate-in slide-in-from-top-2 duration-300' : ''
            }`}
          >
            <div className="flex-shrink-0">
              {getMessageIcon(message.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
                  {message.userName}
                </span>
                <span className={`text-xs font-medium ${getMessageColor(message.type)}`}>
                  {message.action}
                </span>
              </div>
            </div>
            {message.type === 'win' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-profit/20 text-profit rounded font-medium">
                +85%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <span className="inline-block w-1.5 h-1.5 bg-profit rounded-full animate-pulse"></span>
        <span>Real-time trading activity</span>
      </div>
    </div>
  );
};

export default LiveOrderBook;
