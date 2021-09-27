import express from "express";
import fs from "fs-extra";
import { mediaJSONPath, reviewsJSONPath } from "../lib/paths.js";
import { mediaValidation, reviewsValidation } from "./validation.js";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import uniqid from "uniqid";
import { getMediaPDFReadableStream } from "../lib/pdfMakeTools.js";
import { pipeline } from "stream";
// import multer from "multer";
// import { savePosterCloudinary } from "../lib/cloudTools.js";
import axios from "axios";

const {
  readJSON,
  writeJSON,
} = fs;

const mediaRouter = express.Router();

// GET MEDIA (TRYING TO DO WITH AXIOS)
mediaRouter.get("/", async (req, res, next) => {
  try {
    const media = await readJSON(mediaJSONPath);
    const reviews = await readJSON(reviewsJSONPath);
    const reqQuery = req.query;
    if (reqQuery && reqQuery.Title) {
      const filteredMedia = media.filter((m) =>
        m.Title.toLowerCase().includes(reqQuery.Title.toLowerCase())
      );
      if (filteredMedia.length > 0) {
        res.send({ media: filteredMedia });
      } else {
        const omdbResponse = await axios.get(
          `https://www.omdbapi.com/?apikey=c9d75e90 ${reqQuery.Title}`
        );
        const omdbData = omdbResponse.data;
        if (omdbData.Response === "True") {
          const omdbMedia = omdbData.Search;
          media.push(...omdbMedia);
          await writeJSON(mediaJSONPath, media);
          res.send({ media: omdbMedia });
        } else {
          next(createHttpError(404, omdbData.Error));
        }
      }
    } else {
      res.send({ media, reviews });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// GET MEDIA BY ID
mediaRouter.get("/:id", async (req, res, next) => {
  try {
    const paramsID = req.params.id;
    const media = await readJSON(mediaJSONPath);
    const singleMedia = media.find((m) => m.imdbID === paramsID);
    if (singleMedia) {
      const reviews = await readJSON(reviewsJSONPath);
      const singleMediaReviews = reviews.filter(
        (r) => r.elementId === paramsID
      );
      res.send({ media: singleMedia, reviews: singleMediaReviews });
    } else {
      next(
        createHttpError(404, `Media with the imdbID: ${paramsID} not found.`)
      );
    }
  } catch (error) {
    next(error);
  }
});

// POST MEDIA
mediaRouter.post("/", mediaValidation, async (req, res, next) => {
  try {
    const errorList = validationResult(req);
    if (errorList.isEmpty()) {
      const reqBody = req.body;
      const media = await readJSON(mediaJSONPath);
      const newMedia = {
        Title: reqBody.Title,
        Year: reqBody.Year,
        imdbID: uniqid(),
        Type: reqBody.Type,
        Poster: "https://m.media-amazon.com/images/M/MV5BMTM5MzcwOTg4MF5BMl5BanBnXkFtZTgwOTQwMzQxMDE@._V1_SX300.jpg"
      };
      media.push(newMedia);
      await writeJSON(mediaJSONPath, media);
      res
        .status(201)
        .send({ newMedia, message: "New media was created with success!" });
    } else {
      next(createHttpError(400, { errorList }));
    }
  } catch (error) {
    next(error);
  }
});

// POST MEDIA POSTER (TO FIX)
// mediaRouter.post(
//   "/:id/poster",
//   multer({ storage: savePosterCloudinary }).single("poster"),
//   async (req, res, next) => {
//     try {
//       const paramsId = req.params.id;
//       const media = await readJSON(mediaJSONPath);
//       const singleMedia = media.find((m) => m.imdbID === paramsId);
//       if (singleMedia) {
//         const posterUrl = req.file.path;
//         const updatedMedia = { ...singleMedia, Poster: posterUrl };
//         const remainingMedia = media.filter((m) => m.imdbID !== paramsId);

//         remainingMedia.push(updatedMedia);
//         await writeJSON(mediaJSONPath, remainingMedia);
//         res.send({
//           updatedMedia,
//           message: `It was added a Poster to the media with imdbID: ${singleMedia.imdbID}. `,
//         });
//       } else {
//         next(
//           createHttpError(
//             404,
//             `The media with the id: ${paramsId} was not found.`
//           )
//         );
//       }
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// UPDATE MEDIA
mediaRouter.put("/:id", mediaValidation, async (req, res, next) => {
  try {
    const errorList = validationResult(req);
    if (errorList.isEmpty()) {
      const paramsID = req.params.id;
      const media = await readJSON(mediaJSONPath);
      const singleMedia = media.find((m) => m.imdbID === paramsID);
      if (singleMedia) {
        const remainingMedia = media.filter((m) => m.imdbID !== paramsID);
        const updatedMedia = { ...singleMedia, ...req.body };
        remainingMedia.push(updatedMedia);
        await writeJSON(mediaJSONPath, remainingMedia);
        res.send({
          updatedMedia,
          message: `The media with imdbID: ${singleMedia.imdbID} was Updated. `,
        });
      } else {
        next(createHttpError(404, `Media with the id: ${paramsID} not found.`));
      }
    } else {
      next(createHttpError(400, { errorList }));
    }
  } catch (error) {
    next(error);
  }
});

// DELETE MEDIA
mediaRouter.delete("/:id", async (req, res, next) => {
  try {
    const paramsID = req.params.id;
    const media = await readJSON(mediaJSONPath);
    const singleMedia = media.find((m) => m.imdbID === paramsID);
    if (singleMedia) {
      const remainingMedia = media.filter((m) => m.imdbID !== paramsID);
      await writeJSON(mediaJSONPath, remainingMedia);
      res.send({
        singleMedia,
        message: `The media with the id: ${singleMedia.imdbID} was deleted`,
      });
    } else {
      next(
        createHttpError(
          404,
          `The media with the imdbID: ${paramsID} was not found.`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

//POST REVIEWS
mediaRouter.post("/:id/reviews", reviewsValidation, async (req, res, next) => {
  try {
    const errorList = validationResult(req);
    if (errorList.isEmpty()) {
      const paramsID = req.params.id;
      const media = await readJSON(mediaJSONPath);
      const singleMedia = media.find((m) => m.imdbID === paramsID);
      if (singleMedia) {
        const reqBody = req.body;
        const newReview = {
          _id: uniqid(),
          comment: reqBody.comment,
          rate: reqBody.rate,
          elementId: paramsID,
          createdAt: new Date(),
        };
        const reviews = await readJSON(reviewsJSONPath);
        reviews.push(newReview);
        await writeJSON(reviewsJSONPath, reviews);
        res.status(201).send({
          newMedia: newReview,
          message: "New media was created with success!",
        });
      } else {
        next(
          createHttpError(404, `Media with the imdbID: ${paramsID} not found.`)
        );
      }
    } else {
      next(createHttpError(400, { errorList }));
    }
  } catch (error) {
    next(error);
  }
});

//DELETE REVIEWS
mediaRouter.delete("/reviews/:id", async (req, res, next) => {
  try {
    const paramsID = req.params.id;
    const reviews = await readJSON(reviewsJSONPath);
    const review = reviews.find((r) => r._id === paramsID);
    if (review) {
      const remainingReviews = reviews.filter((r) => r._id !== paramsID);
      await writeJSON(reviewsJSONPath, remainingReviews);
      res.send({
        review,
        message: `The media with the id: ${review._id} was deleted`,
      });
    } else {
      next(
        createHttpError(
          404,
          `The review with the ID: ${paramsID} was not found.`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

// DL PDF
mediaRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const paramsID = req.params.id;
    const media = await readJSON(mediaJSONPath);
    const singleMedia = media.find((m) => m.imdbID === paramsID);
    if (singleMedia) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${singleMedia.Title}.pdf`
      );
      const reviews = await readJSON(reviewsJSONPath);
      const singleMediaReviews = reviews.filter(
        (r) => r.elementId === paramsID
      );
      const source = await getMediaPDFReadableStream(
        singleMedia,
        singleMediaReviews
      );
      const destination = res;
      pipeline(source, destination, (err) => {
        if (err) next(err);
      });
    } else {
      next(
        createHttpError(
          404,
          `The media with the imdbID: ${paramsID} not found.`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

export default mediaRouter;