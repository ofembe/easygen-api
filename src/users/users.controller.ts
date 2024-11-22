import { Body, Controller, Post, Get, Res, Req } from '@nestjs/common';
import { Response } from 'express';

import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

const USER_COOKIE_NAME = "userId";

@Controller('auth')
export class UsersController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @Post('/signup')
  async SignUp(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponseDto> {
    const user = await this.authService.signUp(
      createUserDto.name,
      createUserDto.email,
      createUserDto.password,
    );
    this.setUserIdCookie(response, user.id);
    return plainToInstance(UserResponseDto, user);

  }

  @Post('/signin')
  async signIn(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponseDto> {
    const user = await this.authService.signIn(
      loginUserDto.email,
      loginUserDto.password,
    );

    this.setUserIdCookie(response, user.id);
    return plainToInstance(UserResponseDto, user);
  }

  @Get('/signout')
  async signOut(@Res({ passthrough: true }) response: Response) {
    this.clearUserIdCookie(response);
  }

  @Get('/user')
  async getUser(@Req() request: Request): Promise<UserResponseDto> {
    // @ts-ignore
    const userId = request.cookies?.userId;
    const user = this.userService.findById(userId);
    return plainToInstance(UserResponseDto, user);
  }

  private setUserIdCookie(response: Response, userId: string) {
    response.cookie(USER_COOKIE_NAME, userId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 15,
    });
  }

  private clearUserIdCookie(response: Response) {
    response.cookie(USER_COOKIE_NAME, '', {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  }
}
