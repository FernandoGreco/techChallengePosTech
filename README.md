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



## 2. Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 20.x | Runtime |
| TypeScript | 5.x | Linguagem |
| NestJS | 11.x | Framework |
| PostgreSQL | 16 | Banco de dados |
| Prisma ORM | 5.x | ORM |
| JWT (`@nestjs/jwt`) | 11.x | Autenticação |
| Swagger (`@nestjs/swagger`) | 11.x | Documentação |
| Jest | 30.x | Testes |
| Docker | - | Containerização |
| ESLint (`eslint`) + Prettier | Qualidade de código |

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

## 7. Kubernetes

A aplicação pode ser executada em um cluster Kubernetes. Os manifestos necessários estão disponíveis no diretório `/k8s`.

A solução utiliza Kubernetes para orquestração dos containers da API e do PostgreSQL, permitindo gerenciamento de réplicas, configuração centralizada, persistência de dados e escalabilidade horizontal automática.

### Arquitetura Kubernetes

A estrutura utilizada é:

```text
                    Kubernetes Cluster
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
      oficina-api-service       postgres-service
              │                         │
              ▼                         ▼
       API Deployment          PostgreSQL Deployment
              │                         │
       ┌──────┴──────┐                  ▼
       ▼             ▼             PostgreSQL Pod
    API Pod        API Pod               │
       │             │                   ▼
       └──────┬──────┘                  PVC
              │
              ▼
             HPA
       min: 2 / max: 6
         CPU alvo: 70%
```

### Estrutura dos manifestos

```text
k8s/
├── namespace.yaml
├── configmap.yaml
├── secret.yaml
├── app-deployment.yaml
├── app-service.yaml
├── hpa.yaml
└── postgres/
    ├── postgres-deployment.yaml
    ├── postgres-service.yaml
    └── postgres-pvc.yaml
```

### Recursos utilizados

A infraestrutura Kubernetes utiliza:

- **Namespace**: isolamento dos recursos da aplicação através do namespace `oficina`;
- **Deployment da API**: mantém as instâncias da API NestJS em execução;
- **Service da API**: fornece acesso estável aos pods da aplicação;
- **Deployment PostgreSQL**: executa o banco PostgreSQL dentro do cluster;
- **Service PostgreSQL**: permite a comunicação interna entre API e banco;
- **PersistentVolumeClaim (PVC)**: fornece persistência aos dados do PostgreSQL;
- **ConfigMap**: armazena configurações não sensíveis da aplicação;
- **Secret**: armazena configurações sensíveis utilizadas pela aplicação;
- **Horizontal Pod Autoscaler (HPA)**: realiza escalabilidade automática dos pods da API.

### Pré-requisitos

Para execução local:

- Docker Desktop;
- Kubernetes habilitado no Docker Desktop;
- `kubectl` configurado;
- Metrics Server instalado no cluster.

Verifique o cluster:

```bash
kubectl get nodes
```

### Deploy no Kubernetes

Primeiro aplique o namespace:

```bash
kubectl apply -f k8s/namespace.yaml
```

Depois aplique ConfigMap e Secret:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
```

Suba o PostgreSQL:

```bash
kubectl apply -f k8s/postgres/
```

Suba a aplicação:

```bash
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml
```

Por último, configure o autoscaling:

```bash
kubectl apply -f k8s/hpa.yaml
```

### Verificando os recursos

Para verificar todos os recursos:

```bash
kubectl get all -n oficina
```

Pods:

```bash
kubectl get pods -n oficina
```

Deployments:

```bash
kubectl get deployments -n oficina
```

Services:

```bash
kubectl get services -n oficina
```

PersistentVolumeClaim:

```bash
kubectl get pvc -n oficina
```

ConfigMaps:

```bash
kubectl get configmaps -n oficina
```

HPA:

```bash
kubectl get hpa -n oficina
```

### Acessando a API

Para acessar a aplicação localmente:

```bash
kubectl port-forward service/oficina-api-service 3000:3000 -n oficina
```

A API ficará disponível em:

`http://localhost:3000`

Swagger:

`http://localhost:3000/api/docs`

---

### 📈 Horizontal Pod Autoscaler

A API utiliza **Horizontal Pod Autoscaler (HPA)** para permitir escalabilidade automática conforme o consumo de CPU.

Configuração atual:

| Configuração | Valor |
|---|---:|
| Réplicas mínimas | 2 |
| Réplicas máximas | 6 |
| CPU alvo | 70% |

O HPA monitora o consumo médio de CPU dos pods e ajusta automaticamente a quantidade de réplicas do Deployment `oficina-api`.

Para acompanhar:

```bash
kubectl get hpa -n oficina -w
```

Em outro terminal:

```bash
kubectl get pods -n oficina -w
```

Durante os testes de carga realizados no ambiente local, a aplicação escalou automaticamente de **2 para 6 pods**, demonstrando o funcionamento do HPA.

### Metrics Server

O HPA depende da API de métricas do Kubernetes.

Verifique se as métricas estão disponíveis:

```bash
kubectl top nodes
kubectl top pods -n oficina
```

Caso o Metrics Server ainda não esteja instalado no ambiente local:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

Em ambientes locais Docker Desktop/kind pode ser necessário permitir a comunicação do Metrics Server com o kubelet utilizando:

```bash
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/args/-",
    "value": "--kubelet-insecure-tls"
  }
]'
```

> O uso de `--kubelet-insecure-tls` é destinado somente ao ambiente local de desenvolvimento utilizado neste projeto e não é recomendado como configuração de produção.

Após a configuração:

```bash
kubectl top pods -n oficina
```

### Removendo o ambiente Kubernetes

Para remover todos os recursos do projeto:

```bash
kubectl delete namespace oficina
```

## 8. Variáveis de Ambiente

| Variável | Descrição | Valor padrão |
|---|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://postgres:postgres@localhost:5432/oficina_mecanica?schema=public` |
| `JWT_SECRET` | Chave secreta para tokens JWT | `oficina-mecanica-jwt-secret-dev` |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `1d` |
| `PORT` | Porta da aplicação | `3000` |

## 9. Como Executar Migrations

```bash
# Criar e aplicar migrations
npx prisma migrate dev --name init

# Apenas aplicar migrations existentes (produção)
npx prisma migrate deploy
```

## 10. Como Rodar Seed

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

## 11. Como Executar Testes

```bash
# Testes unitários
npm test

# Testes com cobertura
npm run test:cov

# Testes de integração (e2e) - requer banco PostgreSQL rodando
npm run test:e2e
```

## 12. Como Acessar o Swagger

Após iniciar a aplicação, acesse:

```
http://localhost:3000/api/docs
```

Para autenticar no Swagger:
1. Execute `POST /auth/login` com as credenciais
2. Copie o `accessToken` retornado
3. Clique em "Authorize" no topo do Swagger
4. Cole o token no campo "Value"

## 13. Usuário Admin de Teste

| Campo | Valor |
|---|---|
| Email | `admin@email.com` |
| Senha | `123456` |
| Papel | `ADMIN` |

## 14. Principais Endpoints


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

## 15. Decisões Técnicas

### Justificativa do Banco de Dados

**PostgreSQL 16** foi escolhido pelos seguintes motivos:

| Critério | Justificativa |
|---|---|
| **Relacionamentos complexos** | O domínio possui múltiplas relações (Cliente → Veículo → OS → Serviços/Peças → Orçamento → Histórico), demandando integridade referencial garantida por FK e transações ACID |
| **Transações ACID** | Operações como geração de orçamento, aprovação e baixa de estoque precisam ser atômicas; o PostgreSQL suporta transações robustas com rollback confiável |
| **Maturidade e suporte** | Banco open-source amplamente adotado na indústria, com suporte de longo prazo (LTS) e ecossistema maduro de ferramentas |
| **Integração com Prisma ORM** | Suporte nativo e de primeira classe no Prisma, simplificando migrations, seeding e geração de tipos TypeScript |
| **Consultas analíticas** | O módulo de relatórios (tempo médio de execução) se beneficia das capacidades de agregação e filtragem eficiente do PostgreSQL |
| **Escalabilidade vertical** | Para um MVP de oficina de médio porte, a escalabilidade vertical do PostgreSQL é mais que suficiente, com possibilidade de otimização via índices e particionamento futuramente |

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

## 16. Regras de Negócio Principais

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

## 17. Exemplos de Requests

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
