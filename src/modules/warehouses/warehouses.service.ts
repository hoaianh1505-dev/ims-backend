import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { WarehouseEntity } from './entities/warehouse.entity';
import { WarehouseLocationEntity } from './entities/warehouse-location.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { FilterWarehouseDto } from './dto/filter-warehouse.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,

    @InjectRepository(WarehouseLocationEntity)
    private readonly locationRepository: Repository<WarehouseLocationEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto): Promise<WarehouseEntity> {
    const code = createWarehouseDto.code.trim().toUpperCase();

    const existing = await this.warehouseRepository.findOne({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Mã kho "${code}" đã tồn tại`);
    }

    if (createWarehouseDto.manager_id) {
      const manager = await this.userRepository.findOne({
        where: { id: createWarehouseDto.manager_id },
      });
      if (!manager) {
        throw new BadRequestException('Quản lý kho (manager_id) không tồn tại');
      }
    }

    const warehouse = this.warehouseRepository.create({
      name: createWarehouseDto.name.trim(),
      code,
      manager_id: createWarehouseDto.manager_id || null,
      address: createWarehouseDto.address?.trim() || null,
      is_active: createWarehouseDto.is_active ?? true,
    });

    return await this.warehouseRepository.save(warehouse);
  }

  async findAll(query: FilterWarehouseDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<WarehouseEntity>[] = [];

    if (query.search?.trim()) {
      const keyword = `%${query.search.trim()}%`;
      const baseFilter: FindOptionsWhere<WarehouseEntity> = {};
      if (typeof query.is_active === 'boolean') {
        baseFilter.is_active = query.is_active;
      }
      where.push(
        { ...baseFilter, name: ILike(keyword) },
        { ...baseFilter, code: ILike(keyword) },
      );
    } else if (typeof query.is_active === 'boolean') {
      where.push({ is_active: query.is_active });
    }

    const [items, total] = await this.warehouseRepository.findAndCount({
      where: where.length > 0 ? where : undefined,
      relations: {
        manager: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        manager_id: true,
        manager: {
          id: true,
          username: true,
          display_name: true,
          email: true,
          role: true,
        },
      },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string): Promise<WarehouseEntity> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: {
        manager: true,
        locations: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        manager_id: true,
        manager: {
          id: true,
          username: true,
          display_name: true,
          email: true,
          role: true,
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Kho với ID "${id}" không tồn tại`);
    }

    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<WarehouseEntity> {
    const warehouse = await this.findOne(id);

    if (updateWarehouseDto.code && updateWarehouseDto.code.trim().toUpperCase() !== warehouse.code) {
      const newCode = updateWarehouseDto.code.trim().toUpperCase();
      const existing = await this.warehouseRepository.findOne({
        where: { code: newCode },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Mã kho "${newCode}" đã được sử dụng`);
      }
      warehouse.code = newCode;
    }

    if (updateWarehouseDto.manager_id !== undefined) {
      if (updateWarehouseDto.manager_id) {
        const manager = await this.userRepository.findOne({
          where: { id: updateWarehouseDto.manager_id },
        });
        if (!manager) {
          throw new BadRequestException('Quản lý kho (manager_id) không tồn tại');
        }
        warehouse.manager_id = updateWarehouseDto.manager_id;
      } else {
        warehouse.manager_id = null;
      }
    }

    if (updateWarehouseDto.name !== undefined) {
      warehouse.name = updateWarehouseDto.name.trim();
    }
    if (updateWarehouseDto.address !== undefined) {
      warehouse.address = updateWarehouseDto.address ? updateWarehouseDto.address.trim() : null;
    }
    if (updateWarehouseDto.is_active !== undefined) {
      warehouse.is_active = updateWarehouseDto.is_active;
    }

    return await this.warehouseRepository.save(warehouse);
  }

  async remove(id: string): Promise<{ message: string }> {
    const warehouse = await this.findOne(id);
    await this.warehouseRepository.remove(warehouse);
    return { message: `Đã xóa kho "${warehouse.name}" thành công` };
  }

  async findLocationsByWarehouse(warehouseId: string): Promise<WarehouseLocationEntity[]> {
    await this.findOne(warehouseId);

    return await this.locationRepository.find({
      where: { warehouse_id: warehouseId },
      order: { created_at: 'ASC' },
    });
  }

  async createLocation(
    warehouseId: string,
    createLocationDto: CreateLocationDto,
  ): Promise<WarehouseLocationEntity> {
    await this.findOne(warehouseId);

    const code = createLocationDto.code.trim().toUpperCase();

    const existing = await this.locationRepository.findOne({
      where: {
        warehouse_id: warehouseId,
        code,
      },
    });
    if (existing) {
      throw new ConflictException(`Vị trí "${code}" đã tồn tại trong kho này`);
    }

    const location = this.locationRepository.create({
      warehouse_id: warehouseId,
      code,
      name: createLocationDto.name.trim(),
      description: createLocationDto.description?.trim() || null,
    });

    return await this.locationRepository.save(location);
  }

  async updateLocation(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<WarehouseLocationEntity> {
    const location = await this.locationRepository.findOne({
      where: { id },
    });
    if (!location) {
      throw new NotFoundException(`Vị trí với ID "${id}" không tồn tại`);
    }

    if (updateLocationDto.code && updateLocationDto.code.trim().toUpperCase() !== location.code) {
      const newCode = updateLocationDto.code.trim().toUpperCase();
      const existing = await this.locationRepository.findOne({
        where: {
          warehouse_id: location.warehouse_id,
          code: newCode,
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Vị trí "${newCode}" đã tồn tại trong kho này`);
      }
      location.code = newCode;
    }

    if (updateLocationDto.name !== undefined) {
      location.name = updateLocationDto.name.trim();
    }
    if (updateLocationDto.description !== undefined) {
      location.description = updateLocationDto.description
        ? updateLocationDto.description.trim()
        : null;
    }

    return await this.locationRepository.save(location);
  }

  async removeLocation(id: string): Promise<{ message: string }> {
    const location = await this.locationRepository.findOne({
      where: { id },
    });
    if (!location) {
      throw new NotFoundException(`Vị trí với ID "${id}" không tồn tại`);
    }

    await this.locationRepository.remove(location);
    return { message: `Đã xóa vị trí "${location.name}" thành công` };
  }
}
