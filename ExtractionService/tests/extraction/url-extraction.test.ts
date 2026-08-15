import request from "supertest";
import nock from "nock";
import app from "../../src/app.js";
import { describe, beforeEach, afterEach, it, expect } from "@jest/globals";
// Exercises the REAL stack: route -> controller -> ExtractionService ->
// URLProviderFactory -> ReadabilityProvider. ReadabilityProvider fetches the
// target page itself via axios, then runs cheerio/JSDOM/@mozilla/readability
// + turndown on it — so nock intercepts that page fetch, not a third-party
// extraction API. No env var needed: URL_CRAWLER_PROVIDER defaults to
// ReadabilityProvider already.

const TARGET_ORIGIN = "https://example.com";
const TARGET_PATH = "/article";
const TARGET_URL = `${TARGET_ORIGIN}${TARGET_PATH}`;

const ARTICLE_HTML = `
<!DOCTYPE html>
<html>
  <head><title>A Sample Article</title></head>
  <body>
    <article>
      <h1>A Sample Article</h1>
      <p>This is the opening paragraph of a sample article used to exercise the Readability extraction pipeline end to end. It needs to contain enough real sentence content for Readability's scoring heuristics to recognize this block as the main article body rather than boilerplate.</p>
      <p>This is a second paragraph continuing the same theme, adding more substantive text so the parser has a reasonably sized candidate to select as the primary content region of the page.</p>
      <p>A third paragraph rounds out the article with a closing thought, ensuring the extracted markdown has multiple distinct blocks to verify against in the test assertions below.</p>
    </article>
  </body>
</html>
`;

describe("POST /extraction/url", () => {
  beforeEach(() => {
    nock.disableNetConnect();
    nock.enableNetConnect("127.0.0.1");
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("returns 400 when no url is provided", async () => {
    const res = await request(app).post("/extraction/url").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "URL is required",
    });
  });

  it("returns 200 with markdown extracted from the page", async () => {
    const scope = nock(TARGET_ORIGIN)
      .get(TARGET_PATH)
      .reply(200, ARTICLE_HTML, { "Content-Type": "text/html" });

    const res = await request(app)
      .post("/extraction/url")
      .send({ url: TARGET_URL });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.source).toBe("URL");
    // Loose content assertion on purpose: exact markdown output depends on
    // Readability's + turndown's internals, which aren't ours to pin down.
    expect(res.body.result.content).toContain("opening paragraph");
    expect(res.body.result.content).toContain("second paragraph");
    expect(scope.isDone()).toBe(true);
  });

  it("returns 400 when the page has no extractable article content", async () => {
    const scope = nock(TARGET_ORIGIN)
      .get(TARGET_PATH)
      .reply(200, "<html><body></body></html>", {
        "Content-Type": "text/html",
      });

    const res = await request(app)
      .post("/extraction/url")
      .send({ url: TARGET_URL });

    // ReadabilityProvider throws AppError("Unable to extract readable
    // content from URL", 400) when reader.parse() returns null, and
    // errorHandler serializes AppError as { success: false, message }.
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Unable to extract readable content from URL",
    });
    expect(scope.isDone()).toBe(true);
  });

  it("returns an error status when the target page fetch fails", async () => {
    const scope = nock(TARGET_ORIGIN).get(TARGET_PATH).reply(500);

    const res = await request(app)
      .post("/extraction/url")
      .send({ url: TARGET_URL });

    // The axios failure isn't an AppError, so errorHandler falls through to
    // its generic branch: { success: false, message: "Internal Server
    // Error", err }. We don't assert on `err`'s exact shape since it's a
    // serialized AxiosError and not something this test should pin down.
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      message: "Internal Server Error",
    });
    expect(scope.isDone()).toBe(true);
  });
});
