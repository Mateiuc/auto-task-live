import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.autotask.tracker',
  appName: 'auto-task-time',
  webDir: 'dist',
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
