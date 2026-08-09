import Firecrawl from "@mendable/firecrawl-js";
import type { URLProvider } from "./URLProvider.js";
import type { ExtractionResult } from "../../interfaces/ExtractionResult.js";

export class FireCrawlerProvider implements URLProvider {
  private client: Firecrawl;

  constructor() {
    this.client = new Firecrawl({
      apiKey: process.env.FIRECRAWLER_API_KEY || "",
    });
  }

  async extract(url: string): Promise<ExtractionResult> {
    const result = await this.client.scrape(url, {
      formats: ["markdown"],
    });

    return {
      content: result.markdown ?? "",
      source: "URL",
    };
  }
}
