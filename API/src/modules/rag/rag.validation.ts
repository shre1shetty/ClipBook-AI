import { z } from "zod";

export const queryNotebookSchema = z.strictObject({
  query: z
    .string()
    .trim()
    .min(1, "Query cannot be empty")
    .max(2000, "Query is too long"),
});

export type QueryNotebookInput = z.infer<typeof queryNotebookSchema>;
