import { useState, useEffect } from 'react';
import { capacitorStorage } from '@/lib/capacitorStorage';
import { BackupSettings } from '@/types';
import { autoBackupService } from '@/services/autoBackupService';

const defaultBackupSettings: BackupSettings = {
  autoBackupEnabled: false
};

export function useBackupSettings() {
  const [backupSettings, setBackupSettingsState] = useState<BackupSettings>(defaultBackupSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBackupSettings();
  }, []);

  const loadBackupSettings = async () => {
    try {
      const settings = await capacitorStorage.getSettings();
      setBackupSettingsState(settings.backup || defaultBackupSettings);
    } catch (error) {
      console.error('Failed to load backup settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setBackupSettings = async (newBackupSettings: Partial<BackupSettings>) => {
    try {
      const settings = await capacitorStorage.getSettings();
      const updated = {
        ...settings,
        backup: {
          ...defaultBackupSettings,
          ...settings.backup,
          ...newBackupSettings
        }
      };
      await capacitorStorage.setSettings(updated);
      setBackupSettingsState(updated.backup!);

      // Start/stop auto-backup service based on setting
      if (newBackupSettings.autoBackupEnabled !== undefined) {
        if (newBackupSettings.autoBackupEnabled) {
          await autoBackupService.start();
        } else {
          await autoBackupService.stop();
        }
      }
    } catch (error) {
      console.error('Failed to save backup settings:', error);
      throw error;
    }
  };

  return {
    backupSettings,
    setBackupSettings,
    loading
  };
}
