export interface OCRSpaceResponse {
  ParsedResults?: {
    ParsedText: string;
    ErrorMessage?: string;
  }[];
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string[];
}
