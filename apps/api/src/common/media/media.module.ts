import { ConfigService } from '@apex/config/service';
import { ImgproxyService } from '@apex/media';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: ImgproxyService,
      useFactory: (configService: ConfigService) => {
        const key = configService.get('IMGPROXY_KEY') as string;
        const salt = configService.get('IMGPROXY_SALT') as string;
        const sourceUrl = configService.get('IMGPROXY_SOURCE_URL') as string;
        return new ImgproxyService(key, salt, sourceUrl);
      },
      inject: [ConfigService],
    },
  ],
  exports: [ImgproxyService],
})
export class MediaModule {}
