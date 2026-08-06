interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const colorMap = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  accent: 'bg-accent-500',
};

export default function ProgressBar({ value, max = 100, color = 'primary', size = 'md', showLabel = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className="w-full">
      <div className={`w-full ${height} bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${colorMap[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{pct}%</span>
        </div>
      )}
    </div>
  );
}
