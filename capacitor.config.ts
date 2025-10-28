import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.autotask.tracker',
  appName: 'auto-task-time',
  webDir: 'dist',
  server: {
    url: 'https://70729249-c2c7-4449-97db-39afcc82cf8d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    }
  }
};

export default config;
