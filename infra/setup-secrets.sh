#!/bin/bash
# ============================================================
# 🔧 Script de Configuração Automática das GitHub Secrets
# ============================================================
# Este script lê os outputs do Terraform e cadastra
# automaticamente as Secrets no repositório do GitHub.
#
# Pré-requisitos:
#   1. Ter o GitHub CLI (gh) instalado e autenticado (gh auth login)
#   2. Ter executado "terraform apply" com sucesso na pasta /infra
#
# Uso:
#   cd infra
#   terraform apply
#   chmod +x setup-secrets.sh
#   ./setup-secrets.sh
# ============================================================

set -e

# Repositório alvo no GitHub
REPO="FernandoGreco/techChallengePosTech"

echo ""
echo "🔐 =============================================="
echo "   Configuração Automática das GitHub Secrets"
echo "🔐 =============================================="
echo ""

# 1. EC2_HOST - IP Público do Servidor
echo "📡 [1/5] Configurando EC2_HOST (IP do servidor)..."
EC2_HOST=$(terraform output -raw server_public_ip)
echo "$EC2_HOST" | gh secret set EC2_HOST --repo "$REPO"
echo "   ✅ EC2_HOST = $EC2_HOST"

# 2. EC2_USER - Usuário SSH (Ubuntu)
echo "👤 [2/5] Configurando EC2_USER..."
echo "ubuntu" | gh secret set EC2_USER --repo "$REPO"
echo "   ✅ EC2_USER = ubuntu"

# 3. EC2_SSH_KEY - Chave SSH Privada
echo "🔑 [3/5] Configurando EC2_SSH_KEY (chave privada)..."
terraform output -raw ssh_private_key | gh secret set EC2_SSH_KEY --repo "$REPO"
echo "   ✅ EC2_SSH_KEY = ******** (chave privada configurada)"

# 4. DATABASE_URL - URL de conexão com o banco PostgreSQL (RDS)
echo "🐘 [4/5] Configurando DATABASE_URL..."
terraform output -raw database_url | gh secret set DATABASE_URL --repo "$REPO"
echo "   ✅ DATABASE_URL = ******** (URL do banco configurada)"

# 5. JWT_SECRET - Chave secreta para JWT
echo "🔒 [5/5] Configurando JWT_SECRET..."
echo "oficina-mecanica-jwt-secret-prod" | gh secret set JWT_SECRET --repo "$REPO"
echo "   ✅ JWT_SECRET = ******** (chave JWT configurada)"

echo ""
echo "🎉 =============================================="
echo "   Todas as 5 Secrets foram configuradas!"
echo "🎉 =============================================="
echo ""
echo "📋 Resumo:"
echo "   • EC2_HOST     → $EC2_HOST"
echo "   • EC2_USER     → ubuntu"
echo "   • EC2_SSH_KEY  → (chave RSA 4096 bits)"
echo "   • DATABASE_URL → (PostgreSQL RDS endpoint)"
echo "   • JWT_SECRET   → (chave JWT produção)"
echo ""
echo "🚀 Agora faça um push para a branch 'main' e a"
echo "   esteira CI/CD fará o deploy automaticamente!"
echo ""
