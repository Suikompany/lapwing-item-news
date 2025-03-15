terraform {
  required_version = "~> 1.11.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "2.7.0"
    }
  }

  backend "s3" {
    bucket = "lapitemnews-tf-backend"
    key    = "terraform.tfstate"
    region = "ap-northeast-1"
  }
}

resource "aws_s3_bucket" "tf_backend" {
  bucket = "lapitemnews-tf-backend"
}
resource "aws_s3_bucket_versioning" "tf_backend" {
  bucket = aws_s3_bucket.tf_backend.bucket
  versioning_configuration {
    status = "Enabled"
  }
}


locals {
  aws_region = "ap-northeast-1"

  prefix = "lapitemnews"

  lambda = {
    function_name    = "${local.prefix}-lambda"
    execution_role   = "${local.prefix}-lambda-role"
    execution_policy = "${local.prefix}-lambda-policy"
    runtime          = "nodejs22.x"
    file_name        = "index"
    handler          = "handler"
  }

  scheduler = {
    group_name       = "${local.prefix}-scheduler-group"
    name             = "${local.prefix}-scheduler"
    execution_role   = "${local.prefix}-scheduler-role"
    execution_policy = "${local.prefix}-scheduler-policy"
  }

  base_scraped_at = "2025-03-12T12:00:00.000Z"
  base_product_id = 6683896

  ssm_param = {
    latest_scraped_at = "/LapNewItemScrapedLog/LatestScrapedAt"
    latest_product_id = "/LapNewItemScrapedLog/LatestProductId"
    twitter = {
      access_token        = "/LapNewItemScrapedLog/Twitter/AccessToken"
      access_token_secret = "/LapNewItemScrapedLog/Twitter/AccessTokenSecret"
      api_key             = "/LapNewItemScrapedLog/Twitter/ApiKey"
      api_secret          = "/LapNewItemScrapedLog/Twitter/ApiSecret"
    }
  }

  dynamodb = {
    name          = "LapNewItemScrapedLog"
    partition_key = "ScrapedAt"
  }
}

provider "aws" {
  region = local.aws_region
}
