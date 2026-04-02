import { Phone, PhoneOff, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContactCenterHeaderProps {
  isConnected: boolean;
  sessionId: string | null;
  onEscalate: () => void;
  onEndCall: () => void;
  isLoading: boolean;
}

export const ContactCenterHeader = ({
  isConnected,
  sessionId,
  onEscalate,
  onEndCall,
  isLoading,
}: ContactCenterHeaderProps) => {
  return (
    <header className="glass border-b border-border/50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isConnected 
                ? "gradient-primary glow-primary" 
                : "bg-muted"
            )}>
              <Phone className={cn(
                "w-5 h-5",
                isConnected ? "text-primary-foreground" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h1 className="font-bold text-lg">Contact Center</h1>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-success animate-pulse" : "bg-muted-foreground"
                )} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {sessionId && (
            <div className="hidden md:block px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
              Session: {sessionId.slice(-8)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onEscalate}
            disabled={!isConnected || isLoading}
            className="gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Escalate</span>
          </Button>

          {isConnected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onEndCall}
              className="gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">End</span>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};