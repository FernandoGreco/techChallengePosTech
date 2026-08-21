import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database';
import { BusinessException } from '../../../../shared/exceptions';
import { StatusOSRules } from '../../domain/rules/status-os.rules';
import { StatusOS } from '../../domain/enums/status-os.enum';
import { CreateOrdemServicoDto } from '../dto/create-ordem-servico.dto';
import { AddServicoOSDto } from '../dto/add-servico-os.dto';
import { AddPecaOSDto } from '../dto/add-peca-os.dto';
import { RegistrarDiagnosticoDto } from '../dto/registrar-diagnostico.dto';
import { EstoqueRules } from '../../../pecas/domain/rules/estoque.rules';

@Injectable()
export class OrdensServicoUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreateOrdemServicoDto) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.clienteId },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: dto.veiculoId },
    });
    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }

    if (veiculo.clienteId !== dto.clienteId) {
      throw new BusinessException(
        'O veículo não pertence ao cliente informado',
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const os = await tx.ordemServico.create({
        data: {
          clienteId: dto.clienteId,
          veiculoId: dto.veiculoId,
          status: StatusOS.RECEBIDA,
        },
      });

      await tx.historicoStatusOS.create({
        data: {
          ordemServicoId: os.id,
          statusNovo: StatusOS.RECEBIDA,
          observacao: 'OS criada',
        },
      });

      if (dto.servicos && dto.servicos.length > 0) {
        for (const s of dto.servicos) {
          const servico = await tx.servico.findUnique({
            where: { id: s.servicoId },
          });
          if (!servico) {
            throw new NotFoundException(
              `Serviço ${s.servicoId} não encontrado`,
            );
          }
          await tx.ordemServicoServico.create({
            data: {
              ordemServicoId: os.id,
              servicoId: s.servicoId,
              valor: servico.precoBase,
            },
          });
        }
      }

      if (dto.pecas && dto.pecas.length > 0) {
        for (const p of dto.pecas) {
          const peca = await tx.peca.findUnique({
            where: { id: p.pecaId },
          });
          if (!peca) {
            throw new NotFoundException(`Peça ${p.pecaId} não encontrada`);
          }
          await tx.ordemServicoPeca.create({
            data: {
              ordemServicoId: os.id,
              pecaId: p.pecaId,
              quantidade: p.quantidade,
              valorUnitario: peca.precoUnitario,
            },
          });
        }
      }

      return os;
    });

    return this.buscarPorId(created.id);
  }

  async listarTodas() {
    return this.prisma.ordemServico.findMany({
      include: {
        cliente: true,
        veiculo: true,
        servicos: { include: { servico: true } },
        pecas: { include: { peca: true } },
        orcamentos: true,
      },
      orderBy: { dataCriacao: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: {
        cliente: true,
        veiculo: true,
        servicos: { include: { servico: true } },
        pecas: { include: { peca: true } },
        orcamentos: true,
        historico: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }
    return os;
  }

  async consultarStatus(id: string) {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id },
      select: {
        id: true,
        numero: true,
        status: true,
        dataCriacao: true,
        dataInicioDiagnostico: true,
        dataInicioExecucao: true,
        dataFinalizacao: true,
        dataEntrega: true,
      },
    });
    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }
    return os;
  }

  async adicionarServico(ordemServicoId: string, dto: AddServicoOSDto) {
    const os = await this.buscarPorId(ordemServicoId);
    if (
      (os.status as string) !== (StatusOS.RECEBIDA as string) &&
      (os.status as string) !== (StatusOS.EM_DIAGNOSTICO as string)
    ) {
      throw new BusinessException(
        'Só é possível adicionar serviços em OS com status RECEBIDA ou EM_DIAGNOSTICO',
      );
    }

    const servico = await this.prisma.servico.findUnique({
      where: { id: dto.servicoId },
    });
    if (!servico) {
      throw new NotFoundException('Serviço não encontrado');
    }

    await this.prisma.ordemServicoServico.create({
      data: {
        ordemServicoId,
        servicoId: dto.servicoId,
        valor: servico.precoBase,
      },
    });

    return this.buscarPorId(ordemServicoId);
  }

  async adicionarPeca(ordemServicoId: string, dto: AddPecaOSDto) {
    const os = await this.buscarPorId(ordemServicoId);
    if (
      (os.status as string) !== (StatusOS.RECEBIDA as string) &&
      (os.status as string) !== (StatusOS.EM_DIAGNOSTICO as string)
    ) {
      throw new BusinessException(
        'Só é possível adicionar peças em OS com status RECEBIDA ou EM_DIAGNOSTICO',
      );
    }

    const peca = await this.prisma.peca.findUnique({
      where: { id: dto.pecaId },
    });
    if (!peca) {
      throw new NotFoundException('Peça não encontrada');
    }

    await this.prisma.ordemServicoPeca.create({
      data: {
        ordemServicoId,
        pecaId: dto.pecaId,
        quantidade: dto.quantidade,
        valorUnitario: peca.precoUnitario,
      },
    });

    return this.buscarPorId(ordemServicoId);
  }

  async iniciarDiagnostico(id: string) {
    const os = await this.buscarPorId(id);
    StatusOSRules.validarIniciarDiagnostico(os.status as StatusOS);

    await this.prisma.$transaction([
      this.prisma.ordemServico.update({
        where: { id },
        data: {
          status: StatusOS.EM_DIAGNOSTICO,
          dataInicioDiagnostico: new Date(),
        },
      }),
      this.prisma.historicoStatusOS.create({
        data: {
          ordemServicoId: id,
          statusAnterior: StatusOS.RECEBIDA,
          statusNovo: StatusOS.EM_DIAGNOSTICO,
          observacao: 'Diagnóstico iniciado',
        },
      }),
    ]);

    return this.buscarPorId(id);
  }

  async registrarDiagnostico(id: string, dto: RegistrarDiagnosticoDto) {
    const os = await this.buscarPorId(id);
    if ((os.status as string) !== (StatusOS.EM_DIAGNOSTICO as string)) {
      throw new BusinessException(
        'Só é possível registrar diagnóstico se a OS estiver EM_DIAGNOSTICO',
      );
    }

    await this.prisma.ordemServico.update({
      where: { id },
      data: { diagnostico: dto.diagnostico },
    });

    return this.buscarPorId(id);
  }

  async gerarOrcamento(id: string) {
    const os = await this.buscarPorId(id);
    StatusOSRules.validarGerarOrcamento(os.status as StatusOS);

    const valorServicos = os.servicos.reduce((sum, s) => sum + s.valor, 0);
    const valorPecas = os.pecas.reduce(
      (sum, p) => sum + p.valorUnitario * p.quantidade,
      0,
    );
    const valorTotal = valorServicos + valorPecas;

    await this.prisma.$transaction(async (tx) => {
      await tx.orcamento.create({
        data: {
          ordemServicoId: id,
          valorServicos,
          valorPecas,
          valorTotal,
        },
      });

      await tx.ordemServico.update({
        where: { id },
        data: {
          status: StatusOS.AGUARDANDO_APROVACAO,
          valorTotal,
        },
      });

      await tx.historicoStatusOS.create({
        data: {
          ordemServicoId: id,
          statusAnterior: StatusOS.EM_DIAGNOSTICO,
          statusNovo: StatusOS.AGUARDANDO_APROVACAO,
          observacao: `Orçamento gerado - Valor total: R$ ${valorTotal.toFixed(2)}`,
        },
      });
    });

    return this.buscarPorId(id);
  }

  async aprovarOrcamento(id: string) {
    const os = await this.buscarPorId(id);
    StatusOSRules.validarAprovarOrcamento(os.status as StatusOS);

    const orcamento = os.orcamentos.find((o) => o.status === 'GERADO');
    if (!orcamento) {
      throw new BusinessException(
        'Nenhum orçamento GERADO encontrado para esta OS',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.orcamento.update({
        where: { id: orcamento.id },
        data: { status: 'APROVADO', dataAprovacao: new Date() },
      });

      await tx.ordemServico.update({
        where: { id },
        data: {
          status: StatusOS.EM_EXECUCAO,
          dataInicioExecucao: new Date(),
        },
      });

      for (const pecaOS of os.pecas) {
        const peca = await tx.peca.findUnique({
          where: { id: pecaOS.pecaId },
        });
        if (!peca) {
          throw new NotFoundException(`Peça ${pecaOS.pecaId} não encontrada`);
        }
        EstoqueRules.validarDisponibilidade(
          peca.quantidadeEstoque,
          peca.quantidadeReservada,
          pecaOS.quantidade,
        );
        await tx.peca.update({
          where: { id: pecaOS.pecaId },
          data: {
            quantidadeReservada: peca.quantidadeReservada + pecaOS.quantidade,
          },
        });
      }

      await tx.historicoStatusOS.create({
        data: {
          ordemServicoId: id,
          statusAnterior: StatusOS.AGUARDANDO_APROVACAO,
          statusNovo: StatusOS.EM_EXECUCAO,
          observacao: 'Orçamento aprovado pelo cliente',
        },
      });
    });

    return this.buscarPorId(id);
  }

  async iniciarExecucao(id: string) {
    const os = await this.buscarPorId(id);

    if ((os.status as string) !== (StatusOS.AGUARDANDO_APROVACAO as string)) {
      throw new BusinessException(
        'Só é possível iniciar execução se a OS estiver AGUARDANDO_APROVACAO',
      );
    }

    const orcamentoAprovado = os.orcamentos.find(
      (o) => o.status === 'APROVADO',
    );
    if (!orcamentoAprovado) {
      throw new BusinessException(
        'Só é possível iniciar execução se o orçamento estiver aprovado',
      );
    }

    await this.prisma.$transaction([
      this.prisma.ordemServico.update({
        where: { id },
        data: {
          status: StatusOS.EM_EXECUCAO,
          dataInicioExecucao: new Date(),
        },
      }),
      this.prisma.historicoStatusOS.create({
        data: {
          ordemServicoId: id,
          statusAnterior: StatusOS.AGUARDANDO_APROVACAO,
          statusNovo: StatusOS.EM_EXECUCAO,
          observacao: 'Execução iniciada',
        },
      }),
    ]);

    return this.buscarPorId(id);
  }

  async finalizar(id: string) {
    const os = await this.buscarPorId(id);
    StatusOSRules.validarFinalizar(os.status as StatusOS);

    await this.prisma.$transaction(async (tx) => {
      for (const pecaOS of os.pecas) {
        const peca = await tx.peca.findUnique({
          where: { id: pecaOS.pecaId },
        });
        if (peca) {
          await tx.peca.update({
            where: { id: pecaOS.pecaId },
            data: {
              quantidadeEstoque: peca.quantidadeEstoque - pecaOS.quantidade,
              quantidadeReservada: Math.max(
                0,
                peca.quantidadeReservada - pecaOS.quantidade,
              ),
            },
          });
        }
      }

      await tx.ordemServico.update({
        where: { id },
        data: {
          status: StatusOS.FINALIZADA,
          dataFinalizacao: new Date(),
        },
      });

      await tx.historicoStatusOS.create({
        data: {
          ordemServicoId: id,
          statusAnterior: StatusOS.EM_EXECUCAO,
          statusNovo: StatusOS.FINALIZADA,
          observacao: 'OS finalizada',
        },
      });
    });

    return this.buscarPorId(id);
  }

  async recusarOrcamento(id: string) {
    const os = await this.buscarPorId(id);
    StatusOSRules.validarRecusarOrcamento(os.status as StatusOS);

    const orcamento = os.orcamentos.find((o) => o.status === 'GERADO');
    if (!orcamento) {
      throw new BusinessException(
        'Nenhum orçamento GERADO encontrado para esta OS',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.orcamento.update({
        where: { id: orcamento.id },
        data: { status: 'RECUSADO' },
      });

      await tx.ordemServico.update({
        where: { id },
        data: { status: StatusOS.EM_DIAGNOSTICO },
      });

      await tx.historicoStatusOS.create({
        data: {
          ordemServicoId: id,
          statusAnterior: StatusOS.AGUARDANDO_APROVACAO,
          statusNovo: StatusOS.EM_DIAGNOSTICO,
          observacao:
            'Orçamento recusado pelo cliente — OS retornada para diagnóstico',
        },
      });
    });

    return this.buscarPorId(id);
  }

  async entregar(id: string) {
    const os = await this.buscarPorId(id);
    StatusOSRules.validarEntrega(os.status as StatusOS);

    await this.prisma.$transaction([
      this.prisma.ordemServico.update({
        where: { id },
        data: {
          status: StatusOS.ENTREGUE,
          dataEntrega: new Date(),
        },
      }),
      this.prisma.historicoStatusOS.create({
        data: {
          ordemServicoId: id,
          statusAnterior: StatusOS.FINALIZADA,
          statusNovo: StatusOS.ENTREGUE,
          observacao: 'Veículo entregue ao cliente',
        },
      }),
    ]);

    return this.buscarPorId(id);
  }
}
