import { Router } from "express";
import {
  createNotebookHandler,
  deleteNotebookHandler,
  getNotebookHandler,
  listNotebooksHandler,
  queryNotebookHandler,
  updateNotebookHandler,
} from "./notebook.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const noteBookRouter = Router();

noteBookRouter.use(authenticate);

noteBookRouter.get("/", listNotebooksHandler);
noteBookRouter.post("/create", createNotebookHandler);
noteBookRouter.get("/:notebookId", getNotebookHandler);
noteBookRouter.post("/update/:notebookId", updateNotebookHandler);
noteBookRouter.delete("/:notebookId", deleteNotebookHandler);
noteBookRouter.post("/query/:notebookId", queryNotebookHandler);

export default noteBookRouter;
