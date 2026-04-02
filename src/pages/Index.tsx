import { useState, useEffect, useCallback } from 'react';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { VoiceButton } from '@/components/VoiceButton';
import { ContactCenterHeader } from '@/components/ContactCenterHeader';
import { EscalationDialog } from '@/components/EscalationDialog';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [showEscalation, setShowEscalation] = useState(false);

  const {
    isConnected,
    isConnecting,
    isSpeaking,
    error,
    roomName,
    startSession,
    endSession,
  } = useVoiceSession();

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Voice Error",
        description: error,
      });
    }
  }, [error, toast]);

  const handleVoiceButtonClick = useCallback(() => {
    if (isConnected) {
      // Already connected - clicking again does nothing (use End button)
      return;
    }
    startSession();
  }, [isConnected, startSession]);

  const handleEscalate = useCallback(() => {
    setShowEscalation(true);
  }, []);

  const handleEndCall = useCallback(() => {
    endSession();
    toast({
      title: "Call Ended",
      description: "The voice session has been disconnected.",
    });
  }, [endSession, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ContactCenterHeader
        isConnected={isConnected}
        sessionId={roomName}
        onEscalate={handleEscalate}
        onEndCall={handleEndCall}
        isLoading={isConnecting}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 flex items-center justify-center">
        {/* Voice Control Panel */}
        <div className="flex flex-col items-center justify-center p-8 glass rounded-2xl w-full max-w-lg">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gradient mb-2">
              AI Voice Assistant
            </h2>
            <p className="text-muted-foreground">
              {isConnected 
                ? "You're connected. Speak naturally to the agent." 
                : "Tap the button to start a voice call"}
            </p>
          </div>

          <VoiceButton
            isListening={isConnected && !isSpeaking}
            isSpeaking={isSpeaking}
            isLoading={isConnecting}
            onClick={handleVoiceButtonClick}
            disabled={isConnecting}
          />

          {isConnected && (
            <p className="mt-6 text-xs text-muted-foreground text-center">
              🎙️ Your microphone is live. The agent can hear you.
            </p>
          )}
        </div>
      </main>

      <EscalationDialog
        open={showEscalation}
        onOpenChange={setShowEscalation}
        sessionId={roomName}
      />

      {/* Footer */}
      <footer className="glass border-t border-border/50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>Powered by Lyzr AI</span>
          <span>© 2024 Contact Center</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
