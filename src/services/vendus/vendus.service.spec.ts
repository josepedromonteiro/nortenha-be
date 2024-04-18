import { Test, TestingModule } from '@nestjs/testing';
import { VendusService } from './vendus.service';

describe('VendusService', () => {
  let service: VendusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendusService],
    }).compile();

    service = module.get<VendusService>(VendusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
