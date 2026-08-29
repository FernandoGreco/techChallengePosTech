# Oficina Mecânica - Sistema de Gestão (MVP)

## 1. Objetivo

MVP acadêmico de um sistema de gestão para oficina mecânica de médio porte, desenvolvido como Tech Challenge de pós-graduação em Arquitetura de Software.

O sistema permite:
- Gestão de clientes e veículos
- Criação e acompanhamento de ordens de serviço (OS)
- Inclusão de serviços e peças/insumos
- Geração e aprovação de orçamentos
- Controle de estoque
- Autenticação JWT para rotas administrativas
- Documentação completa via Swagger



## 2. Tecnologias Utilizadas e Justificativas

| Tecnologia | Versão | Por que foi escolhida |
|---|---|---|
| **Node.js** | 20.x LTS | Runtime JavaScript maduro com suporte a I/O assíncrono não-bloqueante — ideal para APIs REST que realizam muitas operações de banco em paralelo (transactions, includes). A equipe já domina o ecossistema Node por trabalhar com Angular no frontend, reduzindo a curva de aprendizado e permitindo compartilhar padrões e ferramentas entre back e front |
| **TypeScript** | 5.x | Tipagem estática elimina erros em tempo de desenvolvimento, é obrigatório no ecossistema NestJS e facilita o contrato entre camadas (domain ↔ application ↔ infra) sem casting em tempo de execução. Por ser a linguagem padrão do Angular, toda a equipe já tem fluência em TypeScript, acelerando o desenvolvimento e o code review |
| **NestJS** | 11.x | Framework opinativo com suporte nativo a injeção de dependência, módulos, guards e decorators — permite separar camadas de forma declarativa sem boilerplate. Alinhado com a arquitetura hexagonal/Clean Architecture pela facilidade de registrar implementações por token (`useClass`) |
| **PostgreSQL** | 16 | Banco relacional com transações ACID, integridade referencial via FK e suporte a JSON — necessário para o domínio complexo com múltiplas relações (OS → Orçamentos → Histórico). Ver seção 14 para análise detalhada |
| **Prisma ORM** | 5.x | Gera tipos TypeScript automaticamente a partir do schema, simplifica migrations e oferece query builder type-safe. Isolado na camada de infra — use cases dependem de interfaces, não do Prisma diretamente |
| **JWT** (`@nestjs/jwt`) | 11.x | Stateless, sem necessidade de session store no servidor. Payload carrega `sub`, `email` e `papel`, eliminando roundtrip ao banco para autorização |
| **bcryptjs** | 3.x | Hash de senhas com salt adaptativo (fator de custo configurável). Resistente a ataques de rainbow table e força bruta |
| **Swagger** (`@nestjs/swagger`) | 11.x | Documentação gerada diretamente dos decorators NestJS, sempre sincronizada com o código. Reduz divergência entre código e spec |
| **Jest** | 30.x | Framework de testes padrão do ecossistema NestJS, com suporte a mocks, spies e cobertura integrada. Permite testar use cases em isolamento sem subir banco. A equipe já utiliza Jest no frontend Angular (via Jest ou Karma/Jasmine com API similar), tornando a escrita de testes mais natural e produtiva |
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

### Cobertura Atual (Fase 2 — branch refactor/os-use-cases)

| Métrica | Resultado |
|---|---|
| **Suites** | 35 passando / 35 total |
| **Testes** | 227 passando / 227 total |
| **Statements** | 87% (974/1118) |
| **Functions** | 83% (185/222) |
| **Lines** | 87% (857/988) |
| **Branches** | 62% (145/234) |

### O que está coberto

| Módulo | Tipo de teste | Cenários principais |
|---|---|---|
| `ordens-servico` — use cases | Unitário (mock de repository) | Criar OS com status RECEBIDA; iniciar diagnóstico; gerar, aprovar e recusar orçamento; estoque insuficiente bloqueia aprovação; finalizar com baixa de estoque; entregar; transições inválidas lançam exceção |
| `ordens-servico` — repository | Unitário (mock Prisma) | Listagem operacional exclui FINALIZADA/ENTREGUE; ordenação por prioridade de status; mais antigas primeiro dentro do mesmo status |
| `ordens-servico` — controller | Unitário | Cada endpoint delega ao use case correto com os parâmetros corretos |
| `pecas` — rules | Unitário | Validação de disponibilidade de estoque; validação de baixa |
| `pecas` — use case | Unitário (mock repository) | Criar, listar, reservar, baixar estoque |
| `pecas` — repository | Unitário (mock Prisma) | CRUD + operações de estoque |
| `clientes` — use case | Unitário (mock repository) | Criar, buscar por documento, conflito de documento duplicado |
| `clientes` — repository | Unitário (mock Prisma) | CRUD com validações |
| `veiculos` — use case | Unitário (mock repository) | Criar, buscar, validar pertencimento ao cliente |
| `servicos` — use case | Unitário (mock repository) | CRUD de catálogo |
| `auth` — LoginUseCase | Unitário (mock IUsuarioRepository) | Credenciais válidas retornam JWT; usuário não existe rejeita; senha errada rejeita |
| `auth` — JwtStrategy / Guard | Unitário | Validação de payload; rota pública bypassa guard |
| `shared` — validators | Unitário | CPF válido/inválido; CNPJ válido/inválido; Placa formato antigo/Mercosul |
| `shared` — PrismaService | Unitário | Inicialização e desconexão |

### Estratégia de testes

Os testes unitários de use cases utilizam **mocks de repository** (sem banco real), garantindo que:
- A lógica de negócio é validada em isolamento total
- Os testes rodam em milissegundos
- Erros de banco não poluem falhas de regra de negócio

A camada de infraestrutura (Prisma repositories) é testada com **mock do PrismaService**, verificando que as queries corretas são construídas sem precisar de banco ativo.

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
