// Google Drive OAuth Configuration
// Users need to create their own Google Cloud project and OAuth credentials
// See: https://console.cloud.google.com/apis/credentials

export const GOOGLE_DRIVE_CONFIG = {
  // OAuth 2.0 Client ID - users must provide their own
  // Create one at: https://console.cloud.google.com/apis/credentials
  clientId: '', // Will be set from settings
  
  // Required scopes for Drive file access
  scopes: [
    'https://www.googleapis.com/auth/drive.file', // Access to files created by this app
    'https://www.googleapis.com/auth/userinfo.email', // Get user email
  ].join(' '),
  
  // Discovery docs for Drive API
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  
  // Folder name in Google Drive
  backupFolderName: 'AutoTime Backups',
  
  // File naming
  backupFilePrefix: 'autotime-backup-',
  backupFileExtension: '.xml',
};

// Default sync intervals available (in minutes)
export const SYNC_INTERVALS = [
  { value: 5, label: 'Every 5 minutes' },
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every hour' },
  { value: 360, label: 'Every 6 hours' },
  { value: 1440, label: 'Once a day' },
];
