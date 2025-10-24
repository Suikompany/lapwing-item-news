variable "dist_dir" {
  type     = string
  nullable = false
  default  = "dist"
}

locals {

  dist_dir = var.dist_dir
  lambda = {
    function_name    = "${local.project}-${local.stage}-lambda"
    execution_role   = "${local.project}-${local.stage}-lambda-role"
    execution_policy = "${local.project}-${local.stage}-lambda-policy"
    runtime          = "nodejs22.x"
    file_name        = "index"
    handler          = "handler"
  }
}

data "archive_file" "lambda_zip" {
  type             = "zip"
  source_dir       = "${local.dist_dir}/src"
  excludes         = ["*.zip"]
  output_path      = "${local.dist_dir}/${local.lambda.file_name}.zip"
  output_file_mode = "0644"
}

resource "aws_lambda_function" "lambda_function" {
  function_name    = local.lambda.function_name
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  handler          = "${local.lambda.file_name}.${local.lambda.handler}"
  runtime          = local.lambda.runtime
  timeout          = 180

  architectures = ["arm64"]

  role = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      STAGE       = local.stage
      BUCKET_NAME = aws_s3_bucket.bucket.bucket
      ALLOW_TWEET = "false"
      BLOCKED_SUBDOMAINS = ""
    }
  }

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.lambda_log_group.name
  }
}

resource "aws_iam_role" "lambda_role" {
  name = local.lambda.execution_role

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_policy" "lambda_policy" {
  name = local.lambda.execution_policy

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
        ],
        Resource = [
          "${aws_s3_bucket.bucket.arn}",
          "${aws_s3_bucket.bucket.arn}/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "kms:Decrypt"
        ],
        Resource = [
          aws_ssm_parameter.twitter_credential.arn,
        ]
      },
    ]
  })
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${local.lambda.function_name}"
  retention_in_days = 14
}
