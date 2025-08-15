import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ProcessingProgress {
  processed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  averageTimePerLead: number;
  estimatedTimeRemaining: number;
  errors: number;
  retries: number;
}

interface ProgressIndicatorProps {
  progress?: ProcessingProgress;
  stage: 'parsing' | 'processing' | 'completed';
  className?: string;
}

const defaultProgress: ProcessingProgress = {
  processed: 0,
  total: 100,
  currentBatch: 0,
  totalBatches: 0,
  averageTimePerLead: 0,
  estimatedTimeRemaining: 0,
  errors: 0,
  retries: 0
};

export function ProcessingProgressIndicator({ progress = defaultProgress, stage, className }: ProgressIndicatorProps) {
  const safeProgress = { ...defaultProgress, ...progress };
  const percentage = safeProgress.total > 0 ? Math.round((safeProgress.processed / safeProgress.total) * 100) : 0;
  
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  return (
    <div className={cn("space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border", className)} data-testid="progress-indicator">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Spinner size="sm" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {stage === 'parsing' ? 'Parsing CSV...' : 
             stage === 'processing' ? 'Processing Leads...' : 'Complete!'}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {percentage}%
        </span>
      </div>

      <Progress value={percentage} className="w-full" data-testid="progress-bar" />

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Progress:</span> {safeProgress.processed}/{safeProgress.total} leads
        </div>
        <div>
          <span className="font-medium">Batch:</span> {safeProgress.currentBatch}/{safeProgress.totalBatches}
        </div>
        <div>
          <span className="font-medium">Avg Time:</span> {formatTime(safeProgress.averageTimePerLead)}
        </div>
        <div>
          <span className="font-medium">Time Left:</span> {formatTime(safeProgress.estimatedTimeRemaining)}
        </div>
      </div>

      {(safeProgress.errors > 0 || safeProgress.retries > 0) && (
        <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
          {safeProgress.errors > 0 && (
            <span className="text-amber-600 dark:text-amber-400" data-testid="error-count">
              ⚠️ {safeProgress.errors} errors (using fallback)
            </span>
          )}
          {safeProgress.retries > 0 && (
            <span className="text-blue-600 dark:text-blue-400" data-testid="retry-count">
              🔄 {safeProgress.retries} retries
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Keep backward compatibility
export { ProcessingProgressIndicator as ProgressIndicator };