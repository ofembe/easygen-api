import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name, { timestamp: true });

  constructor(private readonly usersService: UsersService) {}

  async signUp(name: string, email: string, password: string) {
    const user = await this.usersService.findOne(email);
    if (user) {
      this.logger.log(`Failed to sign up with existing email ${email}`);
      throw new BadRequestException('email already registered');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const saltAndPassword = `${salt}.${hash.toString('hex')}`;
    return this.usersService.create(name, email, saltAndPassword);
  }

  async signIn(email: string, password: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      this.logger.log(`Failed to sign in with non-existing email ${email}`);
      throw new NotFoundException('user does not exist');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (hash.toString('hex') !== storedHash) {
      this.logger.log(`Failed to sign in ${email} with wrong password`);
      throw new BadRequestException('wrong email or password');
    }

    return user;
  }
}
