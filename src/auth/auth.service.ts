import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { SignupDto, LoginDto } from './dto';
import { EmailService } from '../email/email.service';
import { AuthStatus, AuthType, PrismaClient } from '@prisma/client';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  constructor(private readonly emailService: EmailService) {}

  async signup(data: SignupDto) {
    const { email, password, name, type } = data;

    const existing = await this.prisma.auth.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    const isUser = type === 'user';

    const entity = isUser
      ? await this.prisma.user.create({ data: { name } })
      : await this.prisma.vendor.create({ data: { name } });

    const [authType, userId, vendorId] = isUser
      ? [AuthType.USER, entity.id, null]
      : [AuthType.VENDOR, null, entity.id];

    const authData = {
      email,
      password: hashed,
      verificationToken,
      status: AuthStatus.PENDING,
      userId,
      vendorId,
      type: authType,
    };

    await this.prisma.auth.create({ data: authData });
    await this.emailService.sendVerification(email, verificationToken);

    return { message: 'Signup successful, please verify your email.' };
  }

  async login(data: LoginDto) {
    const { email, password } = data;

    const auth = await this.prisma.auth.findUnique({ where: { email } });
    if (!auth) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, auth.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (auth.status !== AuthStatus.APPROVED) {
      throw new UnauthorizedException('Email not verified');
    }

    const accessToken = uuidv4();
    await this.prisma.auth.update({ where: { email }, data: { accessToken } });

    return {
      accessToken,
      type: auth['type'],
      userId: auth['userId'],
      vendorId: auth['vendorId'],
    };
  }

  async verifyEmail(token: string) {
    const auth = await this.prisma.auth.findFirst({
      where: { verificationToken: token },
    });

    if (!auth) throw new BadRequestException('Invalid or expired token');

    if (auth.status === AuthStatus.APPROVED)
      return { message: 'Already verified' };

    await this.prisma.auth.update({
      where: { email: auth.email },
      data: { status: AuthStatus.APPROVED, verificationToken: null },
    });

    return { message: 'Email verified successfully' };
  }

  async getMe(auth: any) {
    if (!auth) return { message: 'No user found' };

    if (auth.type === 'USER' && auth.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: auth.userId },
      });
      return { type: 'USER', email: auth.email, user };
    }

    if (auth.type === 'VENDOR' && auth.vendorId) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: auth.vendorId },
      });
      return { type: 'VENDOR', email: auth.email, vendor };
    }

    return { message: 'Invalid auth record' };
  }
}
