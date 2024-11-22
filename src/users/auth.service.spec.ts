import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common/exceptions';

let service: AuthService;
let fakeUsersService: Partial<UsersService>;
let users: User[] = [];


describe('AuthService', () => {

  beforeEach(async () => {
    users = [];
    const fakeUser: User = {
      _id: 'randomId',
      id: 'randomId',
      name: 'Test Name',
      email: '',
      password: 'TestPassword',
    };
    fakeUsersService = {
      create: (name: string, email: string, password) => {
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
      findOne: (email: string) => {
        const filteredUser = users.find((user) => user.email == email);
        return Promise.resolve(filteredUser as User);
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a a salted and hashed password', async () => {
    const signupPassword = 'signupPassword';
    const user = service.signUp(
      'Signup Name',
      'signupEmail@signup.com',
      signupPassword,
    );
    expect((await user).password).not.toEqual(signupPassword);
    const [salt, hash] = (await user).password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    const targetEmail = 'targetsignup@target.com';
    await service.signUp('Name', targetEmail, 'MyPassword1@');
    await expect(service.signUp('Name', targetEmail, 'asdf')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(
      service.signIn('asdflkj@asdlfkj.com', 'passdflkj'),
    ).rejects.toThrow(NotFoundException);
  });
  it('throws if an invalid password is provided', async () => {
    const targetEmail = 'targetinvalidpasswordemail@target.com';
    await service.signUp('Name', targetEmail, 'MyPassword1@');
    await expect(service.signIn(targetEmail, 'passowrd')).rejects.toThrow(
      BadRequestException,
    );
  });
  it('returns user if correct password is provided', async () => {
    const targetEmail = 'target@target.com';
    await service.signUp('Name', targetEmail, 'MyPassword1@');
    const user = await service.signIn(targetEmail, 'MyPassword1@');
    expect(user).toBeDefined();
  });
});
