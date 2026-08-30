output "s3_bucket_name" {
  description = "Nome do Bucket S3 criado"
  value       = aws_s3_bucket.oficina_storage.id
}

output "rds_endpoint" {
  description = "URL de conexão com o banco PostgreSQL"
  value       = aws_db_instance.postgres_db.endpoint
}

output "server_public_ip" {
  description = "IP Público do servidor da aplicação"
  value       = aws_instance.app_server.public_ip
}

output "ssh_private_key" {
  description = "Chave SSH privada para acesso à instância EC2 (sensível)"
  value       = tls_private_key.app_key.private_key_pem
  sensitive   = true
}

output "database_url" {
  description = "URL de conexão completa do banco PostgreSQL (para uso no GitHub Secrets)"
  value       = "postgresql://${aws_db_instance.postgres_db.username}:${var.db_password}@${aws_db_instance.postgres_db.endpoint}/${aws_db_instance.postgres_db.db_name}?schema=public"
  sensitive   = true
}
