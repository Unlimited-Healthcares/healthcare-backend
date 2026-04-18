import { Test, TestingModule } from '@nestjs/testing';
import { UploadsService } from './uploads.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('UploadsService', () => {
  let service: UploadsService;

  const mockSupabaseService = {
    uploadFile: jest.fn(),
    getFileUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
