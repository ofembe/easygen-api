import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';

const checkUserResponse = (response) => {
  const { id, email, name } = response.body;
  expect(id).toBeDefined();
  expect(name).toEqual(name);
  expect(email).toEqual(email);
};

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    configService = moduleFixture.get<ConfigService>(ConfigService);
    const mongoDbUrl = configService.get<string>('MONGODB_URI');

    await mongoose.connect(mongoDbUrl);
    await mongoose.connection.db.dropDatabase();
  });

  it('handles a signup request', async () => {
    const expectedName = 'Test2';
    const expectedEmail = 'test2@test.com';

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: expectedName,
        email: expectedEmail,
        password: 'Password1@',
      });
    expect(response.status).toEqual(201);

    checkUserResponse(response);
  });

  it('handles a signin request', async () => {
    const signinEmail = 'test2@test.com';
    const signinPassword = 'Password1@';

    await request(app.getHttpServer()).post('/auth/signup').send({
      name: 'Random name',
      email: signinEmail,
      password: signinPassword,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: signinEmail,
        password: signinPassword,
      });
    expect(response.status).toEqual(201);
    expect(response.header['set-cookie'][0]).toBeDefined();

    checkUserResponse(response);
  });

  it('handles a get user after sign in', async () => {
    const signinEmail = 'test2@test.com';
    const signinPassword = 'Password1@';

    await request(app.getHttpServer()).post('/auth/signup').send({
      name: 'Random name',
      email: signinEmail,
      password: signinPassword,
    });

    const signinResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: signinEmail,
        password: signinPassword,
      });

    const cookie = signinResponse.header['set-cookie'][0];
    expect(cookie).toBeDefined();

    const response = await request(app.getHttpServer())
      .get('/auth/user')
      .set('Cookie', cookie);
    expect(response.status).toEqual(200);

    checkUserResponse(response);
  });

  describe('Signup validations', () => {
    it('validates that name is provided', async () => {
      const expectedEmail = 'test2@test.com';

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: expectedEmail,
          password: 'Password1@',
        });
      expect(response.status).toEqual(400);
    });
    it('validates that email is provided', async () => {
      const expectedName = 'Test2';
      const expectedEmail = 'test2@test.com';

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          name: expectedName,
          password: 'Password1@',
        });
      expect(response.status).toEqual(400);
    });
    it('validates that password is provided', async () => {
      const expectedName = 'Test2';
      const expectedEmail = 'test2@test.com';

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          name: expectedName,
          email: expectedEmail,
        });
      expect(response.status).toEqual(400);
    });
    it('validates that password is correct', async () => {
      const expectedName = 'Test2';
      const expectedEmail = 'test2@test.com';

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          name: expectedName,
          email: expectedEmail,
          password: 'Password',
        });
      expect(response.status).toEqual(400);
    });
  });
});
