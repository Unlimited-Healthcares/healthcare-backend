import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { IdGeneratorService } from './services/id-generator.service';
import { PatientsService } from '../patients/patients.service';

describe('UsersService - resolveUserIdentifier', () => {
  let service: UsersService;
  let usersRepo: Repository<User>;

  const mockUsersRepo = {
    findOne: jest.fn(),
  } as unknown as Repository<User>;

  const mockProfilesRepo = {
    findOne: jest.fn(),
  } as unknown as Repository<Profile>;

  const mockIdGeneratorService = {
    generateDisplayId: jest.fn().mockReturnValue('DR000000001'),
  };

  const mockPatientsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: getRepositoryToken(Profile), useValue: mockProfilesRepo },
        { provide: IdGeneratorService, useValue: mockIdGeneratorService },
        { provide: PatientsService, useValue: mockPatientsService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepo = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('resolves by UUID (id)', async () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const user: Partial<User> = {
      id: uuid,
      displayId: 'DR919768304',
      isActive: true,
      profile: { displayName: 'Dr. John Smith' } as Profile,
    };
    (usersRepo.findOne as unknown as jest.Mock).mockResolvedValue(user);

    const result = await service.resolveUserIdentifier(uuid);
    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: uuid }, relations: ['profile'] });
    expect(result.id).toBe(uuid);
  });

  it('resolves by publicId (displayId)', async () => {
    const publicId = 'DR919768304';
    const user: Partial<User> = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      displayId: publicId,
      isActive: true,
      profile: { displayName: 'Dr. John Smith' } as Profile,
    };
    (usersRepo.findOne as unknown as jest.Mock).mockResolvedValue(user);

    const result = await service.resolveUserIdentifier(publicId);
    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { displayId: publicId }, relations: ['profile'] });
    expect(result.displayId).toBe(publicId);
  });

  it('throws NotFound when user missing or inactive', async () => {
    (usersRepo.findOne as unknown as jest.Mock).mockResolvedValue(null);
    await expect(service.resolveUserIdentifier('UNKNOWN')).rejects.toBeTruthy();
  });
});


