const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

async function crawl() {
  const url = "https://dathangsi.vn/tong-do-cat-toc.html";
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });


  const $ = cheerio.load(data);

  function toAbsUrl(href, base = "https://dathangsi.vn") {
    try {
      return new URL(href, base).toString();
    } catch {
      return href || null;
    }
  }
  function toNumberFromVND(text) {
    if (!text) return null;
    const digits = text.replace(/[^\d]/g, "");
    return digits ? Number(digits) : null;
  }
  function truthyText($el) {
    const t = $el.text().replace(/\s+/g, " ").trim();
    return t || null;
  }

  const rawProducts = [];

  $(".gia_si_pro").each((_, el) => {
    const $el = $(el);
    const $linkH3 = $el.find("a:has(h3)").first();
    const name = truthyText($linkH3.find("h3")) || truthyText($el.find("h3"));
    const url = toAbsUrl(
      $linkH3.attr("href") || $el.find("a[href*='.html']").first().attr("href")
    );
    const $img = $el.find("img").first();
    const imgSrc = $img.attr("src") || $img.attr("data-src");
    const image = {
      src: toAbsUrl(imgSrc),
      alt: ($img.attr("alt") || "").trim() || null,
    };
    const priceRetailText = truthyText(
      $el.find("p:contains('Giá bán lẻ') strong")
    );
    const priceVipText = truthyText(
      $el.find("p:contains('Giá sỉ VIP') strong")
    );
    const retail = toNumberFromVND(priceRetailText);
    const vip = toNumberFromVND(priceVipText);
    const sku = truthyText($el.find("p:contains('Mã SP') span"));
    const statusText = truthyText($el.find("p.display_none_all")) || "Còn hàng";
    const inStock = !/tạm\s*hết\s*hàng/i.test(statusText);

    rawProducts.push({
      sku,
      name,
      image,
      price: { retail, vip },
      availability: { in_stock: inStock },
    });
  });

  // ✅ Chuẩn hoá sang định dạng backend yêu cầu
  const mockData = rawProducts
    .filter((p) => p.sku && p.name && p.price.vip && p.price.retail)
    .map((p) => ({
      code: Number(p.sku),
      name: p.name,
      image: [p.image.src],
      price: p.price.vip,
      price_old: p.price.retail,
      countInstock: p.availability.in_stock ? 10 : 0,
      description: "", // thêm nếu có mô tả
      categories: "68a5ece76ff852e8b0349352"
    }));

  // 📝 Ghi file mockData.js (JS module xuất mảng)
  const filePath = path.join(__dirname, "mockData.js");
  const content = `export const mockData = ${JSON.stringify(mockData, null, 2)};\n`;
  fs.writeFileSync(filePath, content, "utf-8");

  console.log(`✅ Đã tạo file mockData.js với ${mockData.length} sản phẩm`);
}

crawl();
