module "main" {
  source = "../../module"

  stage                       = "dev"
  dist_dir                    = var.dist_dir
  twitter_access_token        = var.twitter_access_token
  twitter_access_token_secret = var.twitter_access_token_secret
  twitter_api_key             = var.twitter_api_key
  twitter_api_secret          = var.twitter_api_secret
}

variable "dist_dir" {
  type     = string
  nullable = false
  default  = "dist"
}

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
