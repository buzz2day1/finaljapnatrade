import { useState, useCallback, TouchEvent } from 'react';

interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
}

const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50
}: SwipeGestureConfig) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, minSwipeDistance, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeIndicator: touchStart && touchEnd ? touchStart - touchEnd : 0
  };
};

export default useSwipeGesture;
