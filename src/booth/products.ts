import { parse } from "node-html-parser";

const PRODUCT_LIST_PATH = "https://booth.pm/ja/browse" as const;
const PRODUCT_PATH = "https://booth.pm/ja/items" as const;

type BuildProductListUrl = <TCategory extends string>(params: {
  category: TCategory;
  queryParams: { [x: string]: string };
}) => `${typeof PRODUCT_LIST_PATH}/${(typeof params)["category"]}?${string}`;
const buildProductListUrl: BuildProductListUrl = ({
  category,
  queryParams,
}) => {
  const queryString = new URLSearchParams(queryParams);
  return `${PRODUCT_LIST_PATH}/${category}?${queryString}` as const;
};

type BuildProductUrl = <TProductId extends number>(params: {
  productId: TProductId;
}) => `${typeof PRODUCT_PATH}/${TProductId}`;
export const buildProductUrl: BuildProductUrl = ({ productId }) => {
  return `${PRODUCT_PATH}/${productId}`;
};

// product_id は data-product-id 属性から取得できる。
// 取得した product_id から商品ページの URL を生成可能。
// 例: https://booth.pm/ja/items/${product_id}
// 商品名は div class="item-card__title" の子要素の a タグのテキストから取得できる。
// a タグには data-tracking="click_item" という属性が付与されているため、ここからも取得可能。
// 商品は公開日時で降順
export const scrapeProductList = async () => {
  const url = buildProductListUrl({
    category: "3Dモデル",
    queryParams: {
      sort: "new",
      q: "Lapwing",
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
