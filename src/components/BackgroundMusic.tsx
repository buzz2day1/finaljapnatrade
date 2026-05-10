import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "musicButtonPosition";
const PLAYING_KEY = "musicPlaying";

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(() => {
    const saved = localStorage.getItem(PLAYING_KEY);
    return saved === "true";
  });
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { x: 20, y: 100 };
      }
    }
    return { x: 20, y: 100 };
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/audio/background-music.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    // Try to autoplay if was playing before
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked, user needs to click
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
    
    localStorage.setItem(PLAYING_KEY, String(isPlaying));
  }, [isPlaying]);

  // Save position
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    hasMoved.current = false;
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const button = buttonRef.current;
    if (!button) return;

    const touch = e.touches[0];
    const rect = button.getBoundingClientRect();
    dragOffset.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    hasMoved.current = false;
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      hasMoved.current = true;
      const newX = Math.max(0, Math.min(window.innerWidth - 48, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      hasMoved.current = true;
      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(window.innerWidth - 48, touch.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 48, touch.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  const handleClick = () => {
    // Only toggle if we didn't drag
    if (!hasMoved.current) {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className={`fixed z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
        isPlaying
          ? "bg-primary text-primary-foreground glow-gold"
          : "bg-card border border-border text-muted-foreground hover:text-foreground"
      } ${isDragging ? "scale-110 cursor-grabbing" : "cursor-grab hover:scale-105"}`}
      style={{
        left: position.x,
        top: position.y,
        touchAction: "none",
      }}
      title={isPlaying ? "Mute Music" : "Play Music"}
    >
      {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
  );
};

export default BackgroundMusic;
