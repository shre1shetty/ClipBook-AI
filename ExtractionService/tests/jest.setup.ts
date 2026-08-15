// Runs before any test file is imported. Needed because some provider
// modules construct SDK clients as module-level singletons at import time
// (e.g. PaddleOCRClient in PaddleOCRProvider.ts) — so merely importing
// OCRProviderFactory.ts (which app.ts pulls in transitively, even though
// tests only ever select the default OCRSpaceProvider) throws unless these
// are set. Values here are dummies; no real PaddleOCR calls are made.
if (!process.env.PADDLEOCR_ACCESS_TOKEN_DEV) {
  process.env.PADDLEOCR_ACCESS_TOKEN_DEV = "test-paddleocr-token";
}
