interface TimeframeSelectorProps {
  selectedTimeframe: number;
  onSelectTimeframe: (seconds: number) => void;
}

const timeframes = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
];

const TimeframeSelector = ({ selectedTimeframe, onSelectTimeframe }: TimeframeSelectorProps) => {
  return (
    <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
      {timeframes.map((tf) => (
        <button
          key={tf.value}
          onClick={() => onSelectTimeframe(tf.value)}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold text-[10px] sm:text-xs transition-all whitespace-nowrap ${
            selectedTimeframe === tf.value
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
};

export default TimeframeSelector;
