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
    const { email, password, firebaseId, name, type } = data;

    // Validate that either password or firebaseId is provided
    if (!password && !firebaseId) {
      throw new BadRequestException(
        'Either password or firebaseId must be provided',
      );
    }

    if (password && firebaseId) {
      throw new BadRequestException(
        'Provide either password or firebaseId, not both',
      );
    }

    const existing = await this.prisma.auth.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    // If firebaseId is provided, check if it's already in use
    if (firebaseId) {
      const existingFirebase = await this.prisma.auth.findFirst({
        where: { firebaseId },
      });
      if (existingFirebase) {
        throw new BadRequestException('Firebase ID already in use');
      }
    }

    const hashed = password ? await bcrypt.hash(password, 10) : null;
    const verificationToken = firebaseId ? null : uuidv4(); // No verification needed for Firebase users
    const isVerified = !!firebaseId; // Firebase users are auto-verified
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
      firebaseId,
      role: authRole,
      password: hashed,
      verificationToken,
      verified: isVerified,
    };

    await this.prisma.auth.create({ data: authData });

    // Send verification email only for password-based signups
    if (!firebaseId && verificationToken) {
      await this.emailService.sendVerification(email, verificationToken);
      return { message: 'Signup successful, please verify your email.' };
    }

    return { message: 'Signup successful! You can now log in.' };
  }

  async login(data: LoginDto) {
    const { email, password, firebaseId } = data;

    // Validate that either password or firebaseId is provided
    if (!password && !firebaseId) {
      throw new UnauthorizedException(
        'Either password or firebaseId must be provided',
      );
    }

    if (password && firebaseId) {
      throw new UnauthorizedException(
        'Provide either password or firebaseId, not both',
      );
    }

    const auth = await this.prisma.auth.findUnique({ where: { email } });
    if (!auth) throw new UnauthorizedException('Invalid credentials');

    // Password-based login
    if (password) {
      if (!auth.password) {
        throw new UnauthorizedException(
          'This account uses Firebase authentication',
        );
      }
      const valid = await bcrypt.compare(password, auth.password);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
    }

    // Firebase-based login
    if (firebaseId) {
      if (!auth.firebaseId) {
        throw new UnauthorizedException(
          'This account uses password authentication',
        );
      }
      if (auth.firebaseId !== firebaseId) {
        throw new UnauthorizedException('Invalid Firebase credentials');
      }
    }

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

    if (!auth.password) {
      throw new BadRequestException(
        'This account uses Firebase authentication and cannot reset password',
      );
    }

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

    if (!auth.password) {
      throw new BadRequestException(
        'This account uses Firebase authentication and cannot reset password',
      );
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
