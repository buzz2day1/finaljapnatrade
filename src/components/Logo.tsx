import { TrendingUp } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizes = {
    sm: { icon: 20, text: "text-lg" },
    md: { icon: 28, text: "text-2xl" },
    lg: { icon: 40, text: "text-4xl" },
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
        <div className="relative bg-gradient-gold p-2 rounded-xl glow-gold">
          <TrendingUp size={sizes[size].icon} className="text-background" strokeWidth={2.5} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${sizes[size].text} font-black tracking-tight text-gradient-gold`}>
            ApnaTrade
          </span>
          {size === "lg" && (
            <span className="text-xs text-muted-foreground tracking-widest uppercase">
              Trade Smart, Win Big
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
