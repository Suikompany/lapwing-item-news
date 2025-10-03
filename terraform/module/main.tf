terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.14.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7.0"
    }
  }
}

variable "stage" {
  type     = string
  nullable = false
  validation {
    condition     = contains(["dev", "prod"], var.stage)
    error_message = "`stage` must be 'dev' or 'prod'."
  }
}
locals {
  aws_region = "ap-northeast-1"

  name  = "lapwing-item-news"
  stage = var.stage
}

provider "aws" {
  region = local.aws_region
  default_tags {
    tags = {
      name  = local.name
      stage = local.stage
    }
  }
}
