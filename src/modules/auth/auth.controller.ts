import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token (reads from HTTP-only cookie or request body)' })
  @ApiResponse({ status: 200, description: 'New access token issued successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refreshToken(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    const token = dto.refresh_token || req.cookies?.refresh_token;
    return this.authService.refreshToken(token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout() {
    return this.authService.logout();
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
