import { cn } from '@/lib/utils';
import { User, Bot, AlertTriangle } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isEscalation?: boolean;
}

export const ChatMessage = ({ role, content, timestamp, isEscalation }: ChatMessageProps) => {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : isSystem 
              ? "bg-warning text-warning-foreground"
              : "bg-accent text-accent-foreground"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5" />
        ) : isSystem ? (
          <AlertTriangle className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3",
          isUser 
            ? "rounded-tr-sm bg-primary text-primary-foreground" 
            : isSystem
              ? "rounded-tl-sm bg-warning/20 border border-warning/40 text-foreground"
              : "rounded-tl-sm bg-secondary text-secondary-foreground",
          isEscalation && "border-2 border-warning"
        )}
      >
        {isEscalation && (
          <div className="flex items-center gap-2 text-xs mb-2 opacity-80">
            <AlertTriangle className="w-3 h-3" />
            <span>Escalation Request</span>
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        <p className={cn(
          "text-xs mt-2",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};