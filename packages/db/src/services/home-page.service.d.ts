/**
 * Home Page Blueprint Service
 *
 * Handles persistence and retrieval of structured home page data (Header, Hero, Bento, etc.)
 */
import { type HomePageBlueprint } from '@apex/validators';
export declare class HomePageService {
    /**
     * Get complete home page blueprint for a tenant
     */
    getBlueprint(_tenantId: string): Promise<HomePageBlueprint | null>;
    /**
     * Save/Update Hero Section
     */
    updateHero(_tenantId: string, heroData: any): Promise<void>;
    /**
     * Create active Flash Sale campaign
     */
    createFlashSale(_tenantId: string, campaign: any): Promise<{
        status: string | null;
        name: string;
        id: string;
        createdAt: Date | null;
        updatedAt: Date | null;
        endTime: Date;
    }>;
    /**
     * Update Bento Grid layout
     */
    updateBentoGrid(_tenantId: string, bentoData: any): Promise<void>;
    /**
     * Log search query for analytics
     */
    logSearchQuery(_tenantId: string, query: string): Promise<void>;
    /**
     * Get top searched terms
     */
    getTopSearchedTerms(_tenantId: string, limit?: number): Promise<{
        id: string;
        query: string;
        count: number | null;
        lastSearchedAt: Date | null;
    }[]>;
}
export declare const homePageService: HomePageService;
//# sourceMappingURL=home-page.service.d.ts.map