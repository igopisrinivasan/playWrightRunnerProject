class SearchPage {
    constructor(page) {
      this.page = page;
    }
    async navigate() {
      await this.page.goto('https://bing.com');
    }
    async search(text) {
      await this.page.fill('[aria-label="Enter your search term"]', text);
      await this.page.press('[aria-label="Enter your search term"]', 'Enter');
    }
  }
  module.exports = { SearchPage };