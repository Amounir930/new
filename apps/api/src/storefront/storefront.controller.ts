import { Controller, Get, Query } from '@nestjs/common';
import { StorefrontService } from './storefront.service.js';
import { z } from 'zod';

const HomeQuerySchema = z.object({
    tenantId: z.string().uuid().optional(),
});

@Controller('storefront')
export class StorefrontController {
    constructor(private readonly storefrontService: StorefrontService) { }

    @Get('home')
    async getHome(@Query() query: any) {
        const validated = HomeQuerySchema.parse(query);
        return this.storefrontService.getHomeData(validated.tenantId);
    }
}
