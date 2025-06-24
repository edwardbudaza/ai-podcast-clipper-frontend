import { databaseService } from '~/services/database-service';
import { s3Service } from '~/services/s3-services';
import { videoProcessingService } from '~/services/video-processing-service';
import type { ProcessVideoEventData } from '~/types/video-pocessing';
import { inngest } from './client';

export const processVideo = inngest.createFunction(
  {
    id: 'process-video',
    retries: 1,
    concurrency: {
      limit: 1,
      key: 'event.data.userId',
    },
  },
  { event: 'process-video-events' },
  async ({ event, step }) => {
    const { uploadedFileId } = event.data as ProcessVideoEventData;

    try {
      // Step 1: Validate user credits and get file info
      const { userId, credits, s3Key } = await step.run('check-user-credits', async () => {
        return await databaseService.getUserCreditsAndS3Key(uploadedFileId);
      });

      // Early return if no credits
      if (credits <= 0) {
        await step.run('set-status-no-credits', async () => {
          await databaseService.updateFileStatus(uploadedFileId, 'no credits');
        });
        return;
      }

      // Step 2: Set status to processing
      await step.run('set-status-processing', async () => {
        await databaseService.updateFileStatus(uploadedFileId, 'processing');
      });

      // Step 3: Process video
      await step.run('process-video-external', async () => {
        await videoProcessingService.processVideo(s3Key);
      });

      // Step 4: Create clips in database
      const clipsCreated = await step.run('create-clips-in-db', async () => {
        const folderPrefix = s3Service.getFolderPrefix(s3Key);
        const allKeys = await s3Service.listObjectsByPrefix(folderPrefix);
        const clipKeys = s3Service.getClipKeys(allKeys);

        return await databaseService.createClips(clipKeys, uploadedFileId, userId);
      });

      // Step 5: Deduct credits
      await step.run('deduct-user-credits', async () => {
        const creditsToDeduct = Math.min(credits, clipsCreated);
        await databaseService.deductUserCredits(userId, creditsToDeduct);
      });

      // Step 6: Mark as processed
      await step.run('set-status-processed', async () => {
        await databaseService.updateFileStatus(uploadedFileId, 'processed');
      });
    } catch (error) {
      console.error('Video processing failed: ', error);

      // Ensure status is set to failed even if this step fails
      try {
        await databaseService.updateFileStatus(uploadedFileId, 'failed');
      } catch (statusUpdateError) {
        console.error('Failed to update status to failed', statusUpdateError);

        // Re-throw to get Inngest handle retries
        throw error;
      }
    }
  },
);
