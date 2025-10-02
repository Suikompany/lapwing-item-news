terraform {

  required_version = "~> 1.11.0"

  backend "s3" {
    bucket = "lapwing-item-news-tf-backend"
    key    = "dev.tfstate"
    region = "ap-northeast-1"
  }
}
