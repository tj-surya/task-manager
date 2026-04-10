import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ConfigService {
  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get port(): number {
    return parseInt(process.env.PORT, 10) || 3000;
  }

  get dbHost(): string {
    return process.env.DB_HOST || 'localhost';
  }

  get dbPort(): number {
    return parseInt(process.env.DB_PORT, 10) || 5432;
  }

  get dbUsername(): string {
    return process.env.DB_USERNAME || 'postgres';
  }

  get dbPassword(): string {
    return process.env.DB_PASSWORD || 'postgres';
  }

  get dbName(): string {
    return process.env.DB_NAME || 'task_management';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'fallback_secret';
  }

  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '7d';
  }
}
