import { Module } from '@nestjs/common';
import { OrdensServicoController } from './presentation/controllers/ordens-servico.controller';
import { OrdensServicoUseCase } from './application/use-cases/ordens-servico.use-case';

@Module({
  controllers: [OrdensServicoController],
  providers: [OrdensServicoUseCase],
  exports: [OrdensServicoUseCase],
})
export class OrdensServicoModule {}
