import { Injectable } from '@nestjs/common';
import axios, { Method } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WordpressService {
  constructor(private readonly config: ConfigService) {}

  public request = (domain: string, method: Method, data?: any) => {
    return axios({
      method,
      url: `${this.config.get('WORDPRESS_URL')}/${domain}`,
      data,
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.config.get('WORDPRESS_USERNAME')}:${this.config.get('WORDPRESS_PASSWORD')}`).toString('base64')}`,
      },
    });
  };
}
