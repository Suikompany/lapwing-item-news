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
  project         = "lapwing-item-news"
  available_stage = ["dev", "prod"]
}

provider "aws" {
  region = "ap-northeast-1"

  default_tags {
    tags = {
      project = local.project
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
          "iam:List*",
          "iam:GetRole",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:CreateRole",
          "iam:CreatePolicy",
          "iam:CreatePolicyVersion",
          "iam:AttachRolePolicy",
          "iam:PutRolePolicy",
          "iam:UpdateRole",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:TagPolicy",
          "iam:UntagPolicy",
          "iam:PassRole",
          "iam:DeleteRole",
          "iam:DeletePolicy",
          "iam:DetachRolePolicy",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:List*",
          "lambda:GetFunction*",
          "lambda:CreateFunction",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:TagResource",
          "lambda:UntagResource",
          "lambda:AddPermission",
          "lambda:DeleteFunction",
          "logs:ListLogGroups",
          "logs:DescribeLogGroups",
          "logs:CreateLogGroup",
          "logs:PutRetentionPolicy",
          "logs:DeleteLog*",
          "logs:*Tag*",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucket*",
          "s3:Get*Configuration*",
          "s3:GetBucketTagging",
          "s3:CreateBucket",
          "s3:PutBucketTagging",
          "s3:PutBucketPolicy",
          "s3:DeleteBucket",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:*Tags*Resource",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "ssm:DescribeParameters",
          "ssm:PutParameter",
          "ssm:DeleteParameter*",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "scheduler:List*",
          "scheduler:GetScheduleGroup",
          "scheduler:GetSchedule",
          "scheduler:CreateScheduleGroup",
          "scheduler:CreateSchedule",
          "scheduler:UpdateSchedule",
          "scheduler:TagResource",
          "scheduler:UntagResource",
        ]
        Resource = "*"
      },
      {
        Effect = "Deny",
        Action = [
          "iam:CreateRole",
          "iam:CreatePolicy",
          "iam:TagRole",
          "iam:TagPolicy",
          "lambda:Create*",
          "lambda:TagResource",
          "logs:CreateLogGroup",
          "logs:Tag*",
          "ssm:PutParameter",
          "ssm:AddTagsToResource",
          "scheduler:CreateScheduleGroup",
          "scheduler:TagResource",
        ],
        Resource = "*",
        Condition = {
          Null = {
            "aws:RequestTag/project" = "true"
            "aws:RequestTag/stage"   = "true"
          }
          StringNotEquals = {
            "aws:RequestTag/project" = local.project
            "aws:RequestTag/stage"   = local.available_stage
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
          "ssm:*Tags*Resource",
          "ssm:DeleteParameter*",
          "scheduler:CreateSchedule",
          "scheduler:Update*",
          "scheduler:UntagResource",
        ],
        Resource = "*",
        Condition = {
          Null = {
            "aws:ResourceTag/project" = "true"
            "aws:ResourceTag/stage"   = "true"
          }
          StringNotEquals = {
            "aws:ResourceTag/project" = local.project
            "aws:ResourceTag/stage"   = local.available_stage
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
