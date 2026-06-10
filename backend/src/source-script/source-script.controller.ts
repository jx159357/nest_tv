import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../admin/admin-role.guard';
import { SourceScriptService, ScriptHook } from './source-script.service';

class SaveScriptDto {
  id?: number;
  key!: string;
  name!: string;
  code!: string;
  description?: string;
  config?: Record<string, string>;
}

class TestScriptDto {
  code!: string;
  config?: Record<string, string>;
}

class ExecuteHookDto {
  hook!: ScriptHook;
  args?: unknown[];
}

@ApiTags('source-scripts')
@Controller('source-scripts')
export class SourceScriptController {
  constructor(private readonly service: SourceScriptService) {}

  @Get()
  @ApiOperation({ summary: 'List all scripts' })
  @ApiResponse({ status: 200, description: 'Scripts listed' })
  async findAll() {
    return this.service.findAll();
  }

  @Get('template')
  @ApiOperation({ summary: 'Get script template' })
  @ApiResponse({ status: 200, description: 'Template returned' })
  getTemplate() {
    return { template: this.service.getTemplate() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get script by ID' })
  @ApiResponse({ status: 200, description: 'Script found' })
  @ApiResponse({ status: 404, description: 'Script not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const script = await this.service.findOne(id);
    if (!script) throw new HttpException('Script not found', HttpStatus.NOT_FOUND);
    return script;
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a script' })
  @ApiBody({ type: SaveScriptDto })
  @ApiResponse({ status: 201, description: 'Script saved' })
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth()
  async save(@Body() dto: SaveScriptDto) {
    if (!dto.key || !dto.name || !dto.code) {
      throw new HttpException('key, name, and code are required', HttpStatus.BAD_REQUEST);
    }
    const version = new Date().toISOString();
    return this.service.save({
      id: dto.id,
      key: dto.key,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      config: dto.config || null,
      version,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a script' })
  @ApiResponse({ status: 200, description: 'Script deleted' })
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth()
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { success: true };
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle script enabled/disabled' })
  @ApiResponse({ status: 200, description: 'Script toggled' })
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth()
  async toggle(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleEnabled(id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test a script' })
  @ApiBody({ type: TestScriptDto })
  @ApiResponse({ status: 200, description: 'Test result' })
  async test(@Body() dto: TestScriptDto) {
    if (!dto.code) {
      throw new HttpException('code is required', HttpStatus.BAD_REQUEST);
    }
    return this.service.testScript(dto.code, dto.config);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute a script hook' })
  @ApiBody({ type: ExecuteHookDto })
  @ApiResponse({ status: 200, description: 'Hook result' })
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth()
  async execute(@Param('id', ParseIntPipe) id: number, @Body() dto: ExecuteHookDto) {
    const validHooks: ScriptHook[] = [
      'getSources',
      'search',
      'recommend',
      'detail',
      'resolvePlayUrl',
    ];
    if (!validHooks.includes(dto.hook)) {
      throw new HttpException(`Invalid hook: ${dto.hook}`, HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.service.executeHookById(id, dto.hook, dto.args || []);
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : 'Execution failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/execute/:hook')
  @ApiOperation({ summary: 'Execute a script hook via GET' })
  @ApiQuery({ name: 'args', required: false, description: 'JSON-encoded args array' })
  @ApiResponse({ status: 200, description: 'Hook result' })
  async executeGet(
    @Param('id', ParseIntPipe) id: number,
    @Param('hook') hook: string,
    @Query('args') argsJson?: string,
  ) {
    const validHooks: ScriptHook[] = [
      'getSources',
      'search',
      'recommend',
      'detail',
      'resolvePlayUrl',
    ];
    if (!validHooks.includes(hook as ScriptHook)) {
      throw new HttpException(`Invalid hook: ${hook}`, HttpStatus.BAD_REQUEST);
    }
    let args: unknown[] = [];
    if (argsJson) {
      try {
        args = JSON.parse(argsJson);
      } catch {
        throw new HttpException('Invalid args JSON', HttpStatus.BAD_REQUEST);
      }
    }
    try {
      return await this.service.executeHookById(id, hook as ScriptHook, args);
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : 'Execution failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
