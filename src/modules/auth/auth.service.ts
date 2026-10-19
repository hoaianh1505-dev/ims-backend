import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordUtil } from '../../common/utils/password.util';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Find user by username (including password field)
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

    // Generate JWT token
    const accessToken = this.generateToken({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      access_token: accessToken,
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

