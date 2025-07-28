import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthRole } from '@prisma/client';
import { SignupDto, LoginDto } from './dto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async signup(data: SignupDto) {
    const { email, password, name, type } = data;

    const existing = await this.prisma.auth.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    const isUser = type === 'USER';

    const entity = isUser
      ? await this.prisma.user.create({ data: { name } })
      : await this.prisma.vendor.create({ data: { name } });

    const [authRole, userId, vendorId] = isUser
      ? [AuthRole.USER, entity.id, null]
      : [AuthRole.VENDOR, null, entity.id];

    const authData = {
      email,
      userId,
      vendorId,
      role: authRole,
      password: hashed,
      verificationToken,
    };

    await this.prisma.auth.create({ data: authData });
    await this.emailService.sendVerification(email, verificationToken);

    return { message: 'Signup successful, please verify your email.' };
  }

  async login(data: LoginDto) {
    const { email, password } = data;

    const auth = await this.prisma.auth.findUnique({ where: { email } });
    if (!auth) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, auth.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!auth.verified) throw new UnauthorizedException('Email not verified');

    const accessToken = uuidv4();
    await this.prisma.auth.update({ where: { email }, data: { accessToken } });

    return {
      accessToken,
      role: auth.role,
      userId: auth.userId,
      vendorId: auth.vendorId,
    };
  }

  async verifyEmail(token: string) {
    const auth = await this.prisma.auth.findFirst({
      where: { verificationToken: token },
    });

    if (!auth) throw new BadRequestException('Invalid or expired token');

    if (auth.verified) return { message: 'Email already verified' };

    await this.prisma.auth.update({
      where: { email: auth.email },
      data: { verified: true },
    });

    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string) {
    const auth = await this.prisma.auth.findUnique({ where: { email } });
    if (!auth) throw new BadRequestException('No account with that email');

    const token = uuidv4();
    await this.prisma.auth.update({
      where: { email },
      data: { passwordResetToken: token },
    });

    await this.emailService.sendPasswordReset(email, token);
    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const auth = await this.prisma.auth.findFirst({
      where: { passwordResetToken: token },
    });
    if (!auth) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.auth.update({
      where: { email: auth.email },
      data: { password: hashed, passwordResetToken: null },
    });

    return { message: 'Password has been reset successfully' };
  }

  async getMe(auth: any) {
    if (!auth) return { message: 'No user found' };

    if (auth.role === 'USER' && auth.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: auth.userId },
      });
      return { role: 'USER', email: auth.email, user };
    }

    if (auth.role === 'VENDOR' && auth.vendorId) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: auth.vendorId },
      });
      return { role: 'VENDOR', email: auth.email, vendor };
    }

    return { message: 'Invalid auth record' };
  }
}
