import { Test, TestingModule } from '@nestjs/testing';
import { BypassController } from './bypass.controller';

describe('BypassController', () => {
  let controller: BypassController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BypassController],
    }).compile();

    controller = module.get<BypassController>(BypassController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
