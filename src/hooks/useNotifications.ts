import { useToast } from './use-toast';
import { capacitorStorage } from '@/lib/capacitorStorage';

export function useNotifications() {
  const { toast: originalToast, ...rest } = useToast();
  
  const toast = async (options: Parameters<typeof originalToast>[0]) => {
    // Check settings at toast-time to avoid race conditions
    const settings = await capacitorStorage.getSettings();
    if (settings?.notificationsEnabled !== false) {
      return originalToast(options);
    }
    // Return a mock object for compatibility
    return { id: '', dismiss: () => {}, update: () => {} };
  };
  
  return { toast, ...rest };
}
