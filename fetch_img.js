const { chromium } = require('playwright-chromium');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://share.google/Ku8F41h2aJCVu77sg');
  
  // Wait for image to load
  await page.waitForTimeout(3000);
  
  // Get og:image or the main image
  const imgUrl = await page.evaluate(() => {
    const og = document.querySelector('meta[property="og:image"]');
    if (og) return og.content;
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.length > 0 ? imgs[0].src : null;
  });
  
  if (imgUrl) {
    console.log("Found URL:", imgUrl);
    const response = await page.request.get(imgUrl);
    const buffer = await response.body();
    fs.writeFileSync('src/assets/images/gta6_user_uploaded.jpg', buffer);
    console.log("Image saved!");
  } else {
    console.log("No image found.");
  }
  await browser.close();
})();
