# Oficina Mecânica - Sistema de Gestão (Fase 2)

## 1. Objetivo

Evolução do MVP acadêmico da Fase 1 para a **Fase 2 do Tech Challenge de pós-graduação em Arquitetura de Software**, com foco em:

- **Clean Code**: nomes claros, funções curtas e coesas, eliminação de duplicidade
- **Clean Architecture**: separação em camadas Domain → Application → Infrastructure → Presentation, com regras de dependência estritas (domínio nunca depende de framework ou ORM)
- **Testes automatizados**: cobertura dos fluxos críticos de negócio (abertura de OS, orçamento, aprovação/recusa, estoque, listagem)
- **Novas APIs obrigatórias da Fase 2**:
  - Abertura de OS retornando identificação única
  - Consulta pública de status da OS
  - Aprovação/recusa de orçamento via endpoint público (webhook de notificação externa)
  - Listagem operacional de OS ordenada por prioridade de status, excluindo (logicamente) OS finalizadas/entregues
  - **Atualização de status da OS via email** — notificação automática ao cliente quando o orçamento é gerado, com links de aprovação/recusa

O sistema permite:
- Gestão de clientes e veículos
- Criação e acompanhamento de ordens de serviço (OS)
- Inclusão de serviços e peças/insumos
- Geração e aprovação de orçamentos, com **notificação automática por email**
- Controle de estoque
- Autenticação JWT para rotas administrativas
- Documentação completa via Swagger



## 2. Tecnologias Utilizadas e Justificativas

| Tecnologia | Versão | Por que foi escolhida |
|---|---|---|
| **Node.js** | 20.x LTS | Runtime JavaScript maduro com suporte a I/O assíncrono não-bloqueante — ideal para APIs REST que realizam muitas operações de banco em paralelo (transactions, includes). A equipe já domina o ecossistema Node por trabalhar com Angular no frontend, reduzindo a curva de aprendizado e permitindo compartilhar padrões e ferramentas entre back e front |
| **TypeScript** | 5.x | Tipagem estática elimina erros em tempo de desenvolvimento, é obrigatório no ecossistema NestJS e facilita o contrato entre camadas (domain ↔ application ↔ infra) sem casting em tempo de execução. Por ser a linguagem que toda a equipe já tem fluência, acelerando o desenvolvimento e o code review |
| **NestJS** | 11.x | Framework opinativo com suporte nativo a injeção de dependência, módulos, guards e decorators — permite separar camadas de forma declarativa sem boilerplate. Alinhado com a arquitetura hexagonal/Clean Architecture pela facilidade de registrar implementações por token (`useClass`) |
| **PostgreSQL** | 16 | Banco relacional com transações ACID, integridade referencial via FK e suporte a JSON — necessário para o domínio complexo com múltiplas relações (OS → Orçamentos → Histórico). Ver seção 14 para análise detalhada |
| **Prisma ORM** | 5.x | Gera tipos TypeScript automaticamente a partir do schema, simplifica migrations e oferece query builder type-safe. Isolado na camada de infra — use cases dependem de interfaces, não do Prisma diretamente |
| **JWT** (`@nestjs/jwt`) | 11.x | Stateless, sem necessidade de session store no servidor. Payload carrega `sub`, `email` e `papel`, eliminando roundtrip ao banco para autorização |
| **bcryptjs** | 3.x | Hash de senhas com salt adaptativo (fator de custo configurável). Resistente a ataques de rainbow table e força bruta |
| **Swagger** (`@nestjs/swagger`) | 11.x | Documentação gerada diretamente dos decorators NestJS, sempre sincronizada com o código. Reduz divergência entre código e spec |
| **Jest** | 30.x | Framework de testes padrão do ecossistema NestJS, com suporte a mocks, spies e cobertura integrada. Permite testar use cases em isolamento sem subir banco. A equipe tem experiencia com Jest ou Karma/Jasmine, tornando a escrita de testes mais natural e produtiva |
| **Docker / Docker Compose** | - | Garante ambiente reproduzível entre dev, CI e produção. `docker compose up` sobe API + PostgreSQL em um comando |
| **ESLint + Prettier** | - | Lint e formatação automática garantem consistência de estilo e evitam debates de formatação em code review |

## 3. Arquitetura

O projeto segue a arquitetura de **monolito modular** com conceitos de **Domain-Driven Design (DDD)** aplicados.

### Camadas
- **Domain**: Entidades, enums, regras de negócio e interfaces de repositórios
- **Application**: Casos de uso (use cases) e DTOs
- **Infrastructure**: Implementações de repositórios com Prisma
- **Presentation**: Controllers REST

## 4. Estrutura de Pastas

```
src/
├── modules/
│   ├── auth/                    # Autenticação JWT
│   │   ├── application/dto/
│   │   ├── application/use-cases/
│   │   ├── domain/decorators/
│   │   ├── infrastructure/
│   │   └── presentation/controllers/
│   ├── clientes/                # Gestão de clientes
│   │   ├── application/dto/
│   │   ├── application/use-cases/
│   │   ├── domain/enums/
│   │   ├── domain/repositories/
│   │   ├── infrastructure/repositories/
│   │   └── presentation/controllers/
│   ├── veiculos/                # Gestão de veículos
│   ├── servicos/                # Catálogo de serviços
│   ├── pecas/                   # Peças e controle de estoque
│   │   ├── domain/rules/        # Regras de estoque
│   │   └── ...
│   ├── ordens-servico/          # Ordens de serviço
│   │   ├── domain/rules/        # Máquina de estados da OS
│   │   └── ...
│   ├── orcamentos/              # Orçamentos
│   └── relatorios/              # Relatórios
├── shared/
│   ├── database/                # PrismaService global
│   ├── exceptions/              # BusinessException
│   └── validators/              # CPF, CNPJ, Placa
├── app.module.ts
└── main.ts
```

## 5. Como Rodar com Docker

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd oficina-mecanica

# Subir a aplicação com Docker Compose
docker compose up --build

# A aplicação estará disponível em:
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

## 6. Como Rodar Localmente (sem Docker)

### Pré-requisitos
- Node.js 20+ LTS (22 LTS recomendado)
- PostgreSQL 16+
- npm

### Inicialização no PowerShell

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oficina_mecanica?schema=public"
$env:JWT_SECRET="oficina-mecanica-jwt-secret-dev"
$env:JWT_EXPIRES_IN="1d"
$env:PORT="3000"

npm ci
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

Observação: a aplicação lê as variáveis de ambiente do terminal atual. Se você abrir um novo PowerShell, defina os valores novamente antes de iniciar a API.

Se o banco já tiver dados antigos e você quiser reiniciar do zero, crie um banco novo ou limpe o schema antes de rodar a migration e o seed.

## 7. Variáveis de Ambiente

| Variável | Descrição | Valor padrão |
|---|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://postgres:postgres@localhost:5432/oficina_mecanica?schema=public` |
| `JWT_SECRET` | Chave secreta para tokens JWT | `oficina-mecanica-jwt-secret-dev` |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `1d` |
| `PORT` | Porta da aplicação | `3000` |
| `APP_URL` | URL base usada para montar os links de aprovar/recusar orçamento no email | `http://localhost:3000` |
| `SMTP_HOST` | Servidor SMTP para envio de email | `smtp.ethereal.email` |
| `SMTP_PORT` | Porta do servidor SMTP | `587` |
| `SMTP_USER` | Usuário de autenticação SMTP | *(vazio — gera conta de teste Ethereal automaticamente)* |
| `SMTP_PASS` | Senha de autenticação SMTP | *(vazio — gera conta de teste Ethereal automaticamente)* |
| `SMTP_FROM` | Endereço de email remetente (aceita `email@dominio.com` ou `Nome <email@dominio.com>`) | `noreply@oficina.com` |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | Validação de certificado TLS. Definir `false` apenas em redes corporativas com inspeção SSL — **nunca em produção** | `true` |

> Ver seção 17 para detalhes completos da notificação por email.

## 8. Como Executar Migrations

```bash
# Criar e aplicar migrations
npx prisma migrate dev --name init

# Apenas aplicar migrations existentes (produção)
npx prisma migrate deploy
```

## 9. Como Rodar Seed

```bash
npm run prisma:seed
```

O seed cria:
- Usuário admin (`admin@email.com` / `123456`)
- Usuário atendente (`atendente@email.com` / `123456`)
- Usuário mecânico (`mecanico@email.com` / `123456`)
- 5 serviços pré-cadastrados
- 5 peças/insumos com estoque
- 1 cliente de exemplo
- 1 veículo de exemplo

## 10. Como Executar Testes

```bash
# Testes unitários
npm test

# Testes com cobertura (gera relatório em coverage/lcov-report/index.html)
npm run test:cov

# Abrir relatório HTML de cobertura (Windows)
npm run test:cov:open

# Testes de integração (e2e) - requer banco PostgreSQL rodando
npm run test:e2e
```

### Resultado da execução (`npm test`)

```
Test Suites: 39 passed, 39 total
Tests:       271 passed, 271 total
Snapshots:   0 total
Time:        ~15s
```

### Cobertura (`npm run test:cov`)

```
=============================== Coverage summary ================================
Statements   : 94.63%  ( 1058/1118 )
Branches     : 82.47%  (  193/234  )
Functions    : 95.49%  (  212/222  )
Lines        : 94.53%  (  934/988  )
=================================================================================
```

### O que está coberto por módulo

| Módulo | Suítes | Testes | Cenários cobertos |
|---|:---:|:---:|---|
| `ordens-servico` use cases | 6 | 60+ | Criar OS (status RECEBIDA obrigatório); buscar por ID; consultar status; adicionar serviço/peça (status válido/inválido); iniciar diagnóstico; registrar diagnóstico; gerar orçamento (cálculo serviços + peças); aprovar (reserva de estoque, **estoque insuficiente bloqueia**); recusar (retorna para EM_DIAGNOSTICO); iniciar execução (orçamento APROVADO obrigatório); finalizar (baixa de estoque); entregar; todas as **transições inválidas de status lançam exceção** |
| `ordens-servico` repository | 2 | 17 | `findOperacionais`: exclui FINALIZADA/ENTREGUE via WHERE Prisma; ordenação por prioridade de status; mais antigas primeiro no mesmo status. `criar`: valida cliente, veículo e pertencimento. `adicionarServico/Peca`: NotFoundException quando não existe. `transicionarStatus`: chama `$transaction`. `atualizarDiagnostico` |
| `ordens-servico` mapper | 1 | 9 | `toDomain` com todas as relações (cliente, veículo, serviços, peças, orçamentos, histórico); relações `undefined` retornam arrays vazios; `toStatusConsulta` expõe apenas campos de status |
| `ordens-servico` controller | 1 | 14 | Cada um dos 14 endpoints delega ao use case correto com os parâmetros exatos |
| `ordens-servico` domain rules | 1 | 9 | Todas as transições válidas e inválidas da máquina de estados (`StatusOSRules`) |
| `pecas` use case + repository + rules | 3 | 30+ | Criar, listar, reservar, baixar estoque; disponibilidade insuficiente lança exceção; baixa não gera saldo negativo |
| `clientes` use case + repository | 2 | 15+ | CRUD; documento duplicado gera conflito; busca por CPF/CNPJ |
| `veiculos` use case + repository | 2 | 15+ | CRUD; validar pertencimento do veículo ao cliente |
| `servicos` use case + repository | 2 | 12+ | CRUD de catálogo de serviços |
| `auth` LoginUseCase | 1 | 3 | Credenciais válidas retornam JWT; e-mail não encontrado rejeita; senha errada rejeita |
| `auth` JwtStrategy + Guard | 2 | 5 | Validação de payload JWT; `@Public()` bypassa o guard; token inválido é rejeitado |
| `auth` UsuarioPrismaRepository | 1 | 3 | `findByEmail` encontrado/não encontrado; `select` busca apenas campos necessários (sem expor dados extras) |
| `shared` validators | 3 | 20+ | CPF válido/inválido (algoritmo completo); CNPJ válido/inválido; placa formato antigo e Mercosul |
| `shared` PrismaService | 1 | 2 | Inicialização; desconexão em shutdown |

### Estratégia de testes

```
Presentation  ──► Controller tests: verifica que cada rota delega ao use case correto
Application   ──► Use case tests: usa MOCK de repository — zero banco, zero I/O
Domain        ──► Rule tests: TypeScript puro, sem dependências externas
Infrastructure──► Repository tests: usa MOCK do PrismaService — verifica queries geradas
```

**Por que mock de repository nos use cases?**
- Testa a lógica de negócio em isolamento total — um teste que falha indica problema no domínio, não no banco
- Execução em milissegundos (sem conexão real)
- Cenários difíceis de reproduzir no banco (estoque exato no limite, transições inválidas) são triviais com mocks

**Exemplo real — teste de aprovação com estoque insuficiente:**
```typescript
it('deve lançar BusinessException quando estoque insuficiente', async () => {
  repository.findById.mockResolvedValue(makeOS(StatusOS.AGUARDANDO_APROVACAO, {
    pecas: [{ pecaId: 'p1', quantidade: 10, peca: {
      quantidadeEstoque: 5,
      quantidadeReservada: 0,
    }}],
    orcamentos: [{ status: 'GERADO' }],
  }));

  await expect(useCase.execute('os1')).rejects.toThrow(BusinessException);
  expect(repository.aprovarOrcamento).not.toHaveBeenCalled(); // nada foi persistido
});
```

## 11. Como Acessar o Swagger

Após iniciar a aplicação, acesse:

```
http://localhost:3000/api/docs
```

Para autenticar no Swagger:
1. Execute `POST /auth/login` com as credenciais
2. Copie o `accessToken` retornado
3. Clique em "Authorize" no topo do Swagger
4. Cole o token no campo "Value"

## 12. Usuário Admin de Teste

| Campo | Valor |
|---|---|
| Email | `admin@email.com` |
| Senha | `123456` |
| Papel | `ADMIN` |

## 13. Principais Endpoints


### Autenticação
| Método | Rota | Descrição | Pública |
|---|---|---|---|
| POST | `/auth/login` | Login e obtenção de JWT | Sim |

### Clientes
| Método | Rota | Descrição |
|---|---|---|
| POST | `/clientes` | Criar cliente |
| GET | `/clientes` | Listar clientes |
| GET | `/clientes/:id` | Buscar por ID |
| GET | `/clientes/documento/:documento` | Buscar por CPF/CNPJ |
| PUT | `/clientes/:id` | Atualizar |
| DELETE | `/clientes/:id` | Remover |

### Veículos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/veiculos` | Criar veículo |
| GET | `/veiculos` | Listar veículos |
| GET | `/veiculos/:id` | Buscar por ID |
| GET | `/clientes/:clienteId/veiculos` | Veículos do cliente |
| PUT | `/veiculos/:id` | Atualizar |
| DELETE | `/veiculos/:id` | Remover |

### Serviços
| Método | Rota | Descrição |
|---|---|---|
| POST | `/servicos` | Criar serviço |
| GET | `/servicos` | Listar serviços |
| GET | `/servicos/:id` | Buscar por ID |
| PUT | `/servicos/:id` | Atualizar |
| DELETE | `/servicos/:id` | Remover |

### Peças / Insumos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/pecas` | Criar peça |
| GET | `/pecas` | Listar peças |
| GET | `/pecas/:id` | Buscar por ID |
| PUT | `/pecas/:id` | Atualizar |
| DELETE | `/pecas/:id` | Remover |
| POST | `/pecas/:id/entrada-estoque` | Entrada de estoque |
| POST | `/pecas/:id/reservar` | Reservar peça |
| POST | `/pecas/:id/baixar-estoque` | Baixa de estoque |

### Ordens de Serviço
| Método | Rota | Descrição | Pública |
|---|---|---|---|
| POST | `/ordens-servico` | Criar OS | Não |
| GET | `/ordens-servico` | Listar OS | Não |
| GET | `/ordens-servico/:id` | Detalhar OS | Não |
| GET | `/ordens-servico/:id/status` | Status da OS | Sim |
| POST | `/ordens-servico/:id/servicos` | Adicionar serviço | Não |
| POST | `/ordens-servico/:id/pecas` | Adicionar peça | Não |
| POST | `/ordens-servico/:id/iniciar-diagnostico` | Iniciar diagnóstico | Não |
| POST | `/ordens-servico/:id/registrar-diagnostico` | Registrar diagnóstico | Não |
| POST | `/ordens-servico/:id/gerar-orcamento` | Gerar orçamento | Não |
| POST | `/ordens-servico/:id/aprovar-orcamento` | Aprovar orçamento | Sim |
| POST | `/ordens-servico/:id/recusar-orcamento` | Recusar orçamento (retorna OS para diagnóstico) | Sim |
| POST | `/ordens-servico/:id/iniciar-execucao` | Iniciar execução | Não |
| POST | `/ordens-servico/:id/finalizar` | Finalizar OS | Não |
| POST | `/ordens-servico/:id/entregar` | Entregar veículo | Não |

### Relatórios
| Método | Rota | Descrição |
|---|---|---|
| GET | `/relatorios/tempo-medio-servicos` | Tempo médio de execução |

## 14. Decisões Técnicas

### ADR-01 — Banco de Dados: PostgreSQL

**Contexto:** o domínio possui relações profundas (Cliente → Veículo → OS → Serviços/Peças → Orçamento → Histórico de status) e operações que exigem atomicidade (geração de orçamento, aprovação com reserva de estoque, finalização com baixa).

**Decisão:** PostgreSQL 16.

| Critério | Justificativa |
|---|---|
| **Integridade referencial** | FK garantidas pelo banco — inconsistências não chegam ao domínio |
| **Transações ACID** | Aprovação de orçamento reserva peças e muda status numa única transaction; rollback automático em falha |
| **Consultas analíticas** | Módulo de relatórios (tempo médio de serviços) usa agregações SQL nativas |
| **Integração com Prisma** | Suporte de primeira classe — migrations, seed e tipos TypeScript gerados automaticamente |
| **Maturidade** | Open-source, battle-tested, amplamente adotado em produção; LTS ativo |

**Alternativas descartadas:** MongoDB (sem joins nativos, dificulta transações multi-coleção); MySQL (menos recursos analíticos, sintaxe de FK menos robusta em versões antigas).

---

### ADR-02 — Framework: NestJS

**Contexto:** necessidade de estrutura que suporte DI, módulos independentes e integração com Passport/JWT sem boilerplate excessivo.

**Decisão:** NestJS 11.

- **Inversão de controle via DI container:** registrar `{ provide: ORDEM_SERVICO_REPOSITORY, useClass: OrdemServicoPrismaRepository }` no módulo desacopla use cases da implementação Prisma — use cases dependem de interfaces, não de concretos
- **Módulos como unidade de encapsulamento:** cada módulo (`ClientesModule`, `OrdensServicoModule`, etc.) declara seus providers e exports, impedindo acoplamento acidental entre módulos
- **Guards e decorators declarativos:** `@JwtAuthGuard()` e `@Public()` aplicados no controller sem lógica de autorização espalhada nos use cases
- **Geração de Swagger integrada:** `@ApiTags`, `@ApiOperation` e `@ApiResponse` geram documentação sempre sincronizada com o código

**Alternativas descartadas:** Express puro (sem DI nativo, requer mais boilerplate para arquitetura em camadas); Fastify standalone (ecosistema menor para autenticação e validação).

---

### ADR-03 — Arquitetura: Monolito Modular com Clean Architecture

**Contexto:** MVP acadêmico com prazo definido; equipe pequena; requisito de evolução sustentável.

**Decisão:** monolito modular com separação em camadas (Presentation → Application → Domain → Infrastructure).

| Camada | Dependências permitidas | O que NÃO pode entrar |
|---|---|---|
| **Domain** | TypeScript puro | NestJS, Prisma, DTOs HTTP |
| **Application** | Domain + interfaces | PrismaService, controllers, HTTP |
| **Infrastructure** | Prisma, adapters | Regras de negócio |
| **Presentation** | NestJS, DTOs, use cases | SQL, Prisma direto |

**Por que não microserviços:** overhead operacional alto para MVP; transações entre OS, Orçamentos e Estoque seriam distribuídas (problema de consistência eventual); prazo não comporta infraestrutura de service mesh.

**Caminho de evolução:** a separação por módulos permite extrair `ordens-servico` ou `pecas` para microserviços independentes no futuro, sem reescrever o domínio.

---

### ADR-04 — ORM: Prisma

**Contexto:** necessidade de migrations controladas, tipos TypeScript gerados automaticamente e suporte a transações complexas.

**Decisão:** Prisma 5.

- **Schema como fonte da verdade:** `schema.prisma` define models, enums e relações — os tipos TypeScript são gerados, não escritos à mão
- **Migrations rastreadas:** cada alteração no schema gera um arquivo SQL versionado em `prisma/migrations/`
- **Isolado na infraestrutura:** `PrismaService` só existe em `infrastructure/repositories/` e `shared/database/`; use cases injetam interfaces de domínio
- **Transactions com `$transaction`:** operações atômicas (gerar orçamento + mudar status, aprovar + reservar peças) encapsuladas no repository

**Alternativas descartadas:** TypeORM (decorators no domain, acoplamento com NestJS mais invasivo); Sequelize (menos type-safe).

---

### ADR-05 — Autenticação: JWT Stateless

**Contexto:** API REST sem estado; operações públicas (consulta de status, aprovação/recusa de orçamento via webhook externo) e protegidas (operações administrativas).

**Decisão:** JWT com `@nestjs/passport` + `passport-jwt`.

- **Stateless:** servidor não mantém sessão — escalabilidade horizontal sem session store compartilhado
- **Payload:** `{ sub, email, papel }` — autorização por papel (`ADMIN`, `ATENDENTE`, `MECANICO`) sem roundtrip ao banco
- **Rotas públicas via `@Public()`:** decorator que bypassa o guard globalmente, sem duplicação de lógica
- **Hash bcrypt:** senhas nunca armazenadas em plain text; salt adaptativo resistente a força bruta

---

### Monolito Modular
O monolito modular foi escolhido por:
- **Simplicidade de deploy**: um único artefato para deploy, facilitando o MVP
- **Baixa complexidade operacional**: não exige orquestração de microserviços
- **Evolução gradual**: módulos podem ser extraídos para microserviços no futuro
- **Compartilhamento de banco**: transações cross-module são simples
- **Adequado para MVP**: foco em entregar valor rápido com arquitetura sustentável

### Relação com DDD
- **Linguagem Ubíqua**: termos do domínio (Cliente, OS, Orçamento, Peça, etc.) são usados no código, endpoints e banco
- **Camadas de domínio**: entidades, enums, regras de negócio e interfaces de repositório são separadas da infraestrutura
- **Regras de negócio no domínio**: StatusOSRules e EstoqueRules centralizam regras que não dependem de framework
- **Repositório como abstração**: interfaces definem contratos, implementações usam Prisma
- **Casos de uso**: orquestram o fluxo da aplicação sem misturar com a camada de apresentação

## 15. Regras de Negócio Principais

### Status da Ordem de Serviço (Máquina de Estados)
```
RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA → ENTREGUE
                 ↑                    │ (recusa)
                 └────────────────────┘ (orçamento recusado retorna para diagnóstico)
```

### Regras Implementadas
1. CPF/CNPJ validados algoritmicamente
2. Placa validada nos formatos antigo e Mercosul
3. Veículo deve pertencer ao cliente informado na OS
4. Toda OS inicia com status RECEBIDA
5. Transições de status respeitam a máquina de estados
6. Orçamento calcula soma de serviços + (peças × quantidade)
7. Aprovação de orçamento reserva peças automaticamente e move OS para EM_EXECUCAO
8. Recusa de orçamento marca o orçamento como RECUSADO e retorna OS para EM_DIAGNOSTICO
9. Finalização da OS realiza baixa automática do estoque
10. Não permite reserva/baixa com estoque insuficiente
11. Senhas armazenadas com hash bcrypt
12. Rotas administrativas protegidas por JWT
13. Rotas públicas: consulta de status, aprovação e recusa de orçamento

## 16. Exemplos de Requests

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@email.com", "senha": "123456"}'
```

### Criar Cliente
```bash
curl -X POST http://localhost:3000/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "nome": "João da Silva",
    "documento": "12345678909",
    "tipoDocumento": "CPF",
    "telefone": "11999998888",
    "email": "joao@email.com"
  }'
```

### Criar OS
```bash
curl -X POST http://localhost:3000/ordens-servico \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "clienteId": "<uuid>",
    "veiculoId": "<uuid>",
    "servicos": [{"servicoId": "<uuid>"}],
    "pecas": [{"pecaId": "<uuid>", "quantidade": 2}]
  }'
```

### Consultar Status (Pública)
```bash
curl http://localhost:3000/ordens-servico/<id>/status
```

## 17. Notificação de Orçamento por Email (Atualização de Status — Fase 2)

Requisito da Fase 2: *"Atualização de status da OS via alguma ferramenta como email."*

### Como funciona

```
POST /ordens-servico/:id/gerar-orcamento
        │
        ▼
 Orçamento calculado e persistido (status → AGUARDANDO_APROVACAO)
        │
        ▼
 Email enviado automaticamente ao cliente com:
   - Resumo da OS (número, veículo, valor total)
   - Botão "Aprovar orçamento"  → POST /ordens-servico/:id/aprovar-orcamento (público)
   - Botão "Recusar orçamento" → POST /ordens-servico/:id/recusar-orcamento  (público)
        │
        ▼
 Cliente clica em um dos links → status da OS é atualizado automaticamente
   Aprovado → EM_EXECUCAO (reserva peças em estoque)
   Recusado → EM_DIAGNOSTICO
```

### Arquitetura (Clean Architecture aplicada)

| Camada | Componente | Responsabilidade |
|---|---|---|
| Domain | `INotificacaoOrcamentoService` | Interface pura — define o contrato sem conhecer nodemailer/SMTP |
| Application | `GerarOrcamentoUseCase` | Injeta a interface via `@Optional()` — funciona mesmo sem serviço de email configurado |
| Infrastructure | `EmailNotificacaoOrcamentoService` | Implementação concreta com `nodemailer`, isolada do domínio |

### Configuração

**Desenvolvimento (sem configurar nada):** ao deixar `SMTP_USER`/`SMTP_PASS` vazios, o serviço cria automaticamente uma conta de teste no [Ethereal](https://ethereal.email) e imprime no log um link de preview do email enviado — nenhum email real é entregue, ideal para demonstração.

```bash
docker compose up -d --build
docker logs oficina-app -f
```

Ao gerar um orçamento, o log mostra:
```
[EmailNotificacaoOrcamentoService] Nenhuma credencial SMTP configurada — conta de teste Ethereal criada automaticamente (xxxx@ethereal.email)
[EmailNotificacaoOrcamentoService] Email de orçamento enviado para cliente@email.com | OS #3 | messageId: ...
[EmailNotificacaoOrcamentoService] Preview do email (Ethereal): https://ethereal.email/message/xxxxx
```

**Produção / email real:** configure as variáveis SMTP com um provedor real (Gmail, SendGrid, Amazon SES, etc.):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=senha-de-app          # Gmail exige "senha de app", não a senha da conta
SMTP_FROM=seuemail@gmail.com    # aceita "email@dominio.com" ou "Nome <email@dominio.com>"
APP_URL=https://sua-api-em-producao.com
```

> Em redes corporativas com inspeção SSL (antivírus/proxy que substitui o certificado do servidor), o handshake TLS pode falhar com `self-signed certificate in certificate chain`. Nesse caso, defina `SMTP_TLS_REJECT_UNAUTHORIZED=false` — **apenas em desenvolvimento, nunca em produção**.

### Resiliência

Se o serviço de notificação não estiver registrado no módulo (`@Optional()`), a geração do orçamento continua funcionando normalmente — o envio de email nunca bloqueia o fluxo principal de negócio. Se o cliente da OS não tiver email cadastrado, a notificação é apenas registrada como aviso no log, sem lançar exceção.
