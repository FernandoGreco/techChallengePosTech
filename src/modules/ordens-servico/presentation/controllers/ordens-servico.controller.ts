import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdensServicoUseCase } from '../../application/use-cases/ordens-servico.use-case';
import { CreateOrdemServicoDto } from '../../application/dto/create-ordem-servico.dto';
import { AddServicoOSDto } from '../../application/dto/add-servico-os.dto';
import { AddPecaOSDto } from '../../application/dto/add-peca-os.dto';
import { RegistrarDiagnosticoDto } from '../../application/dto/registrar-diagnostico.dto';
import { Public } from '../../../auth/domain/decorators/public.decorator';

@ApiTags('Ordens de Serviço')
@Controller('ordens-servico')
export class OrdensServicoController {
  constructor(private readonly ordensServicoUseCase: OrdensServicoUseCase) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Criar nova ordem de serviço' })
  @ApiResponse({ status: 201, description: 'OS criada' })
  async criar(@Body() dto: CreateOrdemServicoDto) {
    return this.ordensServicoUseCase.criar(dto);
  }

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar todas as ordens de serviço' })
  @ApiResponse({ status: 200, description: 'Lista de OS' })
  async listarTodas() {
    return this.ordensServicoUseCase.listarTodas();
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Buscar ordem de serviço por ID' })
  @ApiResponse({ status: 200, description: 'OS encontrada' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async buscarPorId(@Param('id') id: string) {
    return this.ordensServicoUseCase.buscarPorId(id);
  }

  @Public()
  @Get(':id/status')
  @ApiOperation({ summary: 'Consultar status da OS (rota pública)' })
  @ApiResponse({ status: 200, description: 'Status da OS' })
  async consultarStatus(@Param('id') id: string) {
    return this.ordensServicoUseCase.consultarStatus(id);
  }

  @ApiBearerAuth()
  @Post(':id/servicos')
  @ApiOperation({ summary: 'Adicionar serviço à OS' })
  @ApiResponse({ status: 200, description: 'Serviço adicionado' })
  async adicionarServico(
    @Param('id') id: string,
    @Body() dto: AddServicoOSDto,
  ) {
    return this.ordensServicoUseCase.adicionarServico(id, dto);
  }

  @ApiBearerAuth()
  @Post(':id/pecas')
  @ApiOperation({ summary: 'Adicionar peça à OS' })
  @ApiResponse({ status: 200, description: 'Peça adicionada' })
  async adicionarPeca(@Param('id') id: string, @Body() dto: AddPecaOSDto) {
    return this.ordensServicoUseCase.adicionarPeca(id, dto);
  }

  @ApiBearerAuth()
  @Post(':id/iniciar-diagnostico')
  @ApiOperation({ summary: 'Iniciar diagnóstico da OS' })
  @ApiResponse({ status: 200, description: 'Diagnóstico iniciado' })
  async iniciarDiagnostico(@Param('id') id: string) {
    return this.ordensServicoUseCase.iniciarDiagnostico(id);
  }

  @ApiBearerAuth()
  @Post(':id/registrar-diagnostico')
  @ApiOperation({ summary: 'Registrar diagnóstico da OS' })
  @ApiResponse({ status: 200, description: 'Diagnóstico registrado' })
  async registrarDiagnostico(
    @Param('id') id: string,
    @Body() dto: RegistrarDiagnosticoDto,
  ) {
    return this.ordensServicoUseCase.registrarDiagnostico(id, dto);
  }

  @ApiBearerAuth()
  @Post(':id/gerar-orcamento')
  @ApiOperation({ summary: 'Gerar orçamento para a OS' })
  @ApiResponse({ status: 200, description: 'Orçamento gerado' })
  async gerarOrcamento(@Param('id') id: string) {
    return this.ordensServicoUseCase.gerarOrcamento(id);
  }

  @Public()
  @Post(':id/aprovar-orcamento')
  @ApiOperation({ summary: 'Aprovar orçamento da OS (rota pública)' })
  @ApiResponse({ status: 200, description: 'Orçamento aprovado' })
  async aprovarOrcamento(@Param('id') id: string) {
    return this.ordensServicoUseCase.aprovarOrcamento(id);
  }

  @Public()
  @Post(':id/recusar-orcamento')
  @ApiOperation({
    summary:
      'Recusar orçamento da OS (rota pública) — OS retorna para diagnóstico',
  })
  @ApiResponse({ status: 200, description: 'Orçamento recusado' })
  async recusarOrcamento(@Param('id') id: string) {
    return this.ordensServicoUseCase.recusarOrcamento(id);
  }

  @ApiBearerAuth()
  @Post(':id/iniciar-execucao')
  @ApiOperation({ summary: 'Iniciar execução da OS' })
  @ApiResponse({ status: 200, description: 'Execução iniciada' })
  async iniciarExecucao(@Param('id') id: string) {
    return this.ordensServicoUseCase.iniciarExecucao(id);
  }

  @ApiBearerAuth()
  @Post(':id/finalizar')
  @ApiOperation({ summary: 'Finalizar OS' })
  @ApiResponse({ status: 200, description: 'OS finalizada' })
  async finalizar(@Param('id') id: string) {
    return this.ordensServicoUseCase.finalizar(id);
  }

  @ApiBearerAuth()
  @Post(':id/entregar')
  @ApiOperation({ summary: 'Entregar veículo ao cliente' })
  @ApiResponse({ status: 200, description: 'Veículo entregue' })
  async entregar(@Param('id') id: string) {
    return this.ordensServicoUseCase.entregar(id);
  }
}
