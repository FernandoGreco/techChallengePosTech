import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IOrdemServicoRepository,
  ORDEM_SERVICO_REPOSITORY,
} from '../../domain/repositories/ordem-servico.repository.interface';
import { IOrdemServico } from '../../domain/entities/ordem-servico.entity';
import { StatusOS } from '../../domain/enums/status-os.enum';
import { StatusOSRules } from '../../domain/rules/status-os.rules';

@Injectable()
export class GerarOrcamentoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly repository: IOrdemServicoRepository,
  ) {}

  async execute(id: string): Promise<IOrdemServico> {
    const os = await this.repository.findById(id);
    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    StatusOSRules.validarGerarOrcamento(os.status);

    const valorServicos = os.servicos.reduce((sum, s) => sum + s.valor, 0);
    const valorPecas = os.pecas.reduce(
      (sum, p) => sum + p.valorUnitario * p.quantidade,
      0,
    );
    const valorTotal = valorServicos + valorPecas;

    return this.repository.gerarOrcamento({
      id,
      valorServicos,
      valorPecas,
      valorTotal,
    });
  }
}
