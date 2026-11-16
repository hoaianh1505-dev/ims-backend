import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterCustomerDto } from './dto/filter-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy danh sách khách hàng & đại lý (phân trang, lọc theo phân loại, trạng thái, tìm kiếm)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách khách hàng tải thành công' })
  findAll(@Query() query: FilterCustomerDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết một khách hàng theo ID',
  })
  @ApiResponse({ status: 200, description: 'Thông tin khách hàng' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/transactions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy lịch sử các phiếu xuất kho bán hàng của khách hàng này',
  })
  @ApiResponse({ status: 200, description: 'Lịch sử giao dịch của khách hàng' })
  getCustomerTransactions(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getCustomerTransactions(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Tạo mới hồ sơ khách hàng / đại lý phân phối',
  })
  @ApiResponse({ status: 201, description: 'Khách hàng được tạo thành công' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Cập nhật thông tin khách hàng / đại lý',
  })
  @ApiResponse({ status: 200, description: 'Khách hàng được cập nhật thành công' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Xóa hồ sơ khách hàng (chỉ xóa được nếu chưa từng phát sinh phiếu xuất kho)',
  })
  @ApiResponse({ status: 200, description: 'Khách hàng được xóa thành công' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.delete(id);
  }
}
