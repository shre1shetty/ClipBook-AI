import request from "supertest";
import nock from "nock";
import app from "../../src/app.js";
import { describe, beforeEach, afterEach, it, expect } from "@jest/globals";

// This exercises the REAL stack: route -> controller -> ExtractionService
// -> OCRProviderFactory -> OCRSpaceProvider. Only the outbound HTTP call to
// OCR.space is intercepted, so no quota is consumed and no service code is
// mocked/stubbed.

const OCR_BASE_URL = "https://api.ocr.space";
const OCR_PATH = "/parse/image";

describe("POST /extraction/image", () => {
  beforeEach(() => {
    process.env.OCRSEARCH_KEY = "test-api-key";
    nock.disableNetConnect();
    // Allow supertest's own loopback connection to the app under test.
    nock.enableNetConnect("127.0.0.1");
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("returns 400 when no image is attached", async () => {
    const res = await request(app).post("/extraction/image");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Image is required",
    });
  });

  it("returns 200 with the extracted text for a valid image", async () => {
    const scope = nock(OCR_BASE_URL)
      .post(OCR_PATH)
      .reply(200, {
        ParsedResults: [{ ParsedText: "Hello World" }],
      });

    const res = await request(app)
      .post("/extraction/image")
      .attach("image", Buffer.from("fake-image-bytes"), "test.png");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      result: { content: "Hello World", source: "Image" },
    });
    expect(scope.isDone()).toBe(true);
  });

  it("returns 500 when the OCR API responds with an error", async () => {
    const scope = nock(OCR_BASE_URL).post(OCR_PATH).reply(500, {
      error: "Server error",
    });

    const res = await request(app)
      .post("/extraction/image")
      .attach("image", Buffer.from("fake-image-bytes"), "test.png");

    // The axios failure isn't an AppError, so errorHandler falls through to
    // its generic branch: { success: false, message: "Internal Server
    // Error", err }. Not asserting on `err`'s exact shape — it's a
    // serialized AxiosError, not something this test should pin down.
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      message: "Internal Server Error",
    });
    expect(scope.isDone()).toBe(true);
  });
});
