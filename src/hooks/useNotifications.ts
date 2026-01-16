import { useToast } from './use-toast';
import { useSettings } from './useStorage';

export function useNotifications() {
  const { toast: originalToast, ...rest } = useToast();
  const { settings } = useSettings();
  
  const toast = (options: Parameters<typeof originalToast>[0]) => {
    // Only show toast if notifications are enabled (default: true)
    if (settings?.notificationsEnabled !== false) {
      return originalToast(options);
    }
    // Return a mock object for compatibility
    return { id: '', dismiss: () => {}, update: () => {} };
  };
  
  return { toast, ...rest };
}
