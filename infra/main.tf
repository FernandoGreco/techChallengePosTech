# 1. Bucket S3 para uploads e anexos de OS
resource "aws_s3_bucket" "oficina_storage" {
  bucket        = "techchallenge-oficina-mecanica-storage-2026"
  force_destroy = true

  tags = {
    Name        = "OficinaMecanicaStorage"
    Environment = "TechChallenge"
  }
}

# 2. Banco de Dados PostgreSQL (RDS)
resource "aws_db_instance" "postgres_db" {
  allocated_storage      = 20
  max_allocated_storage  = 50
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro" # Adequado para conta de estudante/free tier
  db_name                = "oficina_mecanica"
  username               = "postgres"
  password               = var.db_password
  skip_final_snapshot    = true
  publicly_accessible    = true

  tags = {
    Name = "OficinaMecanicaRDS"
  }
}

# 3. Servidor/Instância para rodar a Aplicação / Kubernetes
resource "aws_instance" "app_server" {
  ami           = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS em us-east-1
  instance_type = "t3.medium"            # Recomendado para rodar Docker/K8s

  tags = {
    Name = "OficinaMecanicaServer"
  }
}