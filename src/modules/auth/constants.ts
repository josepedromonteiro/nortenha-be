import * as process from 'process';
import { SetMetadata } from '@nestjs/common';

export const jwtConstants = {
  secret: process.env.SECRET,
};

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
