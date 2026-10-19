import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { CategoryEntity } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    if (createCategoryDto.parent_id) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parent_id },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll(filter: FilterCategoryDto) {
    if (filter.tree) {
      const categories = await this.categoryRepository.find({
        order: { created_at: 'ASC' },
      });
      return this.buildTree(categories);
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<CategoryEntity> = {};

    if (filter.search) {
      where.name = ILike(`%${filter.search}%`);
    }

    if (filter.parent_id !== undefined) {
      where.parent_id = filter.parent_id;
    }

    const [categories, total] = await this.categoryRepository.findAndCount({
      where,
      relations: { parent: true },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: categories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.findOne(id);

    if (updateCategoryDto.parent_id !== undefined) {
      if (updateCategoryDto.parent_id === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      if (updateCategoryDto.parent_id !== null) {
        const parent = await this.categoryRepository.findOne({
          where: { id: updateCategoryDto.parent_id },
        });
        if (!parent) {
          throw new NotFoundException('Parent category not found');
        }

        const isCircular = await this.isDescendantOf(updateCategoryDto.parent_id, id);
        if (isCircular) {
          throw new BadRequestException(
            'Cannot set a descendant category as parent (circular reference)',
          );
        }
      }
    }

    const updatedCategory = this.categoryRepository.merge(category, updateCategoryDto);
    return await this.categoryRepository.save(updatedCategory);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    const childrenCount = await this.categoryRepository.count({
      where: { parent_id: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete category that contains subcategories. Please reassign or delete subcategories first.',
      );
    }

    await this.categoryRepository.remove(category);
  }

  private buildTree(categories: CategoryEntity[], parentId: string | null = null): any[] {
    return categories
      .filter((cat) => (cat.parent_id ?? null) === parentId)
      .map((cat) => ({
        ...cat,
        children: this.buildTree(categories, cat.id),
      }));
  }

  private async isDescendantOf(candidateId: string, ancestorId: string): Promise<boolean> {
    let currentId: string | null = candidateId;
    while (currentId) {
      if (currentId === ancestorId) {
        return true;
      }
      const current = await this.categoryRepository.findOne({
        where: { id: currentId },
      });
      currentId = current?.parent_id ?? null;
    }
    return false;
  }
}
