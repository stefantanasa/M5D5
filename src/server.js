import express from "express";
import listEndpoints from "express-list-endpoints";
import productsRouter from "./services/products/index.js";
import {
  badRequestHandler,
  unauthorizedHandler,
  notFoundHandler,
  genericErrorHandler,
} from "./errorHandlers.js";
import createHttpError from "http-errors";
import cors from "cors";
import { join } from "path";

const server = express();

const port = process.env.PORT || 3001;

const publicFolderPath = join(process.cwd(), "public");

server.use(express.json());

const whitelistedOriginals = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];

server.use(
  cors({
    origin: (origin, next) => {
      if (!origin || whitelistedOriginals.indexOf(origin) !== -1) {
        console.log("Great!");
        next(null, true);
      } else {
        next(new Error("Cors ERROR!"));
      }
    },
  })
);

server.use(express.static(publicFolderPath));
//ENDPOINTS

server.use("/products", productsRouter);

//

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

console.table(listEndpoints(server));

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
