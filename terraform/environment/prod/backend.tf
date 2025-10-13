terraform {
  required_version = "~> 1.13.0"

  backend "s3" {
    bucket = "lapwing-item-news-tf-backend"
    key    = "prod.tfstate"
    region = "ap-northeast-1"
  }
}
