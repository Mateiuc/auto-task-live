import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { backupManager } from '@/lib/backupManager';
import { useBackupSettings } from '@/hooks/useBackupSettings';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Download, FileText, Calendar, ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Capacitor } from '@capacitor/core';
import { Alert, AlertDescription } from './ui/alert';

interface BackupViewProps {
  onBack: () => void;
}

export function BackupView({ onBack }: BackupViewProps) {
  const { backupSettings, setBackupSettings } = useBackupSettings();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backups, setBackups] = useState<Array<{ name: string; created: Date }>>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [exportingLatest, setExportingLatest] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const files = await backupManager.listLocalBackups();
      setBackups(files);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await backupManager.exportBackup();
      loadBackups();
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await backupManager.importBackup();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to restore backup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const handleAutoBackupToggle = async (enabled: boolean) => {
    try {
      await setBackupSettings({ autoBackupEnabled: enabled });
      toast({
        title: enabled ? "Auto-Backup Enabled" : "Auto-Backup Disabled",
        description: enabled 
          ? "Daily backups will be created automatically and kept for one week."
          : "Auto-backup has been disabled.",
      });
    } catch (error) {
      toast({
        title: "Settings Error",
        description: "Failed to update auto-backup settings.",
        variant: "destructive"
      });
    }
  };

  const handleExportLatest = async () => {
    setExportingLatest(true);
    try {
      await backupManager.exportLatestAutoBackup();
      toast({
        title: "Backup Exported",
        description: "Latest auto-backup has been shared.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export latest backup.",
        variant: "destructive"
      });
    } finally {
      setExportingLatest(false);
    }
  };

  const isWeb = Capacitor.getPlatform() === 'web';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Backup & Restore</h2>
      </div>

      {/* Auto-Backup Toggle */}
      {!isWeb && (
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-backup" className="text-base font-semibold">
                Daily Auto-Backup
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup every 24 hours and keep for one week
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={backupSettings.autoBackupEnabled || false}
              onCheckedChange={handleAutoBackupToggle}
            />
          </div>

          {/* Backup Status */}
          {backupSettings.lastBackupStatus && (
            <Alert variant={backupSettings.lastBackupStatus === 'failed' ? 'destructive' : 'default'}>
              {backupSettings.lastBackupStatus === 'failed' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertDescription>
                {backupSettings.lastBackupStatus === 'failed' 
                  ? 'Last auto-backup failed. You will receive a notification when backup fails.'
                  : 'Auto-backups are working correctly'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          {isWeb ? (
            <>Export your data as an XML file to save it on your computer. Import a backup file to restore your data.</>
          ) : (
            <>
              <strong>Manual Export:</strong> Creates a new backup and lets you save it anywhere.<br/>
              <strong>Export Latest Auto-Backup:</strong> Share your most recent daily auto-backup to Google Drive or other locations.<br/>
              Auto-backups are kept for 7 days in your device's Documents folder.
            </>
          )}
        </p>
      </div>

      {/* Export & Import Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button onClick={handleExport} disabled={exporting} size="lg" className="h-24">
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Creating Backup...
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6" />
              <span>Export Backup</span>
            </div>
          )}
        </Button>

        <Button onClick={handleImport} disabled={importing} variant="outline" size="lg" className="h-24">
          {importing ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Restoring...
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <span>Import Backup</span>
            </div>
          )}
        </Button>
      </div>

      {/* Export Latest Auto-Backup (Mobile Only) */}
      {!isWeb && backupSettings.autoBackupEnabled && backups.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <Label className="text-base font-semibold">Quick Access</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Export your most recent auto-backup ({formatDate(backups[0].created)})
            </p>
          </div>
          <Button 
            onClick={handleExportLatest} 
            disabled={exportingLatest}
            variant="secondary"
            className="w-full"
          >
            {exportingLatest ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting Latest Backup...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Export Latest Auto-Backup
              </>
            )}
          </Button>
        </div>
      )}

      {/* Last Backup Date */}
      {backupSettings.lastBackupDate && (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Last backup: {formatDate(new Date(backupSettings.lastBackupDate))}
          </p>
        </div>
      )}

      {/* Recent Backups (Mobile Only) */}
      {!isWeb && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Recent Backups in Documents</Label>
            <Button variant="outline" size="sm" onClick={loadBackups} disabled={loadingBackups}>
              {loadingBackups ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>

          <ScrollArea className="h-[200px] rounded-md border">
            <div className="p-4 space-y-2">
              {backups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No backups found in Documents folder
                </p>
              ) : (
                backups.map((backup, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{backup.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(backup.created)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <p className="text-xs text-muted-foreground">
            Backups are automatically created daily and stored here for 7 days. Use "Export Latest Auto-Backup" above for quick access.
          </p>
        </div>
      )}
    </div>
  );
}
