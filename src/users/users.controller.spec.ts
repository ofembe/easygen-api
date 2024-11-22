import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { Response } from 'express';
import { LoginUserDto } from './dto/login-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;
  let users: User[] = [];
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    users = [];
    let responseObject = {
      status: 200,
      message: 'Hello World!',
    };

    mockResponse = {
      status: jest.fn().mockImplementation().mockReturnValue(200),
      json: jest.fn().mockImplementation().mockReturnValue(responseObject),
      cookie: jest.fn(),
    };

    fakeUsersService = {
      findById: (id: string) => {
        const filteredUser = users.find((user) => user.id == id);
        return Promise.resolve(filteredUser as User);
      },
    };
    fakeAuthService = {
      signUp: (name: string, email: string, password: string) => {
        const user = {
          _id: email,
          id: email,
          name,
          email,
          password,
        };
        users.push(user);
        return Promise.resolve(user);
      },
      signIn: (email: string, password: string) => {
        return Promise.resolve({
          id: email,
          email,
        } as User);
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should sign up a user and set a userId cookie', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const user = { id: 'john@example.com', ...createUserDto };

      const result = await controller.SignUp(
        createUserDto,
        mockResponse as Response,
      );

      expect(result).toEqual(plainToInstance(UserResponseDto, user));
      expect(mockResponse.cookie).toHaveBeenCalledWith('userId', user.id, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 15,
      });
    });
  });

  describe('signIn', () => {
    it('should sign in a user and set a userId cookie', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const user = { id: 'john@example.com', ...loginUserDto };

      const result = await controller.signIn(
        loginUserDto,
        mockResponse as Response,
      );

      expect(result).toEqual(plainToInstance(UserResponseDto, user));
      expect(mockResponse.cookie).toHaveBeenCalledWith('userId', user.id, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 15,
      });
    });
  });

  describe('signOut', () => {
    it('should clear the userId cookie', async () => {
      await controller.signOut(mockResponse as Response);

      expect(mockResponse.cookie).toHaveBeenCalledWith('userId', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
    });
  });

  describe('getUser', () => {
    it('should return the user by userId from cookies', async () => {
      const userId = '123';
      const user = { id: userId, name: 'John Doe', email: 'john@example.com' };

      fakeUsersService.findById = (id: string) => Promise.resolve(user as User);

      const result = await controller.getUser({cookies: { userId: userId }} as any);

      expect(result).toEqual(plainToInstance(UserResponseDto, user));
    });
  });
});
