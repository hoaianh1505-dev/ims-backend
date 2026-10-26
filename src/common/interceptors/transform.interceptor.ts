import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'refresh_token' in result) {
          response.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
          });
          // Xóa refresh_token khỏi JSON trả về để bảo mật tuyệt đối
          delete result.refresh_token;
        }

        // Tự động xóa Cookie khi gọi logout
        const request = ctx.getRequest();
        if (request.url?.includes('/auth/logout')) {
          response.clearCookie('refresh_token');
        }

        // Nếu kết quả trả về từ service có chứa meta phân trang
        if (result && typeof result === 'object' && 'meta' in result && 'data' in result) {
          return {
            statusCode: response.statusCode,
            data: result.data,
            meta: result.meta,
          };
        }

        return {
          statusCode: response.statusCode,
          data: result !== undefined ? result : null,
        };
      }),
    );
  }
}
