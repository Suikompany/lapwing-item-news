import { parse } from "node-html-parser";
import * as v from "valibot";
import { buildURLSearchParams } from "../util/buildSearchParams";

const BROWSE_PRODUCTS_PATH = "https://booth.pm/ja/browse" as const;
const SEARCH_PRODUCTS_PATH = "https://booth.pm/ja/search" as const;
const PRODUCTS_PATH = "https://booth.pm/ja/items" as const;
const productsUrlWithSubdomain = (subdomain: string) =>
  `https://${subdomain}.booth.pm/items` as const;

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

type BuildProductWithSubdomainUrl = <
  TSubdomain extends string,
  TProductId extends number,
>(params: {
  subdomain: TSubdomain;
  productId: TProductId;
}) => `${ReturnType<typeof productsUrlWithSubdomain>}/${TProductId}`;
export const buildProductWithSubdomainUrl: BuildProductWithSubdomainUrl = ({
  subdomain,
  productId,
}) => {
  const baseUrl = productsUrlWithSubdomain(subdomain);
  return `${baseUrl}/${productId}`;
};

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

// product_id は data-product-id 属性から取得できる。
// 取得した product_id から商品ページの URL を生成可能。
// 例: https://booth.pm/ja/items/${product_id}
// 商品名は div class="item-card__title" の子要素の a タグのテキストから取得できる。data-tracking="click_item" という属性が付与されているため、ここからもタグ取得可能。
// ショップのサブドメインは data-product-brand 属性から取得できる。
// ショップ名は div class="item-card__shop-name" のテキストから取得できる。
// 商品は公開日時で降順
const parsedProductDataSchema = v.object({
  id: v.pipe(v.string(), v.trim(), v.transform(Number), v.number()),
  name: v.pipe(v.string(), v.trim()),
  shopSubdomain: v.pipe(v.string(), v.trim()),
  shopName: v.pipe(v.string(), v.trim()),
});

const parseProductListHTML = (html: string) => {
  const root = parse(html);

  const liList = root.querySelectorAll("li[data-product-id]");
  const products = liList.flatMap((li) => {
    const rawProductId = li.getAttribute("data-product-id");
    const rawProductName = li.querySelector(
      "a.item-card__title-anchor--multiline",
    )?.text;
    const rawShopSubdomain = li.getAttribute("data-product-brand");
    const rawShopName = li.querySelector("div.item-card__shop-name")?.text;

    const result = v.safeParse(parsedProductDataSchema, {
      id: rawProductId,
      name: rawProductName,
      shopSubdomain: rawShopSubdomain,
      shopName: rawShopName,
    });

    if (!result.success) {
      return [];
    }

    return result.output;
  });

  return products;
};
