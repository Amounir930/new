import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const NewsletterSubscriptionSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export class NewsletterSubscriptionDto extends createZodDto(NewsletterSubscriptionSchema) { }
