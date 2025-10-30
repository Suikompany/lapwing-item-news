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
  it("should fetch product list and parse products with shop info correctly", async () => {
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

    const products = await scrapeProductList();
    expect(products).toEqual([
      {
        id: 123,
        name: "Product A",
        shopSubdomain: "shop-a",
        shopName: "ショップA",
      },
      {
        id: 456,
        name: "Product B",
        shopSubdomain: "shop-b",
        shopName: "ショップB",
      },
    ]);
  });

  it("should return empty array if no valid products found", async () => {
    server.use(
      http.get("https://booth.pm/ja/items", () => {
        return HttpResponse.html("<ul></ul>");
      }),
    );

    const products = await scrapeProductList();
    expect(products).toEqual([]);
  });

  it("should handle fetch error gracefully", async () => {
    server.use(
      http.get("https://booth.pm/ja/items", () => {
        return HttpResponse.error();
      }),
    );

    await expect(scrapeProductList()).rejects.toThrow("Failed to fetch");
  });
});
