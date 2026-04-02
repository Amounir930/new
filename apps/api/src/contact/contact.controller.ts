import { Body, Controller, HttpCode, HttpStatus, Post, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { NotificationsService } from '../common/notifications/notifications.service';
import { AuditLog } from '@apex/audit';

const ContactRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

class ContactRequestDto extends createZodDto(ContactRequestSchema) {}

@Controller({ path: 'contact', version: '1' })
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(private readonly notifications: NotificationsService) {}

  @AuditLog({ action: 'CONTACT_FORM_SUBMITTED', entityType: 'system' })
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour limit
  @Post()
  @HttpCode(HttpStatus.OK)
  async submitContactForm(@Body(ZodValidationPipe) dto: ContactRequestDto) {
    this.logger.log(`Received contact form submission from: ${dto.email}`);

    const emailSent = await this.notifications.sendEmail({
      to: 'adelhub123@gmail.com', // Admin email based on user specifications
      subject: `New Contact Form Submission from ${dto.name}`,
      html: `
        <h3>New Message via 60sec.shop</h3>
        <p><strong>Name:</strong> ${dto.name}</p>
        <p><strong>Email:</strong> ${dto.email}</p>
        <hr />
        <p>${dto.message.replace(/\n/g, '<br />')}</p>
      `,
      text: `Name: ${dto.name}\nEmail: ${dto.email}\nMessage:\n${dto.message}`,
    });

    if (!emailSent) {
      // We don't want to expose failure to client to prevent phishing/abuse
      this.logger.error('Failed to dispatch contact form email.');
    }

    return { message: 'Message received successfully. We will get back to you shortly.' };
  }
}
