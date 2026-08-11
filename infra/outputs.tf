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