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

locals {
  ssm_param = {
    twitter = {
      credential = "/${local.project}/${local.stage}/Twitter/Credential"
    }
  }
}

resource "aws_ssm_parameter" "twitter_credential" {
  name = local.ssm_param.twitter.credential
  type = "SecureString"
  value_wo = jsonencode({
    access_token        = var.twitter_access_token
    access_token_secret = var.twitter_access_token_secret
    api_key             = var.twitter_api_key
    api_secret          = var.twitter_api_secret
  })
  value_wo_version = 1
}
