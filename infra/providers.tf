terraform {
  required_version = ">= 1.0"

  # Backend S3 para persistir o estado do Terraform na esteira CI/CD
  # A configuracao do bucket e passada via -backend-config no GitHub Actions
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}