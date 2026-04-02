import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isEscalation?: boolean;
}

interface TranscriptPanelProps {
  messages: Message[];
  interimTranscript: string;
}

export const TranscriptPanel = ({ messages, interimTranscript }: TranscriptPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  return (
    <div className="flex flex-col h-full glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">Live Transcript</h2>
          <p className="text-xs text-muted-foreground">
            {messages.length} messages
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && !interimTranscript && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Start speaking to begin the conversation
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              isEscalation={message.isEscalation}
            />
          ))}

          {/* Interim transcript (what's being said right now) */}
          {interimTranscript && (
            <div className="flex gap-3 flex-row-reverse animate-fade-in opacity-60">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">...</span>
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 bg-primary/10 border border-primary/20">
                <p className="text-sm italic">{interimTranscript}</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};