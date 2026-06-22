import { OrdensServicoController } from '../ordens-servico.controller';

describe('OrdensServicoController', () => {
  let controller: OrdensServicoController;
  const mockUseCase = {
    criar: jest.fn(),
    listarTodas: jest.fn(),
    buscarPorId: jest.fn(),
    consultarStatus: jest.fn(),
    adicionarServico: jest.fn(),
    adicionarPeca: jest.fn(),
    iniciarDiagnostico: jest.fn(),
    registrarDiagnostico: jest.fn(),
    gerarOrcamento: jest.fn(),
    aprovarOrcamento: jest.fn(),
    iniciarExecucao: jest.fn(),
    finalizar: jest.fn(),
    entregar: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new OrdensServicoController(mockUseCase);
  });

  it('criar chama useCase.criar', async () => {
    const dto = { descricao: 'Teste' } as any;
    mockUseCase.criar.mockResolvedValue({ id: 'o1', ...dto });
    await expect(controller.criar(dto)).resolves.toEqual({ id: 'o1', ...dto });
    expect(mockUseCase.criar).toHaveBeenCalledWith(dto);
  });

  it('listarTodas chama useCase.listarTodas', async () => {
    const result = [{ id: 'o1' }];
    mockUseCase.listarTodas.mockResolvedValue(result);
    await expect(controller.listarTodas()).resolves.toBe(result);
    expect(mockUseCase.listarTodas).toHaveBeenCalled();
  });

  it('buscarPorId chama useCase.buscarPorId', async () => {
    mockUseCase.buscarPorId.mockResolvedValue({ id: 'o1' });
    await expect(controller.buscarPorId('o1')).resolves.toEqual({ id: 'o1' });
    expect(mockUseCase.buscarPorId).toHaveBeenCalledWith('o1');
  });

  it('consultarStatus chama useCase.consultarStatus', async () => {
    mockUseCase.consultarStatus.mockResolvedValue({ status: 'PENDENTE' });
    await expect(controller.consultarStatus('o1')).resolves.toEqual({ status: 'PENDENTE' });
    expect(mockUseCase.consultarStatus).toHaveBeenCalledWith('o1');
  });

  it('adicionarServico chama useCase.adicionarServico', async () => {
    const dto = { servicoId: 's1' } as any;
    mockUseCase.adicionarServico.mockResolvedValue({ success: true });
    await expect(controller.adicionarServico('o1', dto)).resolves.toEqual({ success: true });
    expect(mockUseCase.adicionarServico).toHaveBeenCalledWith('o1', dto);
  });

  it('adicionarPeca chama useCase.adicionarPeca', async () => {
    const dto = { pecaId: 'p1' } as any;
    mockUseCase.adicionarPeca.mockResolvedValue({ success: true });
    await expect(controller.adicionarPeca('o1', dto)).resolves.toEqual({ success: true });
    expect(mockUseCase.adicionarPeca).toHaveBeenCalledWith('o1', dto);
  });

  it('iniciarDiagnostico chama useCase.iniciarDiagnostico', async () => {
    mockUseCase.iniciarDiagnostico.mockResolvedValue({ success: true });
    await expect(controller.iniciarDiagnostico('o1')).resolves.toEqual({ success: true });
    expect(mockUseCase.iniciarDiagnostico).toHaveBeenCalledWith('o1');
  });

  it('registrarDiagnostico chama useCase.registrarDiagnostico', async () => {
    const dto = { diagnostico: 'OK' } as any;
    mockUseCase.registrarDiagnostico.mockResolvedValue({ success: true });
    await expect(controller.registrarDiagnostico('o1', dto)).resolves.toEqual({ success: true });
    expect(mockUseCase.registrarDiagnostico).toHaveBeenCalledWith('o1', dto);
  });

  it('gerarOrcamento chama useCase.gerarOrcamento', async () => {
    mockUseCase.gerarOrcamento.mockResolvedValue({ success: true });
    await expect(controller.gerarOrcamento('o1')).resolves.toEqual({ success: true });
    expect(mockUseCase.gerarOrcamento).toHaveBeenCalledWith('o1');
  });

  it('aprovarOrcamento chama useCase.aprovarOrcamento', async () => {
    mockUseCase.aprovarOrcamento.mockResolvedValue({ success: true });
    await expect(controller.aprovarOrcamento('o1')).resolves.toEqual({ success: true });
    expect(mockUseCase.aprovarOrcamento).toHaveBeenCalledWith('o1');
  });

  it('iniciarExecucao chama useCase.iniciarExecucao', async () => {
    mockUseCase.iniciarExecucao.mockResolvedValue({ success: true });
    await expect(controller.iniciarExecucao('o1')).resolves.toEqual({ success: true });
    expect(mockUseCase.iniciarExecucao).toHaveBeenCalledWith('o1');
  });

  it('finalizar chama useCase.finalizar', async () => {
    mockUseCase.finalizar.mockResolvedValue({ success: true });
    await expect(controller.finalizar('o1')).resolves.toEqual({ success: true });
    expect(mockUseCase.finalizar).toHaveBeenCalledWith('o1');
  });

  it('entregar chama useCase.entregar', async () => {
    mockUseCase.entregar.mockResolvedValue({ success: true });
    await expect(controller.entregar('o1')).resolves.toEqual({ success: true });
    expect(mockUseCase.entregar).toHaveBeenCalledWith('o1');
  });
});
