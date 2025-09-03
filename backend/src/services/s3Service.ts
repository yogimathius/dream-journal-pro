import AWS from 'aws-sdk';
import { env } from '../config/env';

class S3Service {
  private s3: AWS.S3;

  constructor() {
    AWS.config.update({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
    });

    this.s3 = new AWS.S3({
      apiVersion: '2006-03-01',
    });
  }

  async uploadVoiceRecording(
    buffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    const key = `voice-recordings/${Date.now()}-${fileName}`;
    
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentEncoding: 'base64',
      ServerSideEncryption: 'AES256',
      Metadata: {
        'original-name': fileName,
        'upload-timestamp': new Date().toISOString(),
      },
    };

    try {
      const result = await this.s3.upload(uploadParams).promise();
      return result;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload voice recording to S3');
    }
  }

  async getSignedUrl(key: string, expires: number = 3600): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Expires: expires,
      });
      return url;
    } catch (error) {
      console.error('S3 get signed URL error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async deleteVoiceRecording(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      }).promise();
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete voice recording from S3');
    }
  }

  async getVoiceRecordingMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const metadata = await this.s3.headObject({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      }).promise();
      return metadata;
    } catch (error) {
      console.error('S3 get metadata error:', error);
      throw new Error('Failed to get voice recording metadata');
    }
  }

  extractKeyFromUrl(url: string): string {
    // Extract key from S3 URL
    const urlParts = url.split('/');
    return urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)
  }

  generateFileKey(userId: string, dreamId?: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2);
    
    if (dreamId) {
      return `voice-recordings/${userId}/${dreamId}/${timestamp}-${randomSuffix}.m4a`;
    } else {
      return `voice-recordings/${userId}/temp/${timestamp}-${randomSuffix}.m4a`;
    }
  }
}

export const s3Service = new S3Service();