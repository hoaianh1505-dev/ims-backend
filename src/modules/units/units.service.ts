import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { UnitEntity } from './entities/unit.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { FilterUnitDto } from './dto/filter-unit.dto';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
  ) {}

  async create(createUnitDto: CreateUnitDto): Promise<UnitEntity> {
    const existingUnit = await this.unitRepository.findOne({
      where: { name: createUnitDto.name.trim() },
    });
    if (existingUnit) {
      throw new ConflictException(`Đơn vị tính "${createUnitDto.name}" đã tồn tại`);
    }

    const unit = this.unitRepository.create({
      ...createUnitDto,
      name: createUnitDto.name.trim(),
    });
    return await this.unitRepository.save(unit);
  }

  async findAll(query: FilterUnitDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const whereConditions: any = [];

    if (query.search) {
      const keyword = `%${query.search.trim()}%`;
      whereConditions.push(
        { name: ILike(keyword) },
        { symbol: ILike(keyword) },
      );
    }

    const [units, total] = await this.unitRepository.findAndCount({
      where: whereConditions.length > 0 ? whereConditions : {},
      order: { created_at: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data: units,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<UnitEntity> {
    const unit = await this.unitRepository.findOne({ where: { id } });
    if (!unit) {
      throw new NotFoundException(`Đơn vị tính với ID ${id} không tồn tại`);
    }
    return unit;
  }

  async update(id: string, updateUnitDto: UpdateUnitDto): Promise<UnitEntity> {
    const unit = await this.findOne(id);

    if (updateUnitDto.name && updateUnitDto.name.trim() !== unit.name) {
      const existing = await this.unitRepository.findOne({
        where: { name: updateUnitDto.name.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Đơn vị tính "${updateUnitDto.name}" đã tồn tại`);
      }
      unit.name = updateUnitDto.name.trim();
    }

    if (updateUnitDto.symbol !== undefined) {
      unit.symbol = updateUnitDto.symbol;
    }

    return await this.unitRepository.save(unit);
  }

  async remove(id: string): Promise<void> {
    const unit = await this.findOne(id);
    await this.unitRepository.remove(unit);
  }
}
