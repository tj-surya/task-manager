import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Load env variables first
    ConfigModule,

    // Database connection using env config
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.dbHost,
        port: config.dbPort,
        username: config.dbUsername,
        password: config.dbPassword,
        database: config.dbName,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.nodeEnv !== 'production', // Auto-sync in dev only
        logging: config.nodeEnv === 'development',
      }),
    }),

    UsersModule,
    TasksModule,
    AuthModule,
  ],
})
export class AppModule {}
