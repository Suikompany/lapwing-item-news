variable "twitter_api_key" {
  type      = string
  nullable  = false
  sensitive = true
  ephemeral = true
}
variable "twitter_api_secret" {
  type      = string
  nullable  = false
  sensitive = true
  ephemeral = true
}
variable "twitter_access_token" {
  type      = string
  nullable  = false
  sensitive = true
  ephemeral = true
}
variable "twitter_access_token_secret" {
  type      = string
  nullable  = false
  sensitive = true
  ephemeral = true
}

resource "aws_ssm_parameter" "latest_product_id" {
  name           = local.ssm_param.latest_product_id
  type           = "String"
  insecure_value = local.base_product_id

  lifecycle {
    ignore_changes = [
      insecure_value
    ]
  }

}

resource "aws_ssm_parameter" "twitter_access_token" {
  name             = local.ssm_param.twitter.access_token
  type             = "SecureString"
  value_wo         = var.twitter_access_token
  value_wo_version = 1
}

resource "aws_ssm_parameter" "twitter_access_token_secret" {
  name             = local.ssm_param.twitter.access_token_secret
  type             = "SecureString"
  value_wo         = var.twitter_access_token_secret
  value_wo_version = 1
}


resource "aws_ssm_parameter" "twitter_api_key" {
  name             = local.ssm_param.twitter.api_key
  type             = "SecureString"
  value_wo         = var.twitter_api_key
  value_wo_version = 1
}

resource "aws_ssm_parameter" "twitter_api_secret" {
  name             = local.ssm_param.twitter.api_secret
  type             = "SecureString"
  value_wo         = var.twitter_api_secret
  value_wo_version = 1
}
