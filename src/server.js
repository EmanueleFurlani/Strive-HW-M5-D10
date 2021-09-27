import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints"; 
import mediaRouter from "./services/index.js";
import {
  notFoundHandler,
  badRequestHandler,
  forbiddenHandler,
  genericServerErrorHandler,
} from "./errorHandlers.js";
import { join } from "path";


const server = express()
const port = process.env.PORT

//CORS
const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL]
const corsOpts = {
  origin: (origin, next) => {
    console.log("Origin --> ", origin);
    if (!origin || whitelist.indexOf(origin) !== -1) {
      next(null, true);
    } else {
      next(new Error(`Origin ${origin} is not allowed`));
    }
  },
}

//GLOBAL MIDDLEWARES
server.use(cors(corsOpts));
server.use(express.json());

//ROUTES
server.use("/media", mediaRouter)

//ERROR HANDLING
server.use(notFoundHandler);
server.use(badRequestHandler);
server.use(forbiddenHandler);
server.use(genericServerErrorHandler);

server.listen(port, () =>
  console.log(`Server is listening to the port ${port}.`)
);
