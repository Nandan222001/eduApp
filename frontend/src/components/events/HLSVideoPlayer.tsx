import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Slider,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';

interface HLSVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const HLSVideoPlayer: React.FC<HLSVideoPlayerProps> = ({
  src,
  poster,
  autoPlay = false,
  onTimeUpdate,
  onEnded,
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (src.includes('.m3u8')) {
      if ('Hls' in window) {
        const Hls = (
          window as unknown as {
            Hls: {
              isSupported: () => boolean;
              new (config?: object): {
                loadSource: (src: string) => void;
                attachMedia: (video: HTMLVideoElement) => void;
                on: (event: string, callback: () => void) => void;
                destroy: () => void;
              };
              Events: { MANIFEST_PARSED: string };
            };
          }
        ).Hls;
        if (Hls && Hls.isSupported && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (autoPlay) {
              video.play();
            }
          });
          return () => {
            hls.destroy();
          };
        }
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        setIsLoading(false);
      }
    } else {
      video.src = src;
      setIsLoading(false);
    }
  }, [src, autoPlay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(total);
      onTimeUpdate?.(current, total);
    }
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    if (videoRef.current) {
      const newTime = value as number;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    if (videoRef.current) {
      const newVolume = (value as number) / 100;
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper
      ref={containerRef}
      sx={{
        position: 'relative',
        bgcolor: 'black',
        overflow: 'hidden',
        borderRadius: 2,
        '&:hover .controls': {
          opacity: 1,
        },
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
    >
      <video
        ref={videoRef}
        poster={poster}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onLoadedMetadata={handleTimeUpdate}
        onClick={togglePlay}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      />

      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <Box
        className="controls"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: `linear-gradient(to top, ${alpha('#000', 0.8)}, transparent)`,
          p: 2,
          transition: 'opacity 0.3s',
          opacity: showControls ? 1 : 0,
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Slider
            value={currentTime}
            max={duration || 100}
            onChange={handleSeek}
            sx={{
              color: theme.palette.primary.main,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
              },
              '& .MuiSlider-track': {
                height: 4,
              },
              '& .MuiSlider-rail': {
                height: 4,
                opacity: 0.3,
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={togglePlay} sx={{ color: 'white' }} size="small">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>

          <Typography variant="caption" sx={{ color: 'white', minWidth: 100 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <IconButton onClick={toggleMute} sx={{ color: 'white' }} size="small">
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            <Slider
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolumeChange}
              sx={{
                width: 80,
                color: 'white',
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                },
              }}
            />
          </Box>

          <Box sx={{ flex: 1 }} />

          <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }} size="small">
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default HLSVideoPlayer;
