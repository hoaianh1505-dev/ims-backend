import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('file')
  @ApiOperation({ summary: 'Xem / stream file hình ảnh an toàn từ AWS S3' })
  @ApiQuery({ name: 'key', required: true, description: 'S3 key hoặc đường dẫn ảnh' })
  @ApiResponse({ status: 200, description: 'File ảnh được stream thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy file' })
  async getFile(@Query('key') key: string, @Res() res: Response) {
    const stream = await this.uploadService.getFileStream(key);
    res.setHeader('Content-Type', stream.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (stream.contentLength) {
      res.setHeader('Content-Length', stream.contentLength);
    }
    stream.body.pipe(res);
  }
}

