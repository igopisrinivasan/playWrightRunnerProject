//const config = require('config');
//import {config} from 'config'

const TIMEOUT_UNIT_MS = 120000//config.get('puppeteer.timeoutUnitMs');

class actions {
  browser: any;
  page: any;
  timeouts: { newPage: number; waitForVisible: number; };

  constructor(browser, page) {
    this.browser = browser;
    this.page = page;
    this.timeouts = {
      newPage: 12 * TIMEOUT_UNIT_MS,
      waitForVisible: 12 * TIMEOUT_UNIT_MS
    }
  }

  // clears all extra browser tabs
  async resetPages() {
    const pages = await this.browser.pages();
    await Promise.all(pages.map(async (page, i) => {
      if (i !== 0) {
        await page.close();
      }
    }));
    this.page = await this.browser.newPage();
  }

  async goto(url) {
    try {
      await this.page.goto(url);
    } catch(navigationError) {
      let message = `[bot] error navigating to ${url}: ${navigationError}`;
      if (url.includes('#')) {
        message += `\n      Puppeteer throws errors when navigating to URLs containing '#'` +
                   `\n      See https://github.com/GoogleChrome/puppeteer/issues/1388`;
      }
      console.warn(message);
      // do not throw, let test proceed optimistically
    }
  }

  async ensureUrl(url) {
    const currentUrl = await this.page.url();
    if (!currentUrl.includes(url)) {
      await this.goto(url);
    }
  }

  async waitForVisible(selector, timeout = this.timeouts.waitForVisible) {
    try {
      await this.page.waitFor(selector, { visible: true, timeout });
    } catch(waitError) {
      const ss = `${Date.now()}.png`;
      await this.screenshot(ss);
      // the default error is not helpful, hopefully this is better:
      console.warn(
        `[bot] error waiting for ${selector}: ${waitError}\n` +
        `      (saved screenshot: ${ss})`
      );
      // do not throw, let test proceed optimistically
    }
  }

  async isVisible({ selector }) {
    return this.page.evaluate((selector) => {
      const els = document.querySelectorAll(selector);
      if (!els) {
        return false;
      }
      let visible = false;
      els.forEach(el => {
        // check that it is visible
        const style = window.getComputedStyle(el);
        if (style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          visible = true;
        }
      });
      return visible;
    }, selector);
  }

  async isVisibleContainingText({ selector, text }) {
    return this.page.evaluate((selector, text) => {
      const els = document.querySelectorAll(selector);
      if (!els) {
        return false;
      }
      let matchedAndVisible = false;
      els.forEach(el => {
        // check that it contains expected text
        if (!el.textContent.includes(text)) {
          return;
        }
        // check that it is visible
        const style = window.getComputedStyle(el);
        if (style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          matchedAndVisible = true;
        }
      });
      return matchedAndVisible;
    }, selector, text);
  }

  async click(selector) {
    await this.waitForVisible(selector);
    // sadly, the sleep is a workaround recommended on several puppeteer issues
    // e.g., https://github.com/GoogleChrome/puppeteer/issues/1771
    await this.page.waitFor(500);
    await this.page.click(selector);
  }

  async clickByText({ selector, text }) {
    await this.page.waitFor(300);
    await this.page.$$eval(selector, (elements, content) => {
      elements.map(element => {
        if (`${element.textContent}`.includes(content)) {
          element.click();
          return;
        }
      });
    }, text);
  }

  async type(selector, text, shouldEmpty) {
    try {
      await this.waitForVisible(selector);
      if (shouldEmpty) {
        await this.page.$eval(selector, element => element.value = '');
      }
      await this.page.type(selector, text);
    } catch(typingError) {
      console.error(`[bot] type failed: ${typingError}`);
      throw typingError;
    }
  }

  // For key strings: https://github.com/GoogleChrome/puppeteer/blob/master/lib/USKeyboardLayout.js
  async sendKey(keyString) {
    await this.page.keyboard.press(keyString);
  }

  async getTextContent(selector) {
    await this.waitForVisible(selector);
    try {
      return await this.page.$eval(selector, element => element.textContent);
    } catch(evalError) {
      const ss = `${Date.now()}.png`;
      await this.screenshot(ss);
      console.warn(
        `[bot] error getting ${selector} text content: ${evalError}\n` +
        `      (saved screenshot: ${ss})`
      );
    }
    return '';
  }

  async checkElement(expect, selector, expectedContent) {
    const actualContent = await this.getTextContent(selector);
    expect(actualContent).toContain(expectedContent);
  }

  async checkTitle(expect, expectedTitle) {
    const actualTitle = await this.page.title();
    expect(actualTitle).toContain(expectedTitle);
  }

  async screenshot(path) {
    await this.page.screenshot({ path });
  }

  // Implementation of: https://github.com/GoogleChrome/puppeteer/issues/386
  async newPageAfter(triggerFn) {
    const dur = this.timeouts.newPage;
    
    // start listening for a new page created ('targetcreated') event:
    const targetPage = new Promise((resolve, reject) => {
      const to = setTimeout(() => {
        reject(new Error(`Exceeded ${dur}ms timeout`));
      }, dur);
      this.browser.once('targetcreated', target => {
        clearTimeout(to);
        resolve(target.page());
      });
    });

    // click or do whatever would result in that new page:
    try {
      await triggerFn();
    } catch(triggerError) {
      console.error(`[bot] error while triggering new page: ${triggerError}\n    ${triggerFn}`);
      throw triggerError;
    }

    // await the new page result from the 'targetcreated' listener:
    let page;
    try {
      page = await targetPage;
    } catch(newPageError) {
      console.error(`[bot] error while awaiting new page: ${newPageError}\n    ${triggerFn}`);
      throw newPageError;
    }
    return page;
  }
}

module.exports = Bot;
