# 1. Bucket S3 para uploads e anexos de OS
resource "aws_s3_bucket" "oficina_storage" {
  bucket        = "techchallenge-oficina-mecanica-storage-2026"
  force_destroy = true

  tags = {
    Name        = "OficinaMecanicaStorage"
    Environment = "TechChallenge"
  }
}

# 2. Security Group para o RDS (PostgreSQL - Porta 5432)
resource "aws_security_group" "rds_sg" {
  name        = "oficina_rds_sg"
  description = "Liberar porta 5432 para conexao ao PostgreSQL"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Libera acesso na porta 5432
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "OficinaRDSSecurityGroup"
  }
}

# 3. Banco de Dados PostgreSQL (RDS)
resource "aws_db_instance" "postgres_db" {
  allocated_storage      = 20
  max_allocated_storage  = 50
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  db_name                = "oficina_mecanica"
  username               = "postgres"
  password               = var.db_password
  skip_final_snapshot    = true
  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id] # ⬅️ Vincula o Security Group do RDS

  tags = {
    Name = "OficinaMecanicaRDS"
  }
}

# 4. Security Group para a EC2 (SSH + Porta 3000)
resource "aws_security_group" "app_sg" {
  name        = "oficina_app_sg"
  description = "Liberar SSH e porta da aplicacao"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "OficinaSecurityGroup"
  }
}

# 5. Chave SSH gerada automaticamente para acesso à instância EC2
resource "tls_private_key" "app_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "app_key_pair" {
  key_name   = "${var.project_name}-key"
  public_key = tls_private_key.app_key.public_key_openssh
}

# 6. Servidor/Instância EC2 para rodar a Aplicação / Kubernetes
resource "aws_instance" "app_server" {
  ami                         = "ami-0c7217cdde317cfec"
  instance_type               = "t3.medium"
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  key_name                    = aws_key_pair.app_key_pair.key_name

  # Instalação automática do Docker na inicialização da máquina
  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu
              EOF

  tags = {
    Name = "OficinaMecanicaServer"
  }
}
