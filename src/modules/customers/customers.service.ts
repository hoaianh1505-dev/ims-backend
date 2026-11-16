import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterCustomerDto } from './dto/filter-customer.dto';
import { StockTransactionEntity } from '../stock-transactions/entities/stock-transaction.entity';
import { generateReferenceCode } from '../../common/utils/code-generator.util';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(StockTransactionEntity)
    private readonly transactionRepo: Repository<StockTransactionEntity>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<CustomerEntity> {
    let code = dto.code ? dto.code.trim().toUpperCase() : '';

    if (code) {
      const existing = await this.customerRepo.findOne({ where: { code } });
      if (existing) {
        throw new ConflictException(`Mã khách hàng "${code}" đã tồn tại trên hệ thống`);
      }
    } else {
      let attempts = 0;
      while (attempts < 5) {
        const candidate = generateReferenceCode('KH');
        const exists = await this.customerRepo.findOne({ where: { code: candidate } });
        if (!exists) {
          code = candidate;
          break;
        }
        attempts++;
      }
      if (!code) {
        code = `KH-${Date.now()}`;
      }
    }

    const customer = this.customerRepo.create({
      code,
      name: dto.name.trim(),
      phone: dto.phone?.trim() || null,
      email: dto.email?.trim().toLowerCase() || null,
      address: dto.address?.trim() || null,
      type: dto.type,
      tax_id: dto.tax_id?.trim() || null,
      debt_limit: dto.debt_limit || 0,
      current_debt: 0,
      is_active: dto.is_active !== undefined ? dto.is_active : true,
      note: dto.note?.trim() || null,
    });

    return await this.customerRepo.save(customer);
  }

  async findAll(query: FilterCustomerDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const qb = this.customerRepo.createQueryBuilder('c');

    if (query.type) {
      qb.andWhere('c.type = :type', { type: query.type });
    }

    if (query.is_active !== undefined) {
      qb.andWhere('c.is_active = :isActive', { isActive: query.is_active });
    }

    if (query.search) {
      qb.andWhere(
        '(c.name ILIKE :search OR c.code ILIKE :search OR c.phone ILIKE :search OR c.email ILIKE :search OR c.tax_id ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('c.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<CustomerEntity> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Khách hàng với ID "${id}" không tồn tại`);
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerEntity> {
    const customer = await this.findOne(id);

    if (dto.code && dto.code.trim().toUpperCase() !== customer.code) {
      const newCode = dto.code.trim().toUpperCase();
      const existing = await this.customerRepo.findOne({ where: { code: newCode } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Mã khách hàng "${newCode}" đã tồn tại`);
      }
      customer.code = newCode;
    }

    if (dto.name !== undefined) customer.name = dto.name.trim();
    if (dto.phone !== undefined) customer.phone = dto.phone ? dto.phone.trim() : null;
    if (dto.email !== undefined) customer.email = dto.email ? dto.email.trim().toLowerCase() : null;
    if (dto.address !== undefined) customer.address = dto.address ? dto.address.trim() : null;
    if (dto.type !== undefined) customer.type = dto.type;
    if (dto.tax_id !== undefined) customer.tax_id = dto.tax_id ? dto.tax_id.trim() : null;
    if (dto.debt_limit !== undefined) customer.debt_limit = dto.debt_limit;
    if (dto.is_active !== undefined) customer.is_active = dto.is_active;
    if (dto.note !== undefined) customer.note = dto.note ? dto.note.trim() : null;

    return await this.customerRepo.save(customer);
  }

  async delete(id: string): Promise<void> {
    const customer = await this.findOne(id);

    // Kiểm tra xem khách hàng đã từng phát sinh giao dịch xuất kho chưa
    const txCount = await this.transactionRepo.count({
      where: { customer_id: id },
    });

    if (txCount > 0) {
      throw new BadRequestException(
        `Không thể xóa khách hàng "${customer.name}" vì đã phát sinh ${txCount} phiếu xuất kho. Hãy chuyển trạng thái sang "Tạm ngưng".`,
      );
    }

    await this.customerRepo.remove(customer);
  }

  async getCustomerTransactions(id: string, limit = 20) {
    await this.findOne(id);

    return await this.transactionRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.warehouse', 'warehouse')
      .leftJoinAndSelect('tx.creator', 'creator')
      .leftJoinAndSelect('tx.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('tx.customer_id = :id', { id })
      .orderBy('tx.created_at', 'DESC')
      .take(limit)
      .getMany();
  }
}
