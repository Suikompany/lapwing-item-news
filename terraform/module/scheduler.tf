locals {
  scheduler = {
    group_name       = "${local.project}-${local.stage}-scheduler-group"
    name             = "${local.project}-${local.stage}-scheduler"
    execution_role   = "${local.project}-${local.stage}-scheduler-role"
    execution_policy = "${local.project}-${local.stage}-scheduler-policy"
  }
}

resource "aws_scheduler_schedule_group" "group" {
  name = local.scheduler.group_name
}

resource "aws_scheduler_schedule" "invoke_lambda" {
  name       = local.scheduler.name
  group_name = aws_scheduler_schedule_group.group.name

  schedule_expression          = "cron(0/10 * * * ? *)" # 10分毎に実行
  schedule_expression_timezone = "Asia/Tokyo"

  flexible_time_window {
    mode                      = "FLEXIBLE"
    maximum_window_in_minutes = 1
  }

  target {
    arn      = aws_lambda_function.lambda_function.arn
    role_arn = aws_iam_role.scheduler_role.arn

    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}

resource "aws_iam_role" "scheduler_role" {
  name = local.scheduler.execution_role

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "scheduler" {
  role       = aws_iam_role.scheduler_role.name
  policy_arn = aws_iam_policy.scheduler_policy.arn
}

resource "aws_iam_policy" "scheduler_policy" {
  name = local.scheduler.execution_policy

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "lambda:InvokeFunction",
        ]
        Effect = "Allow"
        Resource = [
          aws_lambda_function.lambda_function.arn
        ]
      },
    ]
  })
}
