import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { capacitorStorage } from '@/lib/capacitorStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearData = async () => {
    if (confirm('This will delete all your local data (clients, vehicles, tasks). Are you sure?')) {
      try {
        await capacitorStorage.clearAll();
        window.location.reload();
      } catch (e) {
        console.error('Failed to clear data:', e);
        alert('Failed to clear data. Try clearing app data manually in device settings.');
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                The app encountered an unexpected error. This might be due to corrupted data.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-left">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={this.handleReload} className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Reload App
              </Button>
              
              <Button 
                onClick={this.handleClearData} 
                variant="outline" 
                className="w-full gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Reset Local Data
              </Button>
              
              <p className="text-xs text-muted-foreground">
                If reloading doesn't help, try "Reset Local Data" as a last resort.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}