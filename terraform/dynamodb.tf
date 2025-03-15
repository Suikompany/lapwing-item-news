resource "aws_dynamodb_table" "scraped_log" {
  name         = local.dynamodb.name
  billing_mode = "PAY_PER_REQUEST"

  hash_key = local.dynamodb.partition_key

  attribute {
    name = local.dynamodb.partition_key
    type = "S"
  }
}

resource "aws_dynamodb_table_item" "base_record" {
  table_name = aws_dynamodb_table.scraped_log.name
  hash_key   = aws_dynamodb_table.scraped_log.hash_key

  item = <<EOF
{
  "${aws_dynamodb_table.scraped_log.hash_key}" : { "S" : "${local.base_scraped_at}" },
  "NewProductIdList" : { "L" : [{"N": "${local.base_product_id}"}] },
  "TweetIdList" : { "L" : [] }
}
EOF
}
# {
#   "${aws_dynamodb_table.scraped_log.hash_key}" : { "S" : "${local.base_scraped_at}" },
#   "NewProductIdList" : { "L" : ["${local.base_product_id}"] },
#   "TweetIdList" : { "L" : [] }
# }
