import { EmailNotificacaoOrcamentoService } from '../email-notificacao-orcamento.service';
import * as nodemailer from 'nodemailer';
import { StatusOS } from '../../../domain/enums/status-os.enum';
import { IOrdemServico } from '../../../domain/entities/ordem-servico.entity';

jest.mock('nodemailer');

const makeOS = (emailCliente?: string): IOrdemServico => ({
  id: 'os-uuid',
  numero: 42,
  clienteId: 'c1',
  veiculoId: 'v1',
  status: StatusOS.AGUARDANDO_APROVACAO,
  valorTotal: 350,
  dataCriacao: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  diagnostico: null,
  dataInicioDiagnostico: null,
  dataInicioExecucao: null,
  dataFinalizacao: null,
  dataEntrega: null,
  servicos: [],
  pecas: [],
  orcamentos: [],
  cliente: emailCliente
    ? { id: 'c1', nome: 'João Silva', documento: '123', telefone: '11999', email: emailCliente }
    : undefined,
  veiculo: { id: 'v1', placa: 'ABC1D23', marca: 'Toyota', modelo: 'Corolla', ano: 2022 },
});

describe('EmailNotificacaoOrcamentoService', () => {
  let service: EmailNotificacaoOrcamentoService;
  let mockSendMail: jest.Mock;
  let mockCreateTransport: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id-123' });
    mockCreateTransport = nodemailer.createTransport as jest.Mock;
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });

    service = new EmailNotificacaoOrcamentoService();
  });

  it('deve enviar email com subject e destinatário corretos', async () => {
    await service.notificarOrcamentoPendente(makeOS('joao@test.com'), 350.0);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const args = mockSendMail.mock.calls[0][0];
    expect(args.to).toBe('joao@test.com');
    expect(args.subject).toContain('#42');
    expect(args.subject).toContain('aprovação');
  });

  it('deve incluir links de aprovar e recusar no body do email', async () => {
    await service.notificarOrcamentoPendente(makeOS('joao@test.com'), 350.0);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.html).toContain('/ordens-servico/os-uuid/aprovar-orcamento');
    expect(args.html).toContain('/ordens-servico/os-uuid/recusar-orcamento');
  });

  it('deve incluir o valor total no body do email', async () => {
    await service.notificarOrcamentoPendente(makeOS('joao@test.com'), 350.5);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.html).toContain('350.50');
  });

  it('deve ignorar envio quando cliente não tem email cadastrado', async () => {
    await service.notificarOrcamentoPendente(makeOS(undefined), 100);

    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('deve ignorar envio quando cliente é undefined', async () => {
    const os = makeOS();
    os.cliente = undefined;

    await service.notificarOrcamentoPendente(os, 100);

    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
