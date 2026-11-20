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
  {
    name: 'get_top_inventory_products',
    description:
      'Lấy danh sách các mặt hàng có số lượng tồn kho nhiều nhất hoặc giá trị tồn kho lớn nhất trong toàn hệ thống',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: 'Số lượng sản phẩm muốn lấy (mặc định 5 hoặc 10)',
        },
        sort_by: {
          type: Type.STRING,
          description:
            'Sắp xếp theo số lượng (quantity) hoặc giá trị tồn kho (value)',
        },
      },
    },
  },
  {
    name: 'get_inventory_overview_stats',
    description:
      'Lấy số liệu thống kê tổng quan về toàn bộ kho hàng: tổng giá trị tồn kho, tổng số lượng hàng, số mặt hàng, số kho, tỷ trọng ngành hàng',
    parameters: {
      type: Type.OBJECT,
      properties: {},
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
    const isStaff = role === UserRole.STAFF;

    return `
Bạn là Trợ lý AI Quản Lý Kho Hàng thông minh (IMS Assistant) trong hệ thống quản lý kho nội bộ.

NGUYÊN TẮC GIAO TIẾP & XƯNG HÔ:
- Xưng hô lịch sự, gần gũi, tự nhiên: Xưng là "Tôi" hoặc "Em", gọi người dùng là "Bạn" hoặc "Anh/Chị".
- TUYỆT ĐỐI KHÔNG dùng từ ngữ cứng nhắc hay danh xưng như "Dạ thưa Quản trị viên", "Thưa Quản lý", "Chào sếp". Hãy nói chuyện tự nhiên như một trợ lý chuyên nghiệp.

NGUYÊN TẮC BẢO MẬT:
${
  isStaff
    ? '- Người dùng đang là Nhân viên vận hành kho (STAFF): KHÔNG tiết lộ giá vốn nhập hàng (cost_price) hay tổng giá trị tài sản kho. Chỉ cung cấp số lượng tồn kho thực tế, đơn vị tính và vị trí kệ để hỗ trợ soạn hàng.'
    : '- Người dùng có quyền Quản lý/Admin: Có thể cung cấp đầy đủ thông tin số lượng tồn, giá trị hàng hóa và phân tích khi được hỏi.'
}

NGUYÊN TẮC TRUY VẤN DỮ LIỆU:
1. Bạn ĐƯỢC TRANG BỊ các công cụ (tools) kết nối trực tiếp cơ sở dữ liệu PostgreSQL. HÃY LUÔN GỌI TOOL để lấy số liệu thực tế trước khi trả lời.
2. CÁC CÂU HỎI PHỔ BIẾN:
   - "Loại hàng / sản phẩm nào có số lượng nhiều nhất?" hoặc "Top hàng tồn kho?" -> HÃY GỌI NGAY CÔNG CỤ \`get_top_inventory_products\` hoặc \`get_inventory_overview_stats\`!
   - "Tổng quan kho bãi", "Có bao nhiêu kho?", "Tổng tồn bao nhiêu?" -> GỌI \`get_inventory_overview_stats\` hoặc \`get_warehouse_list\`!
   - "Hàng nào sắp hết?", "Cảnh báo thiếu hàng?" -> GỌI \`get_low_stock_products\`!
   - "Kiểm tra sản phẩm X còn bao nhiêu?" -> GỌI \`get_product_inventory\` hoặc \`search_products\`!
   - "Giao dịch gần đây?" -> GỌI \`get_recent_stock_transactions\`!
3. TUYỆT ĐỐI KHÔNG BỊA ĐẶT SỐ LIỆU và KHÔNG từ chối khi đã có công cụ hỗ trợ.
4. Trình bày câu trả lời gãy gọn bằng tiếng Việt, dùng Markdown (in đậm, danh sách dấu chấm) dễ đọc.
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
