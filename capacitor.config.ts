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
  /*
   * IMPORTANT: Android Permissions Required
   * 
   * The following permissions must be manually added to AndroidManifest.xml
   * (android/app/src/main/AndroidManifest.xml) for full functionality:
   * 
   * - READ_CONTACTS, WRITE_CONTACTS: Phone contacts integration
   * - CAMERA: VIN scanning feature
   * - READ_EXTERNAL_STORAGE (maxSdkVersion 32): Backup import on older Android
   * - WRITE_EXTERNAL_STORAGE (maxSdkVersion 29): Backup export on older Android
   * - POST_NOTIFICATIONS: Task reminders and alerts
   * - SCHEDULE_EXACT_ALARM: Scheduled notifications
   * 
   * See ANDROID_STUDIO_SETUP.md for complete instructions.
   */
};

export default config;
