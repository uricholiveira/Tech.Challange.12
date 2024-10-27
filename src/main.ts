import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ExceptionFilter } from './exception/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Banking example')
    .setDescription('API for banking example')
    .setVersion('1.0')
    .addTag('account')
    .addTag('transaction')
    .addTag('health')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalFilters(new ExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
