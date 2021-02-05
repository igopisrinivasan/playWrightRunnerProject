import { it, expect, describe } from "../fixtures/fixtures";
const { SearchPage } = require('../pages/searchPage');

describe("feature foo", () => {

  it("is a basic test with the page", async ({ page }) => {
    await page.goto("https://playwright.dev/");
    const name = await page.innerText(".navbar__title");
    expect(name).toBe("Playwright");
  });

  it("Page Object Model Test Case", async ({ page }) => {
    // Test function
    const searchPage = new SearchPage(page);
    await searchPage.navigate();
    await searchPage.search('search query');
  });

  it("compares page screenshot", async ({ page, browserName }) => {
    await page.goto("https://stackoverflow.com");
    const screenshot = await page.screenshot();
   // expect(screenshot).toMatchSnapshot(`test-${browserName}.png`, { threshold: 0.2 });
  });
});