import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  VendusRequestParams,
  VendusService,
} from '../../services/vendus/vendus.service';
import { Response } from 'express';
import {
  WoocommerceRequestParams,
  WoocommerceService,
} from '../../services/woocommerce/woocommerce.service';

@Controller('bypass')
export class BypassController {
  constructor(
    private readonly vendusService: VendusService,
    private readonly wooService: WoocommerceService,
  ) {}

  @Post('vendus')
  vendus(@Body() body: VendusRequestParams, @Res() response: Response) {
    return this.vendusService
      .request({
        baseUrl: 'https://www.vendus.pt/ws',
        apiVersion: 'v1.1',
        ...body,
      })
      .then((res) => {
        response.json(res.data);
      });
  }

  @Post('woocommerce')
  woocommerce(
    @Body() body: WoocommerceRequestParams,
    @Res() response: Response,
  ) {
    return (
      this.wooService
        .request({
          ...body,
        })
        // .catch((res) => {
        //   return response.json(res);
        // })
        .then((res) => {
          response.json(res.data);
        })
    );
  }
}
