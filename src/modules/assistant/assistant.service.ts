import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import { AssistantToolsService } from './assistant-tools.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { UserRole } from '../users/entities/user.entity';

const ASSISTANT_TOOL_DECLARATIONS = [
  {
    name: 'search_products',
    description:
      'Tìm kiếm danh sách sản phẩm theo tên, mã SKU hoặc mã vạch barcode',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            'Từ khóa tìm kiếm (tên sản phẩm, mã SKU hoặc mã vạch barcode)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product_inventory',
    description:
      'Tra cứu số lượng tồn kho chi tiết của một sản phẩm cụ thể theo từng kho và vị trí',
    parameters: {
      type: Type.OBJECT,
      properties: {
        product_name_or_sku: {
          type: Type.STRING,
          description: 'Tên hoặc mã SKU của sản phẩm cần kiểm tra tồn kho',
        },
      },
      required: ['product_name_or_sku'],
    },
  },
  {
    name: 'get_low_stock_products',
    description:
      'Lấy danh sách các sản phẩm đang chạm ngưỡng tồn kho tối thiểu hoặc đã hết hàng',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: 'Số lượng sản phẩm muốn lấy (mặc định 10)',
        },
      },
    },
  },
  {
    name: 'get_warehouse_list',
    description:
      'Lấy danh sách tất cả các kho hàng đang hoạt động trong hệ thống',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_recent_stock_transactions',
    description:
      'Tra cứu các phiếu giao dịch xuất kho, nhập kho, chuyển kho hoặc kiểm kê gần đây nhất',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: 'Số lượng giao dịch (mặc định 5)',
        },
        type: {
          type: Type.STRING,
          description:
            'Loại giao dịch nếu có: IMPORT, EXPORT, TRANSFER, hoặc ADJUSTMENT',
        },
      },
    },
  },
];

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private readonly genAI: GoogleGenAI | null = null;
  private readonly modelName = 'gemini-2.5-flash';

  constructor(
    private readonly configService: ConfigService,
    private readonly toolsService: AssistantToolsService,
  ) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'your_gemini_api_key' && apiKey.trim().length > 10) {
      this.genAI = new GoogleGenAI({ apiKey });
      this.logger.log('Google Gemini AI đã được khởi tạo thành công');
    } else {
      this.logger.warn(
        'GEMINI_API_KEY chưa được cấu hình. Trợ lý AI sẽ hoạt động ở chế độ fallback thông báo.',
      );
    }
  }

  private buildSystemInstruction(user?: any): string {
    const role = user?.role || UserRole.STAFF;
    const username = user?.display_name || user?.username || 'Người dùng';

    let roleGuidelines = '';

    if (role === UserRole.ADMIN) {
      roleGuidelines = `
- VAI TRÒ NGƯỜI DÙNG: QUẢN TRỊ VIÊN CẤP CAO (ADMIN).
- QUYỀN HẠN: Toàn quyền truy cập tất cả dữ liệu (toàn bộ kho, tất cả giao dịch, giá vốn, giá bán, giá trị hàng hóa).
- NHIỆM VỤ: 
  + Cung cấp số liệu phân tích tài chính, tổng giá trị tồn kho, giá vốn nhập hàng (cost_price) khi được hỏi.
  + Đưa ra khuyến nghị quản trị, cảnh báo kho quá tải hoặc hàng tồn đọng lâu ngày.
  + Xưng hô lịch sự, chuyên nghiệp: "Dạ thưa Quản trị viên" hoặc "Chào anh/chị".`;
    } else if (role === UserRole.MANAGER) {
      roleGuidelines = `
- VAI TRÒ NGƯỜI DÙNG: QUẢN LÝ KHO (MANAGER).
- QUYỀN HẠN: Quản lý điều hành xuất nhập tồn, luân chuyển hàng giữa các kho, theo dõi nhân viên và kiểm soát cảnh báo hết hàng.
- NHIỆM VỤ:
  + Cung cấp thông tin biến động kho, đề xuất tạo phiếu nhập hàng đối với các mặt hàng sắp hết.
  + Có thể cung cấp thông tin giá vốn và giá bán khi quản lý cần đối soát chi phí.
  + Xưng hô tôn trọng: "Chào Quản lý" hoặc "Chào anh/chị".`;
    } else {
      // STAFF
      roleGuidelines = `
- VAI TRÒ NGƯỜI DÙNG: NHÂN VIÊN VẬN HÀNH KHO (STAFF).
- VAI TRÒ THỰC TẾ: Nhân viên trực tiếp kiểm hàng, soạn hàng, xếp hàng lên kệ, bốc dỡ hàng.
- NGUYÊN TẮC BẢO MẬT & VẬN HÀNH CỰC KỲ QUAN TRỌNG:
  1. TUYỆT ĐỐI KHÔNG TIẾT LỘ GIÁ VỐN (cost_price) hoặc tổng giá trị tiền hàng triệu/tỷ đồng của công ty cho nhân viên.
  2. Nếu nhân viên hỏi về giá vốn nhập vào hay doanh thu lợi nhuận của công ty, hãy lịch sự từ chối: "Thông tin giá vốn/tài chính thuộc quyền quản lý của cấp Quản lý hoặc Admin, em không thể cung cấp ạ."
  3. TẬP TRUNG HỖ TRỢ VẬN HÀNH: Khi nhân viên hỏi về sản phẩm, hãy ưu tiên thông báo: SỐ LƯỢNG TỒN THỰC TẾ, ĐƠN VỊ TÍNH, VỊ TRÍ KỆ HÀNG (location) trong kho để nhân viên tìm hàng nhanh nhất.
  4. Nếu kết quả kho có thuộc tính 'is_user_assigned_warehouse: true', hãy ưu tiên báo số lượng tại kho mà nhân viên đó đang làm việc trước.
  5. Xưng hô gần gũi, hỗ trợ tận tình: "Chào bạn" hoặc "Dạ bạn".`;
    }

    return `
Bạn là Trợ lý AI Quản Lý Kho Hàng thông minh (IMS Assistant) trong hệ thống quản lý kho nội bộ.
Thông tin tài khoản đang kết nối:
- Họ tên/Username: ${username}
- Vai trò hệ thống: ${role}

${roleGuidelines}

QUY TẮC CHUNG CHO MỌI VAI TRÒ:
1. Bạn ĐƯỢC CẤP các công cụ (tools) truy vấn trực tiếp cơ sở dữ liệu kho. HÃY LUÔN CHỦ ĐỘNG GỌI TOOL để lấy số liệu thực tế trước khi trả lời.
2. TUYỆT ĐỐI KHÔNG TỰ BỊA ĐẶT số lượng tồn kho, mã SKU hoặc thông tin sản phẩm khi chưa gọi công cụ.
3. Trả lời bằng tiếng Việt tự nhiên, chuẩn mực, trình bày bảng biểu Markdown hoặc gạch đầu dòng rõ ràng, dễ nhìn.
`;
  }

  async chat(user: any, dto: ChatRequestDto) {
    if (!this.genAI) {
      return {
        reply:
          'Hệ thống chưa được thiết lập khóa GEMINI_API_KEY trong file môi trường (.env). Vui lòng cấu hình khóa API của Google Gemini để kích hoạt tính năng hỏi đáp thông minh với trợ lý kho hàng.',
        tool_calls: [],
      };
    }

    const contents: any[] = [];

    if (dto.history && dto.history.length > 0) {
      for (const item of dto.history.slice(-10)) {
        contents.push({
          role: item.role,
          parts: [{ text: item.content }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: dto.message }],
    });

    const executedTools: Array<{ name: string; args: any; result: any }> = [];
    const systemInstruction = this.buildSystemInstruction(user);

    try {
      let finalReply = '';
      let loopCount = 0;
      const maxLoops = 4;

      while (loopCount < maxLoops) {
        loopCount++;

        const response = await this.genAI.models.generateContent({
          model: this.modelName,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: ASSISTANT_TOOL_DECLARATIONS as any }],
            temperature: 0.2,
          },
        });

        const candidate = response.candidates?.[0];
        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0 && candidate?.content) {
          contents.push(candidate.content);

          const toolResponseParts: any[] = [];

          for (const call of functionCalls) {
            const toolName = call.name || '';
            const toolResult = await this.toolsService.executeTool(
              toolName,
              (call.args as Record<string, any>) || {},
              user,
            );

            executedTools.push({
              name: toolName,
              args: call.args,
              result: toolResult,
            });

            toolResponseParts.push({
              functionResponse: {
                name: toolName,
                response: { result: toolResult },
              },
            });
          }

          contents.push({
            role: 'user',
            parts: toolResponseParts,
          });
        } else {
          finalReply =
            response.text ||
            'Tôi đã tiếp nhận câu hỏi nhưng không thể tạo câu trả lời phù hợp.';
          break;
        }
      }

      return {
        reply: finalReply,
        tool_calls: executedTools,
      };
    } catch (error) {
      this.logger.error('Lỗi khi gọi Google Gemini API:', error);

      return {
        reply:
          'Đã xảy ra lỗi trong quá trình kết nối với trợ lý AI. Vui lòng kiểm tra lại GEMINI_API_KEY hoặc thử lại sau giây lát.',
        tool_calls: [],
      };
    }
  }
}
