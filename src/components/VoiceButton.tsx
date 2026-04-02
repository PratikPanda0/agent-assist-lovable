import { cn } from '@/lib/utils';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { VoiceWaveform } from './VoiceWaveform';

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const VoiceButton = ({ 
  isListening, 
  isSpeaking, 
  isLoading,
  onClick, 
  disabled 
}: VoiceButtonProps) => {
  const isActive = isListening || isSpeaking;

  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* Animated rings */}
      {isActive && (
        <>
          <div 
            className={cn(
              "absolute w-40 h-40 rounded-full animate-pulse-ring",
              isListening ? "bg-primary/10" : "bg-accent/10"
            )} 
          />
          <div 
            className={cn(
              "absolute w-52 h-52 rounded-full animate-pulse-ring",
              isListening ? "bg-primary/5" : "bg-accent/5"
            )} 
            style={{ animationDelay: '0.5s' }}
          />
        </>
      )}

      {/* Main button */}
      <button
        onClick={onClick}
        disabled={disabled || isLoading || isSpeaking}
        className={cn(
          "relative w-32 h-32 rounded-full flex items-center justify-center",
          "transition-all duration-300 transform",
          "focus:outline-none focus:ring-4 focus:ring-primary/30",
          isListening 
            ? "gradient-primary glow-primary scale-110" 
            : isSpeaking
              ? "bg-accent glow-accent"
              : "glass hover:scale-105",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        {isSpeaking ? (
          <Volume2 className="w-12 h-12 text-accent-foreground animate-pulse" />
        ) : isListening ? (
          <Mic className="w-12 h-12 text-primary-foreground" />
        ) : (
          <MicOff className="w-12 h-12 text-muted-foreground" />
        )}
      </button>

      {/* Waveform visualization */}
      <VoiceWaveform 
        isActive={isListening} 
        isSpeaking={isSpeaking}
        className="h-12"
      />

      {/* Status text */}
      <p className={cn(
        "text-sm font-medium transition-colors",
        isListening 
          ? "text-primary" 
          : isSpeaking 
            ? "text-accent"
            : "text-muted-foreground"
      )}>
        {isLoading 
          ? "Processing..." 
          : isSpeaking 
            ? "Speaking..." 
            : isListening 
              ? "Listening..." 
              : "Tap to speak"}
      </p>
    </div>
  );
};