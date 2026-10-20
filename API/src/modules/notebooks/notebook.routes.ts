import { Router } from "express";
import {
  createNotebookHandler,
  deleteNotebookHandler,
  getNotebookHandler,
  listNotebooksHandler,
  updateNotebookHandler,
} from "./notebook.controller.js";

const noteBookRouter = Router();

noteBookRouter.get("/", listNotebooksHandler);
noteBookRouter.post("/create", createNotebookHandler);
noteBookRouter.get("/:notebookId", getNotebookHandler);
noteBookRouter.post("/update/:notebookId", updateNotebookHandler);
noteBookRouter.delete("/:notebookId", deleteNotebookHandler);

export default noteBookRouter;
