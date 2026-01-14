import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCloudSync } from '@/hooks/useCloudSync';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface CloudSyncIndicatorProps {
  onClick?: () => void;
}

export function CloudSyncIndicator({ onClick }: CloudSyncIndicatorProps) {
  const { status, isConnected, lastSyncDate, settings } = useCloudSync();
  
  // Don't show if not connected or not enabled
  if (!isConnected || !settings?.enabled) {
    return null;
  }
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };
  
  const getIcon = () => {
    if (status === 'syncing') {
      return <RefreshCw className="h-4 w-4 animate-spin text-primary" />;
    }
    if (status === 'error') {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    if (status === 'success' || lastSyncDate) {
      return <Cloud className="h-4 w-4 text-green-500" />;
    }
    return <Cloud className="h-4 w-4 text-muted-foreground" />;
  };
  
  const getTooltipText = () => {
    if (status === 'syncing') return 'Syncing to Google Drive...';
    if (status === 'error') return 'Sync failed - tap for details';
    if (lastSyncDate) return `Synced ${formatTime(lastSyncDate)}`;
    return 'Cloud sync enabled';
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={onClick}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Cloud sync status"
          >
            {getIcon()}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
