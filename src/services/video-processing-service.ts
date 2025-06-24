import { env } from '~/env';

class VideoProcessingService {
  async processVideo(s3Key: string): Promise<void> {
    const response = await fetch(env.PROCESS_VIDEO_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ s3_key: s3Key }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.PROCESS_VIDEO_ENDPOINT_AUTH}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Video processing failed: ${response.status} ${response.statusText}`);
    }
  }
}

export const videoProcessingService = new VideoProcessingService();
