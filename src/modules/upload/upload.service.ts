import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-southeast-2';
    this.bucket = process.env.AWS_S3_BUCKET || 'cloudstudy-2026';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'general',
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload');
    }

    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `ims/${folder}/${Date.now()}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
    const url = `${baseUrl}/upload/file?key=${encodeURIComponent(key)}`;
    return { url, key };
  }

  async getFileStream(key: string): Promise<{ body: any; contentType: string; contentLength?: number }> {
    if (!key) {
      throw new BadRequestException('Vui lòng chỉ định key của file');
    }

    // Normalization: nếu key chứa URL S3 thì bóc tách lấy phần key
    const normalizedKey = key.includes('.amazonaws.com/')
      ? key.split('.amazonaws.com/')[1]
      : key;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
      });

      const response = await this.s3Client.send(command);
      return {
        body: response.Body,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength,
      };
    } catch (err: any) {
      throw new NotFoundException('Không tìm thấy file trên lưu trữ đám mây');
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (!key) return;

    const normalizedKey = key.includes('.amazonaws.com/')
      ? key.split('.amazonaws.com/')[1]
      : key;

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: normalizedKey,
    });

    await this.s3Client.send(command);
  }
}
