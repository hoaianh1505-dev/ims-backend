import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PasswordUtil } from '../../common/utils/password.util';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Find user by username
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Compare password
    const isPasswordValid = await PasswordUtil.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken({
      sub: user.id,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        must_change_password: user.must_change_password,
      },
    };
  }

  generateToken(payload: { sub: string; username: string; role: string }): string {
    return this.jwtService.sign(payload);
  }

  generateRefreshToken(payload: { sub: string }): string {
    const refreshSecret = this.configService.getOrThrow<string>('jwt.refreshSecret');
    const expiresIn = this.configService.getOrThrow<string>('jwt.refreshExpiresIn');
    return this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: expiresIn as any,
    });
  }

  async refreshToken(token?: string) {
    if (!token) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }

    const refreshSecret = this.configService.getOrThrow<string>('jwt.refreshSecret');

    try {
      const payload = this.jwtService.verify(token, {
        secret: refreshSecret,
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.is_active) {
        throw new UnauthorizedException('User is inactive or not found');
      }

      const newAccessToken = this.generateToken({
        sub: user.id,
        username: user.username,
        role: user.role,
      });

      return {
        access_token: newAccessToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout() {
    return { message: 'Đăng xuất thành công' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { current_password, new_password } = changePasswordDto;

    const user = await this.usersService.findOne(userId);

    // Verify current password
    const isPasswordValid = await PasswordUtil.compare(current_password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password and set must_change_password to false
    await this.usersService.update(userId, {
      password: new_password,
      must_change_password: false,
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }
}

