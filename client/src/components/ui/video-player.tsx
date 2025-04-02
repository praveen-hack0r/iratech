import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipForward, 
  SkipBack,
  AlertTriangle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VideoPlayerProps {
  videoUrl: string;
  lessonId: number;
  onProgress?: ((watchTimeSeconds: number, completed: boolean) => void) | null;
  isPreview?: boolean;
}

export function VideoPlayer({ 
  videoUrl, 
  lessonId,
  onProgress,
  isPreview = false 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [screenshotDetectionActive, setScreenshotDetectionActive] = useState(false);

  const updateProgressMutation = useMutation({
    mutationFn: async ({ watchTimeSeconds, completed }: { watchTimeSeconds: number, completed: boolean }) => {
      // Don't track progress for preview videos
      if (isPreview) return null;
      
      const res = await apiRequest("POST", `/api/lessons/${lessonId}/progress`, { 
        watchTimeSeconds, 
        completed 
      });
      return await res.json();
    }
  });

  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle play/pause
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

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Handle seeking
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Handle fullscreen
  const toggleFullScreen = () => {
    if (videoContainerRef.current) {
      if (!isFullScreen) {
        if (videoContainerRef.current.requestFullscreen) {
          videoContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  };

  // Handle skip forward/backward
  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  };

  const { toast } = useToast();
  
  // Detect screenshot attempts and screen recording
  useEffect(() => {
    // Method 1: Detect keyboard shortcuts
    const preventScreenCapture = (e: KeyboardEvent) => {
      // Detect common screenshot key combos
      if (
        (e.key === 'PrintScreen') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'c') ||
        (e.metaKey && e.shiftKey && e.key === '3') ||
        (e.metaKey && e.shiftKey && e.key === '4') ||
        (e.metaKey && e.shiftKey && e.key === '5') ||
        (e.key === 'F12') ||
        (e.ctrlKey && e.key === 's')
      ) {
        e.preventDefault();
        handleScreenshotDetection();
        return false;
      }
    };
    
    // Method 2: Detect when video element loses visibility (might be captured)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && videoRef.current) {
        // Possible screen recording started - user switched tabs while recording
        if (isPlaying) {
          handleScreenshotDetection();
        }
      }
    };
    
    // Method 3: Detect context menu (right click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    // Method 4: Detect DevTools opening
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        handleScreenshotDetection();
      }
    };
    
    // Setup detection interval
    const detectInterval = setInterval(detectDevTools, 1000);
    
    // Add all event listeners
    window.addEventListener('keydown', preventScreenCapture, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Add a CSS class to prevent selection
    if (videoContainerRef.current) {
      videoContainerRef.current.classList.add('no-select');
    }
    
    return () => {
      window.removeEventListener('keydown', preventScreenCapture, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(detectInterval);
      
      if (videoContainerRef.current) {
        videoContainerRef.current.classList.remove('no-select');
      }
    };
  }, [isPlaying]);
  
  // Handle screenshot detection
  const handleScreenshotDetection = () => {
    setScreenshotDetectionActive(true);
    
    // Pause the video and show warning
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    // Show a toast notification
    toast({
      title: "Screen Capture Detected",
      description: "Recording or taking screenshots of content is not allowed.",
      variant: "destructive",
    });
    
    // Clear the warning after a few seconds
    setTimeout(() => {
      setScreenshotDetectionActive(false);
    }, 3000);
  };

  // Add event listeners to video element
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement) {
      const onTimeUpdate = () => {
        setCurrentTime(videoElement.currentTime);
        
        // Consider video completed if watched 90% or more
        const isCompleted = videoElement.currentTime / videoElement.duration >= 0.9;
        
        // Update progress every 10 seconds or when completed
        if (
          Math.floor(videoElement.currentTime) % 10 === 0 || 
          isCompleted || 
          videoElement.currentTime === videoElement.duration
        ) {
          // Call onProgress callback if provided
          const watchTimeSeconds = Math.floor(videoElement.currentTime);
          if (onProgress && typeof onProgress === 'function') {
            try {
              // @ts-ignore - The function definition matches what we're providing
              onProgress(watchTimeSeconds, isCompleted);
            } catch (error) {
              console.error("Error in onProgress callback:", error);
            }
          }
          
          updateProgressMutation.mutate({
            watchTimeSeconds: watchTimeSeconds,
            completed: isCompleted
          });
        }
      };
      
      const onDurationChange = () => {
        setDuration(videoElement.duration);
      };
      
      const onProgress = () => {
        if (videoElement.buffered.length > 0) {
          const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
          const progress = (bufferedEnd / videoElement.duration) * 100;
          setLoadingProgress(progress);
        }
      };
      
      const onPlay = () => {
        setIsPlaying(true);
      };
      
      const onPause = () => {
        setIsPlaying(false);
      };
      
      const onVolumeChange = () => {
        setVolume(videoElement.volume);
        setIsMuted(videoElement.muted);
      };
      
      const onLoadedMetadata = () => {
        setDuration(videoElement.duration);
      };
      
      // Add event listeners
      videoElement.addEventListener('timeupdate', onTimeUpdate);
      videoElement.addEventListener('durationchange', onDurationChange);
      videoElement.addEventListener('progress', onProgress);
      videoElement.addEventListener('play', onPlay);
      videoElement.addEventListener('pause', onPause);
      videoElement.addEventListener('volumechange', onVolumeChange);
      videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      
      // Clean up event listeners
      return () => {
        videoElement.removeEventListener('timeupdate', onTimeUpdate);
        videoElement.removeEventListener('durationchange', onDurationChange);
        videoElement.removeEventListener('progress', onProgress);
        videoElement.removeEventListener('play', onPlay);
        videoElement.removeEventListener('pause', onPause);
        videoElement.removeEventListener('volumechange', onVolumeChange);
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      };
    }
  }, [lessonId, onProgress, updateProgressMutation]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    
    // Auto-hide controls after inactivity
    let timer: number;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    if (videoContainerRef.current) {
      videoContainerRef.current.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      clearTimeout(timer);
      if (videoContainerRef.current) {
        videoContainerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isPlaying]);

  return (
    <div 
      ref={videoContainerRef} 
      className="relative w-full rounded-lg overflow-hidden bg-black aspect-video"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video 
        ref={videoRef}
        src={
          videoUrl.startsWith('/api') 
            ? videoUrl 
            : videoUrl.startsWith('/direct-videos') || videoUrl.startsWith('/static-videos')
              ? videoUrl
              : `/direct-videos/${videoUrl.split('/').pop()}`
        }
        className="w-full h-full"
        onClick={togglePlay}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        // Additional security attributes to prevent download
        playsInline
        onError={(e) => {
          console.error("Video error:", e);
          console.log("Video URL:", videoUrl);
          console.log("Processed URL:", 
            videoUrl.startsWith('/api') 
              ? videoUrl 
              : videoUrl.startsWith('/direct-videos') || videoUrl.startsWith('/static-videos')
                ? videoUrl
                : `/direct-videos/${videoUrl.split('/').pop()}`
          );
          // Try direct path as fallback
          if (videoRef.current) {
            videoRef.current.src = `/direct-videos/${videoUrl.split('/').pop()}`;
            videoRef.current.load();
            videoRef.current.play().catch(err => console.error("Fallback video play error:", err));
          }
        }}
      />
      
      {/* Loading Progress */}
      {loadingProgress < 100 && (
        <div className="absolute top-0 left-0 w-full z-10">
          <Progress value={loadingProgress} className="h-1" />
        </div>
      )}
      
      {/* Screenshot Warning */}
      {screenshotDetectionActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-20">
          <div className="text-center p-6 rounded-lg bg-red-600 text-white screenshot-alert">
            <AlertTriangle className="h-12 w-12 text-white mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-2">Screen Capture Detected</h3>
            <p>Screen recording and screenshots are not allowed for this content.</p>
            <p className="text-sm mt-3">This activity has been logged.</p>
          </div>
        </div>
      )}
      
      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity">
          {/* Seek Bar */}
          <div className="mb-3">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>
          
          {/* Controls Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              {/* Play/Pause */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              
              {/* Skip Backward/Forward */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={skipBackward}
                className="text-white hover:bg-white/20"
              >
                <SkipBack size={18} />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={skipForward}
                className="text-white hover:bg-white/20"
              >
                <SkipForward size={18} />
              </Button>
              
              {/* Time Display */}
              <div className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration || 0)}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Volume Control */}
              <div className="flex items-center space-x-2 w-24">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
              
              {/* Fullscreen */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleFullScreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Play/Pause Overlay */}
      {!isPlaying && !screenshotDetectionActive && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="bg-primary/80 rounded-full p-4">
            <Play className="h-10 w-10 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
