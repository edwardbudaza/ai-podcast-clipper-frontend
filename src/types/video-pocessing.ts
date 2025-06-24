export interface ProcessVideoEventData {
  uploadedFileId: string;
  userId: string;
}

export interface UserCreditsData {
  userId: string;
  credits: number;
  s3Key: string;
}

export type FileStatus = 'processing' | 'processed' | 'no credits' | 'failed';
