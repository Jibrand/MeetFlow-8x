import * as React from 'react';

export interface UseMediaPlayerOptions {
  src?: string;
  initialDuration: number;
  onTimeUpdate?: (time: number) => void;
}

export function useMediaPlayer({
  src,
  initialDuration,
  onTimeUpdate,
}: UseMediaPlayerOptions) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(initialDuration);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [volume, setVolumeState] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Initialize and sync audio ref
  React.useEffect(() => {
    if (!src) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(src);
    audioRef.current = audio;
    setIsLoading(true);
    setHasError(false);

    const onLoadedMetadata = () => {
      setIsLoading(false);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onAudioTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const onError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onAudioTimeUpdate);
    audio.addEventListener('error', onError);

    return () => {
      try {
        if (typeof audio.pause === 'function') {
          audio.pause();
        }
      } catch {
        // Ignore jsdom unmount error
      }
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onAudioTimeUpdate);
      audio.removeEventListener('error', onError);
    };
  }, [src]);

  // Simulated fallback timer when no audio file is attached (Archive mode)
  React.useEffect(() => {
    if (src || !isPlaying) return;

    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25 * playbackRate;
        if (next >= duration) {
          setIsPlaying(false);
          return 0;
        }
        onTimeUpdate?.(next);
        return next;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [src, isPlaying, playbackRate, duration, onTimeUpdate]);

  const play = React.useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch {
        // Autoplay policy or error
      }
    } else {
      setIsPlaying(true);
    }
  }, []);

  const pause = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    } else {
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = React.useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = React.useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, duration));
      if (audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
      setCurrentTime(clamped);
      onTimeUpdate?.(clamped);
    },
    [duration, onTimeUpdate]
  );

  const skip = React.useCallback(
    (deltaSeconds: number) => {
      seek(currentTime + deltaSeconds);
    },
    [currentTime, seek]
  );

  const setSpeed = React.useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const setVolume = React.useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(vol, 1));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = clamped === 0;
    }
    setIsMuted(clamped === 0);
  }, []);

  const toggleMute = React.useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.muted = true;
    }
  }, [isMuted]);

  return {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    isLoading,
    hasError,
    play,
    pause,
    togglePlay,
    seek,
    skip,
    setSpeed,
    setVolume,
    toggleMute,
    audioRef,
  };
}
