import { parse } from "node-html-parser";
import { buildURLSearchParams } from "../util/buildSearchParams";

const BROWSE_PRODUCTS_PATH = "https://booth.pm/ja/browse" as const;
const SEARCH_PRODUCTS_PATH = "https://booth.pm/ja/search" as const;
const PRODUCTS_PATH = "https://booth.pm/ja/items" as const;

/** 必要になったら増やす */
type SearchQueryParams = {
  sort?: "new";
  "except_words[]"?: string[];
  "tags[]"?: string[];
  page?: `${number}`;
};

type BuildBrowseUrl = <TCategory extends string>(params: {
  category: TCategory;
  queryParams: { [x: string]: string };
}) => `${typeof BROWSE_PRODUCTS_PATH}/${(typeof params)["category"]}?${string}`;
const buildBrowseUrl: BuildBrowseUrl = ({ category, queryParams }) => {
  const queryString = buildURLSearchParams(queryParams);
  return `${BROWSE_PRODUCTS_PATH}/${category}?${queryString}` as const;
};

type BuildSearchUrl = <TKeyword extends string>(params: {
  keyword: TKeyword;
  queryParams: SearchQueryParams;
}) => `${typeof SEARCH_PRODUCTS_PATH}/${(typeof params)["keyword"]}?${string}`;
const buildSearchUrl: BuildSearchUrl = ({ keyword, queryParams }) => {
  const queryString = buildURLSearchParams(queryParams);
  return `${SEARCH_PRODUCTS_PATH}/${keyword}?${queryString}` as const;
};

type BuildProductsUrl = (params: {
  queryParams: SearchQueryParams;
}) => `${typeof PRODUCTS_PATH}?${string}`;
export const buildProductsUrl: BuildProductsUrl = ({ queryParams }) => {
  const queryString = buildURLSearchParams(queryParams);
  return `${PRODUCTS_PATH}?${queryString}` as const;
};

type BuildProductUrl = <TProductId extends number>(params: {
  productId: TProductId;
}) => `${typeof PRODUCTS_PATH}/${TProductId}`;
export const buildProductUrl: BuildProductUrl = ({ productId }) => {
  return `${PRODUCTS_PATH}/${productId}`;
};

// product_id は data-product-id 属性から取得できる。
// 取得した product_id から商品ページの URL を生成可能。
// 例: https://booth.pm/ja/items/${product_id}
// 商品名は div class="item-card__title" の子要素の a タグのテキストから取得できる。
// a タグには data-tracking="click_item" という属性が付与されているため、ここからも取得可能。
// 商品は公開日時で降順
export const scrapeProductList = async () => {
  const url = buildProductsUrl({
    queryParams: {
      "tags[]": ["Lapwing"],
      sort: "new",
      "except_words[]": ["3D環境・ワールド"],
    },
  });
  const res = await fetch(url, {
    method: "GET",
  });
  const body = await res.text();

  const products = parseProductListHTML(body);
  return products;
};

const parseProductListHTML = (html: string) => {
  const root = parse(html);

  const liList = root.querySelectorAll("li[data-product-id]");
  const products = liList.flatMap((li) => {
    const rawProductId = li.getAttribute("data-product-id");
    const rawProductName = li.querySelector(
      "a.item-card__title-anchor--multiline",
    )?.text;

    if (!rawProductId || !rawProductName) {
      return [];
    }

    return {
      id: Number(rawProductId.trim()),
      name: rawProductName.trim(),
    };
  });

  return products;
};
