import { FireCrawlerProvider } from "./FireCrawlerProvider.js";
import { ReadabilityProvider } from "./ReadabilityProvider.js";
import type { URLProvider } from "./URLProvider.js";

export class URLProviderFactory {
  static getURLProvider(): URLProvider {
    switch (process.env.URL_CRAWLER_PROVIDER) {
      case "READABILITY":
        return new ReadabilityProvider();
      case "FIRECRAWLER":
        return new FireCrawlerProvider();
      default:
        return new ReadabilityProvider();
    }
  }
}
