import z from "zod";

export const createNotebookSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(1, "Notebook title cannot be empty")
    .max(150, "Notebook title cannot exceed 150 characters"),
  content: z.string().optional(),
});

export const updateNotebookSchema = z
  .strictObject({
    title: z
      .string()
      .trim()
      .min(1, "Notebook title cannot be empty")
      .max(150, "Notebook title cannot exceed 150 characters")
      .optional(),

    content: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update",
  });

export type CreateNotebookInput = z.infer<typeof createNotebookSchema>;
export type UpdateNotebookInput = z.infer<typeof updateNotebookSchema>;
