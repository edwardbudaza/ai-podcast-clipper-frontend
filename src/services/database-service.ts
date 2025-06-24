import { db } from '~/server/db';
import type { UserCreditsData, FileStatus } from '~/types/video-pocessing';

class DatabaseService {
  async getUserCreditsAndS3Key(uploadedFileId: string): Promise<UserCreditsData> {
    const uploadedFile = await db.uploadedFile.findUniqueOrThrow({
      where: { id: uploadedFileId },
      select: {
        user: {
          select: {
            id: true,
            credits: true,
          },
        },
        s3Key: true,
      },
    });

    return {
      userId: uploadedFile.user.id,
      credits: uploadedFile.user.credits,
      s3Key: uploadedFile.s3Key,
    };
  }

  async updateFileStatus(uploadedFileId: string, status: FileStatus): Promise<void> {
    await db.uploadedFile.update({
      where: { id: uploadedFileId },
      data: { status },
    });
  }

  async createClips(clipKeys: string[], uploadedFileId: string, userId: string): Promise<number> {
    if (clipKeys.length === 0) return 0;

    await db.clip.createMany({
      data: clipKeys.map((clipKey) => ({
        s3Key: clipKey,
        uploadedFileId,
        userId,
      })),
    });

    return clipKeys.length;
  }

  async deductUserCredits(userId: string, creditsToDeduct: number): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: creditsToDeduct,
        },
      },
    });
  }
}

export const databaseService = new DatabaseService();
