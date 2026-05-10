import { useEffect, useState } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleHoverStart = () => setIsHovering(true);
    const handleHoverEnd = () => setIsHovering(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Add hover listeners to interactive elements
    const interactiveElements = document.querySelectorAll("button, a, input, [role='button']");
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleHoverStart);
      el.addEventListener("mouseleave", handleHoverEnd);
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleHoverStart);
        el.removeEventListener("mouseleave", handleHoverEnd);
      });
    };
  }, []);

  // Only show custom cursor on desktop
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  if (isMobile) return null;

  return (
    <>
      <div
        className="cursor-dot"
        style={{
          left: position.x - 4,
          top: position.y - 4,
          opacity: isVisible ? 1 : 0,
          transform: isHovering ? "scale(1.5)" : "scale(1)",
        }}
      />
      <div
        className={`cursor-ring ${isHovering ? "hover" : ""}`}
        style={{
          left: position.x - 16,
          top: position.y - 16,
          opacity: isVisible ? 1 : 0,
        }}
      />
    </>
  );
};

export default CustomCursor;
