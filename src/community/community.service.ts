import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityPost } from './entities/post.entity';
import { CommunityEvent } from './entities/event.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunityPost)
    private postRepository: Repository<CommunityPost>,
    @InjectRepository(CommunityEvent)
    private eventRepository: Repository<CommunityEvent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async findAll(category?: string): Promise<CommunityPost[]> {
    const query = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile');

    if (category && category !== 'all') {
      query.andWhere('post.type = :category', { category });
    }

    return query.orderBy('post.createdAt', 'DESC').getMany();
  }

  async create(createPostDto: CreatePostDto, user: User): Promise<CommunityPost> {
    const post = this.postRepository.create({
      ...createPostDto,
      author: user,
    });
    return this.postRepository.save(post);
  }

  async like(id: string): Promise<CommunityPost> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    post.likes += 1;
    return this.postRepository.save(post);
  }

  async getSuggestedMembers(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['profile'],
      take: 5,
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    });
  }

  async getUpcomingEvents(): Promise<CommunityEvent[]> {
    return this.eventRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: 5
    });
  }
}

