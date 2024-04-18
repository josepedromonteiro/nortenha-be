import { Injectable } from '@nestjs/common';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WoocommerceService {
  constructor(private readonly config: ConfigService) {}
  instance: WooCommerceRestApi = new WooCommerceRestApi({
    url: 'https://companhianortenha.com',
    consumerKey: this.config.get('WOO_CONSUMER_KEY'),
    consumerSecret: this.config.get('WOO_CONSUMER_SECRET'),
    version: 'wc/v3',
  });
}
