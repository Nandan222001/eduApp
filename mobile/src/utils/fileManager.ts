import * as FileSystem from 'expo-file-system';

export const MATERIALS_DIR = `${FileSystem.documentDirectory}materials/`;

export const fileManager = {
  async ensureDirectoryExists(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(MATERIALS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MATERIALS_DIR, { intermediates: true });
    }
  },

  async downloadFile(url: string, filename: string, onProgress?: (progress: number) => void): Promise<string> {
    await this.ensureDirectoryExists();
    
    const localPath = `${MATERIALS_DIR}${filename}`;
    
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (onProgress) {
          onProgress(progress);
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    
    if (!result || !result.uri) {
      throw new Error('Download failed');
    }

    return result.uri;
  },

  async deleteFile(filePath: string): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
  },

  async isFileDownloaded(filename: string): Promise<boolean> {
    const localPath = `${MATERIALS_DIR}${filename}`;
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    return fileInfo.exists;
  },

  async getFileInfo(filePath: string): Promise<FileSystem.FileInfo> {
    return await FileSystem.getInfoAsync(filePath);
  },

  async getAllDownloadedFiles(): Promise<string[]> {
    await this.ensureDirectoryExists();
    
    const dirInfo = await FileSystem.getInfoAsync(MATERIALS_DIR);
    if (!dirInfo.exists || !dirInfo.isDirectory) {
      return [];
    }

    return await FileSystem.readDirectoryAsync(MATERIALS_DIR);
  },

  async clearAllDownloads(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(MATERIALS_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(MATERIALS_DIR, { idempotent: true });
      await this.ensureDirectoryExists();
    }
  },

  getLocalPath(filename: string): string {
    return `${MATERIALS_DIR}${filename}`;
  },
};
