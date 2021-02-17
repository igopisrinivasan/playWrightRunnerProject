const assert = require('assert')
import { it, expect, describe } from "../fixtures/fixtures";

describe('Duck Duck Go Search', () => {
  it('returns Chrome Puppeteer Github repo as first search result', async ({ page }) => {
    await page.goto('https://duckduckgo.com/', { waitUntil: 'networkidle' })
    await page.type('input#search_form_input_homepage', 'microsoft playwright', { delay: 50 })
    await page.click('input#search_button_homepage')
    await page.waitForSelector('.results--main #r1-0')

    const githubLink = await page.$eval('a.result__a', link => link.href.trim())
    expect(githubLink).toContain('playwright')
    await page.screenshot({ path: 'duckduckgo.png' })
  })
})