terraform {
  required_version = "~> 1.13.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  name  = "lapwing-item-news"
  available_stage = ["dev", "prod"]
}

provider "aws" {
  region = "ap-northeast-1"

  default_tags {
    tags = {
      name  = local.name
    }
  }
}
# GitHub Actions OIDCプロバイダー設定
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
  # GitHubのOIDCの証明書のサムプリント https://github.blog/changelog/2022-01-13-github-actions-update-on-oidc-based-deployments-to-aws/
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  client_id_list = ["sts.amazonaws.com"]
}

# GitHub Actions 用ロール
resource "aws_iam_role" "github_actions_role" {
  name = "lapwing-item-news-deploy-role"
  path = "/"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github_actions.arn
      }
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        },
        StringLike = {
          "token.actions.githubusercontent.com:sub" = [
            "repo:Suikompany/lapwing-item-news:*",
          ]
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_actions_policy" {
  name = "lapwing-item-news-deploy-policy"
  role = aws_iam_role.github_actions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = [
          aws_s3_bucket.tf_backend.arn,
          "${aws_s3_bucket.tf_backend.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "iam:ListRoles",
          "iam:CreateRole",
          "iam:CreatePolicy",
          "iam:AttachRolePolicy",
          "iam:PutRolePolicy",
          "iam:UpdateRole",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:CreateFunction",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:AddPermission",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:CreateBucket",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:PutParameter",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
        ]
        Resource = "*"
      },
      {
        Effect = "Deny",
        Action = [
          "iam:Create*",
          "lambda:Create*",
          "s3:Create*",
          "ssm:PutParameter",
        ],
        Resource = "*",
        Condition = {
          Null = {
            "aws:RequestTag/name"  = "true"
            "aws:RequestTag/stage" = "true"
          }
          StringNotEquals = {
            "aws:RequestTag/name"  = local.name
            "aws:RequestTag/stage" = local.available_stage
          }
        }
      },
      {
        Effect = "Deny",
        Action = [
          "iam:Attach*",
          "iam:Put*",
          "iam:Update*",
          "lambda:Update*",
          "lambda:Add*",
          "ssm:GetParameter*",
        ],
        Condition = {
          Null = {
            "aws:ResourceTag/name"  = "true"
            "aws:ResourceTag/stage" = "true"
          }
          StringNotEquals = {
            "aws:ResourceTag/name"  = local.name
            "aws:ResourceTag/stage" = local.available_stage
          }
        }
      },
    ]
  })
}

resource "aws_s3_bucket" "tf_backend" {
  bucket = "lapwing-item-news-tf-backend"
}

resource "aws_s3_bucket_versioning" "tf_backend" {
  bucket = aws_s3_bucket.tf_backend.bucket
  versioning_configuration {
    status = "Enabled"
  }
}
