import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { env } from '~/env';

class S3Service {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async listObjectsByPrefix(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: env.S3_BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await this.client.send(command);
    return (
      response.Contents?.map((item) => item.Key).filter((key): key is string => Boolean(key)) ?? []
    );
  }

  getClipKeys(allKeys: string[]): string[] {
    return allKeys.filter(
      (key): key is string => key !== undefined && !key.endsWith('original.mp4'),
    );
  }

  getFolderPrefix(s3Key: string): string {
    const prefix = s3Key.split('/')[0];
    if (!prefix) {
      throw new Error(`Invalid S3 key format: ${s3Key}`);
    }

    return prefix;
  }
}

export const s3Service = new S3Service();
