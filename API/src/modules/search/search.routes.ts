import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { searchHandler } from "./search.controller.js";

const searchRouter = Router();

searchRouter.use(authenticate);
searchRouter.get("/", searchHandler);

export default searchRouter;
