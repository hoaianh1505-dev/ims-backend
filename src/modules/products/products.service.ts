import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { ProductEntity } from './entities/product.entity';
import { ProductImageEntity } from './entities/product-image.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UnitEntity } from '../units/entities/unit.entity';
import { SupplierEntity } from '../suppliers/entities/supplier.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    private readonly uploadService: UploadService,
  ) {}

  async create(input: CreateProductDto): Promise<ProductEntity> {
    const sku = input.sku || `SKU-${Date.now().toString(36).toUpperCase()}`;

    const existingSku = await this.productRepository.findOne({
      where: { sku },
    });
    if (existingSku) {
      throw new ConflictException('Mã SKU sản phẩm đã tồn tại');
    }

    if (input.barcode) {
      const existingBarcode = await this.productRepository.findOne({
        where: { barcode: input.barcode },
      });
      if (existingBarcode) {
        throw new ConflictException('Mã vạch Barcode đã tồn tại');
      }
    }

    await this.validateForeignKeys(input.category_id, input.unit_id, input.supplier_id);

    const product = this.productRepository.create({
      name: input.name,
      sku,
      barcode: input.barcode || null as any,
      description: input.description || null as any,
      cost_price: input.cost_price ?? 0,
      selling_price: input.selling_price ?? 0,
      low_stock_threshold: input.low_stock_threshold ?? 10,
      category_id: input.category_id || null as any,
      unit_id: input.unit_id || null as any,
      supplier_id: input.supplier_id || null as any,
    });

    await this.productRepository.save(product);
    return product;
  }

  async findAll(query: FilterProductDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let where: FindOptionsWhere<ProductEntity> | FindOptionsWhere<ProductEntity>[] = {};

    if (query.search) {
      const keyword = ILike(`%${query.search.trim()}%`);
      const baseConditions = [
        { name: keyword },
        { sku: keyword },
        { barcode: keyword },
      ];

      where = baseConditions.map((condition) => ({
        ...condition,
        ...(query.category_id && { category_id: query.category_id }),
        ...(query.supplier_id && { supplier_id: query.supplier_id }),
        ...(query.unit_id && { unit_id: query.unit_id }),
      }));
    } else {
      const condition: FindOptionsWhere<ProductEntity> = {};
      if (query.category_id) condition.category_id = query.category_id;
      if (query.supplier_id) condition.supplier_id = query.supplier_id;
      if (query.unit_id) condition.unit_id = query.unit_id;
      where = condition;
    }

    const [products, total] = await this.productRepository.findAndCount({
      where,
      relations: {
        category: true,
        unit: true,
        supplier: true,
        images: true,
      },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        category: true,
        unit: true,
        supplier: true,
        images: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Sản phẩm với ID ${id} không tồn tại`);
    }

    return product;
  }

  async update(id: string, input: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.findOne(id);

    if (input.sku && input.sku !== product.sku) {
      const existingSku = await this.productRepository.findOne({
        where: { sku: input.sku },
      });
      if (existingSku && existingSku.id !== id) {
        throw new ConflictException('Mã SKU sản phẩm đã tồn tại');
      }
      product.sku = input.sku;
    }

    if (input.barcode && input.barcode !== product.barcode) {
      const existingBarcode = await this.productRepository.findOne({
        where: { barcode: input.barcode },
      });
      if (existingBarcode && existingBarcode.id !== id) {
        throw new ConflictException('Mã vạch Barcode đã tồn tại');
      }
      product.barcode = input.barcode;
    }

    await this.validateForeignKeys(input.category_id, input.unit_id, input.supplier_id);

    if (input.name !== undefined) product.name = input.name;
    if (input.description !== undefined) product.description = input.description;
    if (input.cost_price !== undefined) product.cost_price = input.cost_price;
    if (input.selling_price !== undefined) product.selling_price = input.selling_price;
    if (input.low_stock_threshold !== undefined) product.low_stock_threshold = input.low_stock_threshold;
    if (input.category_id !== undefined) product.category_id = input.category_id;
    if (input.unit_id !== undefined) product.unit_id = input.unit_id;
    if (input.supplier_id !== undefined) product.supplier_id = input.supplier_id;

    await this.productRepository.save(product);
    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.softRemove(product);
  }

  // --- Product Images Management ---

  async uploadProductImage(
    productId: string,
    file: Express.Multer.File,
    isPrimary?: boolean,
  ): Promise<ProductImageEntity> {
    await this.findOne(productId);

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Chỉ cho phép upload file định dạng hình ảnh (jpg, png, webp,...)');
    }

    const { url, key } = await this.uploadService.uploadFile(file, 'products');

    const imagesCount = await this.productImageRepository.count({
      where: { product_id: productId },
    });

    const shouldBePrimary = isPrimary ?? imagesCount === 0;

    if (shouldBePrimary && imagesCount > 0) {
      await this.productImageRepository.update(
        { product_id: productId },
        { is_primary: false },
      );
    }

    const image = this.productImageRepository.create({
      product_id: productId,
      image_url: url,
      s3_key: key,
      is_primary: shouldBePrimary,
    });

    return await this.productImageRepository.save(image);
  }

  async addImage(productId: string, input: CreateProductImageDto): Promise<ProductImageEntity> {
    await this.findOne(productId);

    const imagesCount = await this.productImageRepository.count({
      where: { product_id: productId },
    });

    const isPrimary = input.is_primary ?? imagesCount === 0;

    if (isPrimary && imagesCount > 0) {
      await this.productImageRepository.update(
        { product_id: productId },
        { is_primary: false },
      );
    }

    const image = this.productImageRepository.create({
      product_id: productId,
      image_url: input.image_url,
      s3_key: input.s3_key,
      is_primary: isPrimary,
    });

    return await this.productImageRepository.save(image);
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<ProductImageEntity> {
    const image = await this.productImageRepository.findOne({
      where: { id: imageId, product_id: productId },
    });

    if (!image) {
      throw new NotFoundException('Hình ảnh không tồn tại trên sản phẩm này');
    }

    await this.productImageRepository.update(
      { product_id: productId },
      { is_primary: false },
    );

    image.is_primary = true;
    return await this.productImageRepository.save(image);
  }

  async removeImage(productId: string, imageId: string): Promise<void> {
    const image = await this.productImageRepository.findOne({
      where: { id: imageId, product_id: productId },
    });

    if (!image) {
      throw new NotFoundException('Hình ảnh không tồn tại trên sản phẩm này');
    }

    // Delete image file from AWS S3
    if (image.s3_key) {
      await this.uploadService.deleteFile(image.s3_key);
    }

    await this.productImageRepository.remove(image);
  }

  private async validateForeignKeys(
    categoryId?: string,
    unitId?: string,
    supplierId?: string,
  ) {
    if (categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
      if (!category) {
        throw new BadRequestException('Danh mục không tồn tại');
      }
    }

    if (unitId) {
      const unit = await this.unitRepository.findOne({ where: { id: unitId } });
      if (!unit) {
        throw new BadRequestException('Đơn vị tính không tồn tại');
      }
    }

    if (supplierId) {
      const supplier = await this.supplierRepository.findOne({ where: { id: supplierId } });
      if (!supplier) {
        throw new BadRequestException('Nhà cung cấp không tồn tại');
      }
    }
  }
}
