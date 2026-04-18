import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { KycService } from './kyc.service';

describe('UsersController - identifier acceptance', () => {
  let controller: UsersController;
  const mockUsersService = {
    resolveUserIdentifier: jest.fn(),
    getPublicProfile: jest.fn(),
    transformToSafeUser: jest.fn(),
  };

  const mockKycService = {
    submitKyc: jest.fn(),
    getSubmissionsByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: KycService, useValue: mockKycService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('getPublicProfile accepts publicId', async () => {
    mockUsersService.resolveUserIdentifier.mockResolvedValue({ id: 'uuid-1' });
    mockUsersService.getPublicProfile.mockResolvedValue({ id: 'uuid-1', name: 'Dr. John' });
    const res = await controller.getPublicProfile('DR919768304');
    expect(mockUsersService.resolveUserIdentifier).toHaveBeenCalledWith('DR919768304');
    expect(res.id).toBe('uuid-1');
  });

  it('findOne accepts UUID and returns safe user', async () => {
    mockUsersService.resolveUserIdentifier.mockResolvedValue({ id: 'uuid-2' });
    mockUsersService.transformToSafeUser.mockReturnValue({ id: 'uuid-2', email: 'a@b.com', roles: [], isActive: true, createdAt: new Date(), updatedAt: new Date() });
    const res = await controller.findOne('uuid-2');
    expect(mockUsersService.resolveUserIdentifier).toHaveBeenCalledWith('uuid-2');
    expect(res.id).toBe('uuid-2');
  });

  it('resolve endpoint maps publicId to uuid', async () => {
    mockUsersService.resolveUserIdentifier.mockResolvedValue({ id: 'uuid-3', displayId: 'DR1', profile: { displayName: 'Dr. John' } });
    const res = await controller.resolvePublicId('DR1');
    expect(res.uuid).toBe('uuid-3');
    expect(res.publicId).toBe('DR1');
  });
});


