import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Param,
    UseGuards,
    UsePipes
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuditLog } from '@apex/audit';
import { JwtAuthGuard, TenantJwtMatchGuard } from '@apex/auth';
import { BulkImportDto } from './dto/bulk-import.dto';
@Controller('admin/products/import')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
@UsePipes(ZodValidationPipe)
export class BulkImportController {

    @Post()
    @AuditLog({ action: 'PRODUCT_BULK_IMPORT_START', entityType: 'product' })
    async startImport(@Body() dto: BulkImportDto) {
        // TODO: Initiate BullMQ job
        return { jobId: 'pending', status: 'initiated' };
    }

    @Get(':jobId')
    async getImportStatus(@Param('jobId') jobId: string) {
        // TODO: Query import_jobs table
        return { jobId, status: 'processing', progress: 0 };
    }
}
