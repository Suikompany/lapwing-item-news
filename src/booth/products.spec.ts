import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";

import {
  buildProductUrl,
  buildProductsUrl,
  buildProductWithSubdomainUrl,
  scrapeProductList,
} from "./products";

describe("buildProductUrl", () => {
  it("should build correct product URL for a given productId", () => {
    expect(buildProductUrl({ productId: 123456 })).toBe(
      "https://booth.pm/ja/items/123456",
    );
    expect(buildProductUrl({ productId: 0 })).toBe(
      "https://booth.pm/ja/items/0",
    );
  });
});

describe("buildProductsUrl", () => {
  it("should build correct URL with query parameters", () => {
    const url = buildProductsUrl({
      queryParams: {
        sort: "new",
        page: "2",
        "tags[]": ["Lapwing", "VRChat"],
        "except_words[]": ["3D環境・ワールド"],
      },
    });

    const searchParams = new URLSearchParams([
      ["sort", "new"],
      ["page", "2"],
      ["tags[]", "Lapwing"],
      ["tags[]", "VRChat"],
      ["except_words[]", "3D環境・ワールド"],
    ]);
    expect(url).toBe(`https://booth.pm/ja/items?${searchParams}`);
  });

  it("should build URL with empty queryParams", () => {
    const url = buildProductsUrl({ queryParams: {} });
    expect(url).toBe("https://booth.pm/ja/items?");
  });

  it("should build URL with only one tag", () => {
    const url = buildProductsUrl({
      queryParams: {
        "tags[]": ["Lapwing"],
      },
    });

    const searchParams = new URLSearchParams([["tags[]", "Lapwing"]]);
    expect(url).toBe(`https://booth.pm/ja/items?${searchParams}`);
  });
});

describe("buildProductWithSubdomainUrl", () => {
  it("builds correct product URL for shop-a/123", () => {
    expect(
      buildProductWithSubdomainUrl({ subdomain: "shop-a", productId: 123 }),
    ).toBe("https://shop-a.booth.pm/items/123");
  });

  it("builds correct product URL for test/0", () => {
    expect(
      buildProductWithSubdomainUrl({ subdomain: "test", productId: 0 }),
    ).toBe("https://test.booth.pm/items/0");
  });
});

describe("scrapeProductList", () => {
  it("should fetch product list with single tag and parse correctly", async () => {
    const mockHtml = `
      <ul>
        <li data-product-id="123" data-product-brand="shop-a">
          <a class="item-card__title-anchor--multiline">Product A</a>
          <div class="item-card__shop-name">ショップA</div>
        </li>
        <li data-product-id="456" data-product-brand="shop-b">
          <a class="item-card__title-anchor--multiline">Product B</a>
          <div class="item-card__shop-name">ショップB</div>
        </li>
      </ul>
    `;
    server.use(
      http.get("https://booth.pm/ja/items", () => {
        return HttpResponse.html(mockHtml);
      }),
    );

    const products = await scrapeProductList(["Lapwing"]);
    expect(products).toEqual([
      {
        id: 456,
        name: "Product B",
        shopSubdomain: "shop-b",
        shopName: "ショップB",
      },
      {
        id: 123,
        name: "Product A",
        shopSubdomain: "shop-a",
        shopName: "ショップA",
      },
    ]);
  });

  it("should fetch product list with multiple tags and merge results", async () => {
    const mockHtmlTag1 = `
      <ul>
        <li data-product-id="123" data-product-brand="shop-a">
          <a class="item-card__title-anchor--multiline">Product A</a>
          <div class="item-card__shop-name">ショップA</div>
        </li>
        <li data-product-id="456" data-product-brand="shop-b">
          <a class="item-card__title-anchor--multiline">Product B</a>
          <div class="item-card__shop-name">ショップB</div>
        </li>
      </ul>
    `;
    const mockHtmlTag2 = `
      <ul>
        <li data-product-id="789" data-product-brand="shop-c">
          <a class="item-card__title-anchor--multiline">Product C</a>
          <div class="item-card__shop-name">ショップC</div>
        </li>
      </ul>
    `;

    server.use(
      http.get("https://booth.pm/ja/items", ({ request }) => {
        const url = new URL(request.url);
        const tags = url.searchParams.getAll("tags[]");

        if (tags.includes("Lapwing")) {
          return HttpResponse.html(mockHtmlTag1);
        }
        if (tags.includes("VRChat")) {
          return HttpResponse.html(mockHtmlTag2);
        }
        return HttpResponse.html("<ul></ul>");
      }),
    );

    const products = await scrapeProductList(["Lapwing", "VRChat"]);
    expect(products).toEqual([
      {
        id: 789,
        name: "Product C",
        shopSubdomain: "shop-c",
        shopName: "ショップC",
      },
      {
        id: 456,
        name: "Product B",
        shopSubdomain: "shop-b",
        shopName: "ショップB",
      },
      {
        id: 123,
        name: "Product A",
        shopSubdomain: "shop-a",
        shopName: "ショップA",
      },
    ]);
  });

  it("should deduplicate products with same ID from multiple tags", async () => {
    const mockHtml = `
      <ul>
        <li data-product-id="123" data-product-brand="shop-a">
          <a class="item-card__title-anchor--multiline">Product A</a>
          <div class="item-card__shop-name">ショップA</div>
        </li>
        <li data-product-id="456" data-product-brand="shop-b">
          <a class="item-card__title-anchor--multiline">Product B</a>
          <div class="item-card__shop-name">ショップB</div>
        </li>
      </ul>
    `;

    server.use(
      http.get("https://booth.pm/ja/items", () => {
        return HttpResponse.html(mockHtml);
      }),
    );

    const products = await scrapeProductList(["Lapwing", "VRChat"]);

    // 重複が排除されていることを確認
    const productIds = products.map((p) => p.id);
    const uniqueIds = [...new Set(productIds)];
    expect(productIds.length).toBe(uniqueIds.length);

    // 商品IDで降順ソートされていることを確認
    expect(products).toEqual([
      {
        id: 456,
        name: "Product B",
        shopSubdomain: "shop-b",
        shopName: "ショップB",
      },
      {
        id: 123,
        name: "Product A",
        shopSubdomain: "shop-a",
        shopName: "ショップA",
      },
    ]);
  });

  it("should sort products by ID in descending order", async () => {
    const mockHtml = `
      <ul>
        <li data-product-id="100" data-product-brand="shop-a">
          <a class="item-card__title-anchor--multiline">Product A</a>
          <div class="item-card__shop-name">ショップA</div>
        </li>
        <li data-product-id="500" data-product-brand="shop-b">
          <a class="item-card__title-anchor--multiline">Product B</a>
          <div class="item-card__shop-name">ショップB</div>
        </li>
        <li data-product-id="300" data-product-brand="shop-c">
          <a class="item-card__title-anchor--multiline">Product C</a>
          <div class="item-card__shop-name">ショップC</div>
        </li>
      </ul>
    `;

    server.use(
      http.get("https://booth.pm/ja/items", () => {
        return HttpResponse.html(mockHtml);
      }),
    );

    const products = await scrapeProductList(["Test"]);

    expect(products.map((p) => p.id)).toEqual([500, 300, 100]);
  });

  it("should return empty array if no valid products found", async () => {
    server.use(
      http.get("https://booth.pm/ja/items", () => {
        return HttpResponse.html("<ul></ul>");
      }),
    );

    const products = await scrapeProductList(["Lapwing"]);
    expect(products).toEqual([]);
  });

  it("should return empty array for empty tags array", async () => {
    const products = await scrapeProductList([]);
    expect(products).toEqual([]);
  });

  it("should throw error when fetch fails", async () => {
    server.use(
      http.get("https://booth.pm/ja/items", () => {
        return new HttpResponse(null, {
          status: 500,
          statusText: "Internal Server Error",
        });
      }),
    );

    await expect(scrapeProductList(["Lapwing"])).rejects.toThrow(
      "BOOTH の検索に失敗しました: 500 Internal Server Error",
    );
  });

  it("should throw error when one of multiple tag requests fails", async () => {
    server.use(
      http.get("https://booth.pm/ja/items", ({ request }) => {
        const url = new URL(request.url);
        const tags = url.searchParams.getAll("tags[]");

        if (tags.includes("VRChat")) {
          return new HttpResponse(null, {
            status: 404,
            statusText: "Not Found",
          });
        }

        return HttpResponse.html("<ul></ul>");
      }),
    );

    await expect(scrapeProductList(["Lapwing", "VRChat"])).rejects.toThrow(
      "BOOTH の検索に失敗しました: 404 Not Found",
    );
  });
});
