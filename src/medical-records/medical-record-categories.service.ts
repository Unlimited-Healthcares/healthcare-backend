
import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecordCategory } from './entities/medical-record-category.entity';
import { MedicalRecord } from './entities/medical-record.entity';

export class CreateCategoryDto {
  name: string;
  description?: string;
  parentCategoryId?: string;
}

export class UpdateCategoryDto {
  name?: string;
  description?: string;
  parentCategoryId?: string;
  isActive?: boolean;
}

export interface CategoryTreeItem extends MedicalRecordCategory {
  recordCount: number;
  children: CategoryTreeItem[];
}

@Injectable()
export class MedicalRecordCategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(MedicalRecordCategory)
    private categoriesRepository: Repository<MedicalRecordCategory>,
    @InjectRepository(MedicalRecord)
    private recordsRepository: Repository<MedicalRecord>,
  ) { }

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  private async seedDefaultCategories() {
    const defaultCategories = [
      { name: 'Laboratory Results', description: 'Blood tests, urine tests, and other lab work', color: 'bg-blue-500', icon: 'test-tube' },
      { name: 'Medical Imaging', description: 'X-rays, MRI, CT scans, and other imaging studies', color: 'bg-purple-500', icon: 'image' },
      { name: 'Prescriptions', description: 'Medication prescriptions and pharmacy records', color: 'bg-emerald-500', icon: 'pill' },
      { name: 'Consultations', description: 'Doctor visits and consultation notes', color: 'bg-amber-500', icon: 'user' },
      { name: 'Procedures', description: 'Surgical procedures and medical interventions', color: 'bg-rose-500', icon: 'activity' },
    ];

    for (const cat of defaultCategories) {
      const exists = await this.categoriesRepository.findOne({ where: { name: cat.name } });
      if (!exists) {
        await this.categoriesRepository.save(this.categoriesRepository.create({
          ...cat,
          isActive: true
        }));
        console.log(`✅ Seeded medical record category: ${cat.name}`);
      }
    }
  }

  async getAllCategories(): Promise<MedicalRecordCategory[]> {
    return await this.categoriesRepository.find({
      where: { isActive: true },
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });
  }

  async getCategoryById(id: string): Promise<MedicalRecordCategory> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<MedicalRecordCategory> {
    // Check if category name already exists
    const existingCategory = await this.categoriesRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Validate parent category if provided
    if (createCategoryDto.parentCategoryId) {
      const parentCategory = await this.getCategoryById(createCategoryDto.parentCategoryId);
      if (!parentCategory.isActive) {
        throw new ConflictException('Parent category is not active');
      }
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    return await this.categoriesRepository.save(category);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<MedicalRecordCategory> {
    const category = await this.getCategoryById(id);

    // Check if new name conflicts with existing categories (excluding current one)
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Validate parent category if being updated
    if (updateCategoryDto.parentCategoryId) {
      const parentCategory = await this.getCategoryById(updateCategoryDto.parentCategoryId);
      if (!parentCategory.isActive) {
        throw new ConflictException('Parent category is not active');
      }

      // Prevent circular references
      if (await this.wouldCreateCircularReference(id, updateCategoryDto.parentCategoryId)) {
        throw new ConflictException('Cannot set parent category: would create circular reference');
      }
    }

    await this.categoriesRepository.update(id, updateCategoryDto);
    return await this.getCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.getCategoryById(id);

    // Check if category has children
    const childrenCount = await this.categoriesRepository.count({
      where: { parentCategoryId: id, isActive: true },
    });

    if (childrenCount > 0) {
      throw new ConflictException('Cannot delete category with active subcategories');
    }

    // Soft delete by marking as inactive
    await this.categoriesRepository.update(id, { isActive: false });
  }

  async getCategoryHierarchy(centerId?: string): Promise<CategoryTreeItem[]> {
    const allCategories = await this.getAllCategories();

    // Build hierarchy by filtering root categories and building tree
    const rootCategories = allCategories.filter(cat => !cat.parentCategoryId);

    return await this.buildCategoryTree(rootCategories, allCategories, centerId);
  }

  private async buildCategoryTree(
    parents: MedicalRecordCategory[],
    allCategories: MedicalRecordCategory[],
    centerId?: string
  ): Promise<CategoryTreeItem[]> {
    const result: CategoryTreeItem[] = [];

    for (const parent of parents) {
      const children = allCategories.filter(cat => cat.parentCategoryId === parent.id);

      // Get record count for this category name
      const recordCount = await this.recordsRepository.count({
        where: {
          category: parent.name,
          ...(centerId ? { centerId } : {}),
          status: 'active'
        }
      });

      result.push({
        ...parent,
        recordCount,
        children: children.length > 0 ? await this.buildCategoryTree(children, allCategories, centerId) : [],
      });
    }

    return result;
  }

  private async wouldCreateCircularReference(categoryId: string, potentialParentId: string): Promise<boolean> {
    let currentParentId = potentialParentId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        return true;
      }

      const parent = await this.categoriesRepository.findOne({
        where: { id: currentParentId },
      });

      currentParentId = parent?.parentCategoryId;
    }

    return false;
  }
}
