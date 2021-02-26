import { folio as baseFolio } from "@playwright/test";
import { LaunchOptions,BrowserContextOptions } from "playwright";

const builder = baseFolio.extend();

builder.contextOptions.override(async ({ contextOptions }, runTest) => {
  const modifiedOptions: BrowserContextOptions = {
    ...contextOptions, // default
    viewport: { width: 1920, height: 1080 }
  }
  await runTest(modifiedOptions);
});

builder.browserOptions.override(async ({ browserOptions }, runTest) => {
     const modifiedOptions: LaunchOptions = {
      ...browserOptions, // Default options
      slowMo: 50,
     }
     await runTest(modifiedOptions);
});

const folio = builder.build();

export const it = folio.it;
export const expect = folio.expect;
export const describe = folio.describe;