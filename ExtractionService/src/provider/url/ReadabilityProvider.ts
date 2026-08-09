import axios from "axios";
import type { ExtractionResult } from "../../interfaces/ExtractionResult.js";
import type { URLProvider } from "./URLProvider.js";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { AppError } from "../../utils/AppError.js";
import TurndownService from "turndown";
export class ReadabilityProvider implements URLProvider {
  private readonly turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    });
  }
  async extract(url: string): Promise<ExtractionResult> {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024,
    });
    const htmlContent = response.data;
    const parsedHTML = cheerio.load(htmlContent);
    parsedHTML("img, picture, video, audio, iframe, source").remove();
    const cleanedHTML = parsedHTML.html();
    const dom = new JSDOM(cleanedHTML, {
      url,
    });

    const reader = new Readability(dom.window.document);

    const article = reader.parse();

    if (!article) {
      throw new AppError("Unable to extract readable content from URL", 400);
    }

    const markdown = this.turndown.turndown(article.content || "");

    return {
      content: markdown.trim(),
      source: "URL",
    };
  }
}
