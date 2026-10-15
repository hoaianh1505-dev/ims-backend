import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    // Xác định HTTP Status Code (Mặc định 500 nếu là lỗi hệ thống không xác định)
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Trích xuất nội dung lỗi
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Format chuẩn chung cho mọi lỗi API
    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: typeof message === 'object' && message !== null && 'message' in message 
        ? (message as any).message 
        : message,
    };

    // Ghi log lỗi ra terminal để dễ debug
    this.logger.error(
      `[${ctx.getRequest().method}] ${httpAdapter.getRequestUrl(ctx.getRequest())}`,
      exception instanceof Error ? exception.stack : 'No stack trace',
    );

    // Trả về Frontend
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
