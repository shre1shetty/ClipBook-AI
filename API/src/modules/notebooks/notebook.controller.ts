import type { Request, Response, NextFunction } from "express";
import { getUserId } from "../../util/util.js";
import {
  createNotebook,
  deleteNotebook,
  getNotebookById,
  listNotebooks,
  updateNotebook,
} from "./notebook.service.js";
import {
  createNotebookSchema,
  updateNotebookSchema,
} from "./notebook.validation.js";

export async function listNotebooksHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const notebooks = await listNotebooks(getUserId(req));
    res.status(200).json({ success: true, notebooks });
  } catch (error) {
    next(error);
  }
}

export async function createNotebookHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createNotebookSchema.parse(req.body);
    const notebook = await createNotebook(getUserId(req), input);
    //TASK TO DO : Asynchronously call rag service to ingest content

    res.status(200).json({ success: true, notebook });
  } catch (error) {
    next(error);
  }
}

export async function getNotebookHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const notebook = getNotebookById(
      getUserId(req),
      req.params.notebookId?.toString(),
    );
    res.status(200).json({ success: true, notebook });
  } catch (error) {
    next(error);
  }
}

export async function updateNotebookHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = updateNotebookSchema.parse(req.body);
    const notebook = await updateNotebook(
      getUserId(req),
      req.params.notebookId?.toString(),
      input,
    );
    //TASK TO DO : Asynchronously call rag service to ingest content

    res.status(200).json({ success: true, notebook });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotebookHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteNotebook(getUserId(req), req.params.notebookId?.toString());
    //TASK TO DO : Asynchronously call rag service to delete content

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
