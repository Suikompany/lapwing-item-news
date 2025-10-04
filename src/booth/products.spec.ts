import { buildProductUrl, scrapeProductList } from "./products";

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

describe("scrapeProductList", () => {
  it("should fetch product list and parse products correctly", async () => {
    const mockHtml = `
      <ul>
        <li data-product-id="123">
          <a class="item-card__title-anchor--multiline">Product A</a>
        </li>
        <li data-product-id="456">
          <a class="item-card__title-anchor--multiline">Product B</a>
        </li>
      </ul>
    `;
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(mockHtml));

    const products = await scrapeProductList();
    expect(products).toEqual([
      { id: 123, name: "Product A" },
      { id: 456, name: "Product B" },
    ]);
  });

  it("should return empty array if no valid products found", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response("<ul></ul>"));

    const products = await scrapeProductList();
    expect(products).toEqual([]);
  });

  it("should handle fetch error gracefully", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));

    await expect(scrapeProductList()).rejects.toThrow("Network error");
  });
});
