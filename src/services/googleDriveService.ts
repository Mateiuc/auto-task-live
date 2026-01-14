import { GOOGLE_DRIVE_CONFIG } from '@/config/googleDrive';
import { capacitorStorage } from '@/lib/capacitorStorage';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
    gapi?: any;
  }
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  fileId?: string;
}

class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private gapiLoaded = false;
  private gisLoaded = false;
  private clientId: string = '';
  
  async initialize(clientId: string): Promise<void> {
    this.clientId = clientId;
    
    if (!clientId) {
      throw new Error('Google Client ID is required');
    }
    
    await Promise.all([
      this.loadGapiScript(),
      this.loadGisScript(),
    ]);
    
    await this.initializeGapi();
    this.initializeGis();
  }
  
  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        this.gapiLoaded = true;
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.gapiLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }
  
  private loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        this.gisLoaded = true;
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.gisLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }
  
  private initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: GOOGLE_DRIVE_CONFIG.discoveryDocs,
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  
  private initializeGis(): void {
    this.tokenClient = window.google?.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: GOOGLE_DRIVE_CONFIG.scopes,
      callback: '', // Will be set during sign-in
    });
  }
  
  async signIn(): Promise<{ email: string; accessToken: string }> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Google Sign-In not initialized'));
        return;
      }
      
      this.tokenClient.callback = async (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        
        this.accessToken = response.access_token;
        
        // Get user email
        try {
          const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
          });
          const userData = await userInfo.json();
          
          resolve({
            email: userData.email,
            accessToken: response.access_token,
          });
        } catch (error) {
          resolve({
            email: 'Unknown',
            accessToken: response.access_token,
          });
        }
      };
      
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }
  
  async signOut(): Promise<void> {
    if (this.accessToken) {
      window.google?.accounts.oauth2.revoke(this.accessToken, () => {
        this.accessToken = null;
      });
    }
    this.accessToken = null;
  }
  
  setAccessToken(token: string): void {
    this.accessToken = token;
  }
  
  isSignedIn(): boolean {
    return !!this.accessToken;
  }
  
  private async getOrCreateBackupFolder(): Promise<string> {
    // Search for existing folder
    const searchResponse = await window.gapi.client.drive.files.list({
      q: `name='${GOOGLE_DRIVE_CONFIG.backupFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    
    const folders = searchResponse.result.files;
    if (folders && folders.length > 0) {
      return folders[0].id;
    }
    
    // Create new folder
    const createResponse = await window.gapi.client.drive.files.create({
      resource: {
        name: GOOGLE_DRIVE_CONFIG.backupFolderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });
    
    return createResponse.result.id;
  }
  
  async uploadBackup(xmlContent: string): Promise<SyncResult> {
    if (!this.accessToken) {
      return { success: false, error: 'Not signed in to Google Drive' };
    }
    
    try {
      const folderId = await this.getOrCreateBackupFolder();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${GOOGLE_DRIVE_CONFIG.backupFilePrefix}${timestamp}${GOOGLE_DRIVE_CONFIG.backupFileExtension}`;
      
      // Create file metadata
      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/xml',
      };
      
      // Create multipart request
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const closeDelim = "\r\n--" + boundary + "--";
      
      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/xml\r\n\r\n' +
        xmlContent +
        closeDelim;
      
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body: multipartRequestBody,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Clean up old backups (keep last 10)
      await this.cleanupOldBackups(folderId);
      
      return { success: true, fileId: result.id };
    } catch (error: any) {
      console.error('Google Drive upload error:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }
  
  async listBackups(): Promise<GoogleDriveFile[]> {
    if (!this.accessToken) {
      return [];
    }
    
    try {
      const folderId = await this.getOrCreateBackupFolder();
      
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name contains '${GOOGLE_DRIVE_CONFIG.backupFilePrefix}' and trashed=false`,
        fields: 'files(id, name, createdTime, modifiedTime)',
        orderBy: 'createdTime desc',
        pageSize: 20,
      });
      
      return response.result.files || [];
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }
  
  async downloadBackup(fileId: string): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }
  
  async getLatestBackup(): Promise<{ fileId: string; content: string } | null> {
    const backups = await this.listBackups();
    if (backups.length === 0) {
      return null;
    }
    
    const content = await this.downloadBackup(backups[0].id);
    if (!content) {
      return null;
    }
    
    return { fileId: backups[0].id, content };
  }
  
  private async cleanupOldBackups(folderId: string): Promise<void> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name contains '${GOOGLE_DRIVE_CONFIG.backupFilePrefix}' and trashed=false`,
        fields: 'files(id, name, createdTime)',
        orderBy: 'createdTime desc',
        pageSize: 50,
      });
      
      const files = response.result.files || [];
      
      // Keep only the last 10 backups
      if (files.length > 10) {
        const filesToDelete = files.slice(10);
        for (const file of filesToDelete) {
          await window.gapi.client.drive.files.delete({ fileId: file.id });
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export const googleDriveService = new GoogleDriveService();
