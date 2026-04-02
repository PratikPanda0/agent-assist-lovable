import { useState, useCallback, useRef, useEffect } from 'react';
import { Room, RoomEvent, Track, RemoteTrackPublication, RemoteTrack, ConnectionState } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';

interface UseVoiceSessionReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  error: string | null;
  roomName: string | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
}

export const useVoiceSession = (): UseVoiceSessionReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);

  const monitorAudio = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const check = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setIsSpeaking(avg > 10);
        animFrameRef.current = requestAnimationFrame(check);
      };
      check();
    } catch (e) {
      console.error('Audio monitoring error:', e);
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsSpeaking(false);
  }, []);

  const startSession = useCallback(async () => {
    // Prevent multiple concurrent sessions
    if (sessionActiveRef.current || isConnecting) {
      console.log('Session already active or connecting, skipping');
      return;
    }

    setError(null);
    setIsConnecting(true);
    sessionActiveRef.current = true;

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('voice-session', {
        body: { action: 'start' },
      });

      if (invokeError) throw new Error(invokeError.message);
      if (data?.error) throw new Error(data.error);

      console.log('Voice session started:', data);

      const serverUrl = data.livekitUrl || data.serverUrl || data.url;
      const token = data.userToken || data.token;
      const room_name = data.roomName;

      if (!serverUrl || !token) {
        throw new Error('Missing serverUrl or token in response');
      }

      setRoomName(room_name);

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication) => {
        if (track.kind === Track.Kind.Audio) {
          console.log('Agent audio track subscribed');
          // attach() creates an <audio> element and starts playback
          const element = track.attach();
          element.id = 'agent-audio-' + Date.now();
          element.style.display = 'none';
          document.body.appendChild(element);

          // Monitor audio levels for UI feedback
          try {
            const audioTracks = track.mediaStream?.getAudioTracks();
            if (audioTracks && audioTracks.length > 0) {
              const stream = new MediaStream([audioTracks[0]]);
              monitorAudio(stream);
            }
          } catch (e) {
            console.warn('Could not monitor agent audio levels:', e);
          }
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          track.detach().forEach(el => el.remove());
          cleanupAudio();
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room');
        setIsConnected(false);
        sessionActiveRef.current = false;
        cleanupAudio();
        // Clean up any remaining audio elements
        document.querySelectorAll('[id^="agent-audio-"]').forEach(el => el.remove());
      });

      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        console.log('Connection state:', state);
      });

      await room.connect(serverUrl, token);
      console.log('Connected to LiveKit room');

      await room.localParticipant.setMicrophoneEnabled(true);
      console.log('Microphone enabled');

      setIsConnected(true);
    } catch (err) {
      console.error('Failed to start voice session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voice session');
      sessionActiveRef.current = false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, monitorAudio, cleanupAudio]);

  const endSession = useCallback(async () => {
    try {
      // Disconnect from LiveKit first
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }

      cleanupAudio();
      // Clean up any remaining audio elements
      document.querySelectorAll('[id^="agent-audio-"]').forEach(el => el.remove());

      // Notify backend to end the session on the server side
      if (roomName) {
        try {
          await supabase.functions.invoke('voice-session', {
            body: { action: 'end', roomName },
          });
          console.log('Voice session ended on server');
        } catch (endErr) {
          console.warn('Failed to end session on server:', endErr);
        }
      }

      setIsConnected(false);
      setRoomName(null);
      setError(null);
      sessionActiveRef.current = false;
    } catch (err) {
      console.error('Failed to end session:', err);
      sessionActiveRef.current = false;
    }
  }, [roomName, cleanupAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      cleanupAudio();
      sessionActiveRef.current = false;
      document.querySelectorAll('[id^="agent-audio-"]').forEach(el => el.remove());
    };
  }, [cleanupAudio]);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    error,
    roomName,
    startSession,
    endSession,
  };
};
