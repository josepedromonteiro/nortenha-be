import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  VendusRequestParams,
  VendusService,
} from '../../services/vendus/vendus.service';
import { Response } from 'express';

@Controller('bypass')
export class BypassController {
  constructor(private readonly vendusService: VendusService) {}

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
}
