import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceWaveformProps {
  isActive: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export const VoiceWaveform = ({ isActive, isSpeaking = false, className }: VoiceWaveformProps) => {
  const [bars, setBars] = useState<number[]>(new Array(12).fill(0.3));

  useEffect(() => {
    if (!isActive && !isSpeaking) {
      setBars(new Array(12).fill(0.3));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => 
        prev.map(() => 
          isSpeaking 
            ? 0.3 + Math.random() * 0.7  // More active for speaking
            : 0.2 + Math.random() * 0.5  // Subtle for listening
        )
      );
    }, isSpeaking ? 80 : 120);

    return () => clearInterval(interval);
  }, [isActive, isSpeaking]);

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={cn(
            "w-1 rounded-full transition-all duration-100",
            isActive || isSpeaking 
              ? isSpeaking 
                ? "bg-accent" 
                : "bg-primary"
              : "bg-muted-foreground/30"
          )}
          style={{
            height: `${height * 40}px`,
            opacity: isActive || isSpeaking ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
};