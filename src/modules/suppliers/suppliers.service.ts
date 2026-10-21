import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { SupplierEntity } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { FilterSupplierDto } from './dto/filter-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<SupplierEntity> {
    if (createSupplierDto.code) {
      const existingCode = await this.supplierRepository.findOne({
        where: { code: createSupplierDto.code.trim() },
      });
      if (existingCode) {
        throw new ConflictException(`Mã nhà cung cấp "${createSupplierDto.code}" đã tồn tại`);
      }
    }

    const supplier = this.supplierRepository.create({
      ...createSupplierDto,
      code: createSupplierDto.code ? createSupplierDto.code.trim() : undefined,
    });

    return await this.supplierRepository.save(supplier);
  }

  async findAll(query: FilterSupplierDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (query.search) {
      const keyword = `%${query.search.trim()}%`;
      const searchFields = [
        { name: ILike(keyword) },
        { code: ILike(keyword) },
        { contact_name: ILike(keyword) },
        { phone: ILike(keyword) },
      ];

      if (query.is_active !== undefined) {
        where = searchFields.map((field) => ({ ...field, is_active: query.is_active }));
      } else {
        where = searchFields;
      }
    } else if (query.is_active !== undefined) {
      where = { is_active: query.is_active };
    }

    const [suppliers, total] = await this.supplierRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: suppliers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<SupplierEntity> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Nhà cung cấp với ID ${id} không tồn tại`);
    }
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<SupplierEntity> {
    const supplier = await this.findOne(id);

    if (updateSupplierDto.code && updateSupplierDto.code.trim() !== supplier.code) {
      const existing = await this.supplierRepository.findOne({
        where: { code: updateSupplierDto.code.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Mã nhà cung cấp "${updateSupplierDto.code}" đã tồn tại`);
      }
      updateSupplierDto.code = updateSupplierDto.code.trim();
    }

    const updatedSupplier = this.supplierRepository.merge(supplier, updateSupplierDto);
    return await this.supplierRepository.save(updatedSupplier);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.softRemove(supplier);
  }
}
