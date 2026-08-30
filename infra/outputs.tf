output "s3_bucket_name" {
  description = "Nome do Bucket S3 criado"
  value       = aws_s3_bucket.oficina_storage.id
}

output "rds_endpoint" {
  description = "URL de conexao com o banco PostgreSQL"
  value       = aws_db_instance.postgres_db.endpoint
}

output "server_public_ip" {
  description = "IP Publico do servidor da aplicacao"
  value       = aws_instance.app_server.public_ip
}

output "ssh_private_key" {
  description = "Chave SSH privada para acesso a instancia EC2 (sensivel)"
  value       = tls_private_key.app_key.private_key_pem
  sensitive   = true
}

output "database_url" {
  description = "URL de conexao completa do banco PostgreSQL"
  value       = "postgresql://:@/?schema=public"
  sensitive   = true
}