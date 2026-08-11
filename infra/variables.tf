variable "project_name" {
  description = "Nome do projeto Tech Challenge"
  type        = string
  default     = "oficina-mecanica"
}

variable "aws_region" {
  description = "Região da AWS para deploy dos recursos"
  type        = string
  default     = "us-east-1"
}

variable "db_password" {
  description = "Senha do banco PostgreSQL no RDS"
  type        = string
  default     = "postgres123456"
  sensitive   = true
}