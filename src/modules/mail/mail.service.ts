import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendUserCredentialsOptions {
  to: string;
  username: string;
  password: string;
  displayName?: string;
  role?: string;
}

export interface SendPasswordResetOptions {
  to: string;
  username: string;
  tempPassword: string;
  displayName?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<number>('EMAIL_PORT', 587));
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Gửi email thông báo tài khoản & mật khẩu cho nhân viên mới
   */
  async sendUserCredentials(options: SendUserCredentialsOptions): Promise<boolean> {
    const { to, username, password, displayName, role } = options;
    const clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:5173');
    const from = this.configService.get<string>('EMAIL_FROM', '"IMS Core" <no-reply@ims.com>');

    const roleMap: Record<string, string> = {
      ADMIN: 'Quản trị viên (Super Admin)',
      MANAGER: 'Quản lý kho (Manager)',
      STAFF: 'Nhân viên kho (Staff)',
    };
    const roleText = (role && roleMap[role]) || role || 'Nhân viên';
    const nameText = displayName || username;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F6F4; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .header { background-color: #143D30; padding: 32px 32px 28px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #a7d4c6; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
          .content { padding: 32px; }
          .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
          .intro { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
          .box-cred { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
          .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
          .cred-row:last-child { border-bottom: none; }
          .cred-label { color: #64748b; font-weight: 500; }
          .cred-val { color: #0f172a; font-weight: 700; font-family: monospace; font-size: 15px; }
          .btn-login { display: inline-block; background-color: #1A4D3E; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; margin: 8px 0 24px; text-align: center; }
          .security-note { background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 14px; font-size: 12px; color: #92400e; line-height: 1.5; }
          .footer { padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>IMS CORE</h1>
            <p>Hệ thống Quản trị Kho Doanh nghiệp</p>
          </div>
          <div class="content">
            <div class="greeting">Kính gửi ${nameText},</div>
            <div class="intro">
              Tài khoản của bạn đã được Quản trị viên khởi tạo thành công trên hệ thống <strong>IMS Core</strong>. Dưới đây là thông tin đăng nhập dành riêng cho bạn:
            </div>
            
            <div class="box-cred">
              <div class="cred-row">
                <span class="cred-label">Tên tài khoản (Username):</span>
                <span class="cred-val">${username}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Mật khẩu khởi tạo:</span>
                <span class="cred-val">${password}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Vai trò được phân quyền:</span>
                <span class="cred-val">${roleText}</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${clientUrl}/login" class="btn-login" target="_blank">
                Đăng nhập Cổng Vận Hành IMS
              </a>
            </div>

            <div class="security-note">
              <strong>Lưu ý bảo mật:</strong> Để đảm bảo an toàn kho vận, vui lòng đăng nhập và đổi lại mật khẩu cá nhân ở lần đăng nhập đầu tiên. Tuyệt đối không chia sẻ mật khẩu này cho bất kỳ ai.
            </div>
          </div>
          <div class="footer">
            Email tự động từ Hệ thống Quản lý Kho Nội bộ IMS · Vui lòng không phản hồi thư này.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: `[IMS Core] Thông tin tài khoản đăng nhập cho nhân viên ${nameText}`,
        html: htmlContent,
      });

      this.logger.log(`+ Gửi thông tin tài khoản thành công tới email: ${to} (MessageId: ${info.messageId})`);
      return true;
    } catch (error) {
      this.logger.error(`! Không thể gửi email thông tin tài khoản tới ${to}:`, error);
      return false;
    }
  }

  /**
   * Gửi email mật khẩu tạm thời khi đặt lại mật khẩu
   */
  async sendPasswordReset(options: SendPasswordResetOptions): Promise<boolean> {
    const { to, username, tempPassword, displayName } = options;
    const clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:5173');
    const from = this.configService.get<string>('EMAIL_FROM', '"IMS Core" <no-reply@ims.com>');
    const nameText = displayName || username;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F6F4; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .header { background-color: #143D30; padding: 28px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
          .content { padding: 32px; }
          .box-cred { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .btn-login { display: inline-block; background-color: #1A4D3E; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-align: center; }
          .footer { padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>IMS CORE - Cấp lại mật khẩu</h1>
          </div>
          <div class="content">
            <p>Kính gửi <strong>${nameText}</strong>,</p>
            <p>Mật khẩu tài khoản của bạn vừa được Quản trị viên đặt lại theo yêu cầu. Dưới đây là mật khẩu tạm thời:</p>
            
            <div class="box-cred">
              <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Tài khoản: <strong>${username}</strong></div>
              <div style="font-size: 13px; color: #64748b;">Mật khẩu tạm thời: <strong style="font-family: monospace; font-size: 16px; color: #0f172a;">${tempPassword}</strong></div>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${clientUrl}/login" class="btn-login" target="_blank">Đăng nhập ngay</a>
            </div>

            <p style="font-size: 12px; color: #b45309; background: #fffbeb; padding: 12px; border-radius: 8px;">
              Sau khi đăng nhập thành công bằng mật khẩu tạm, hệ thống sẽ yêu cầu bạn đổi mật khẩu mới để tiếp tục.
            </p>
          </div>
          <div class="footer">
            Email tự động từ Hệ thống Quản lý Kho Nội bộ IMS
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `[IMS Core] Cấp lại mật khẩu tạm thời cho tài khoản ${username}`,
        html: htmlContent,
      });
      return true;
    } catch (error) {
      this.logger.error(`! Không thể gửi email đặt lại mật khẩu tới ${to}:`, error);
      return false;
    }
  }
}
