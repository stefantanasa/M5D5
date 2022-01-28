import express from "express";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { newProductValidation, newReviewValidation } from "./validation.js";
import multer from "multer";
import {
  getProducts,
  saveProductsImageUrl,
  writeProducts,
  productsPublicFolderPath,
} from "../../lib/fs-tools.js";
import { join } from "path";

// CRUD
const productsRouter = express.Router();

productsRouter.post("/", newProductValidation, async (req, res, next) => {
  try {
    const errorsList = validationResult(req);
    if (errorsList.isEmpty()) {
      // 1. Get new book info from req.body & Add additional info
      const newProduct = {
        ...req.body,
        createdAt: new Date(),
        _id: uniqid(),
      };

      // 2. Read books.json file --> buffer --> array
      const productsArray = await getProducts();

      // 3. Add new book to array
      productsArray.push(newProduct);

      // 4. Write array to file
      await writeProducts(productsArray);

      // 5. Send back a proper response
      res.status(201).send({ id: newProduct._id });
    } else {
      next(
        createHttpError(400, "Some errors occured in request body!", {
          errorsList,
        })
      );
    }
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/", async (req, res, next) => {
  try {
    const productsArray = await getProducts();
    if (req.query && req.query.category) {
      const filteredProducts = productsArray.filter(
        (product) => product.category === req.query.category
      );
      res.send(filteredProducts);
    } else {
      // Send response
      res.send(productsArray);
    }
  } catch (error) {
    next(error); // With the next function I can send the error to the error handler middleware
  }
});

productsRouter.get("/:productId", async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const productsArray = await getProducts();

    const foundProduct = productsArray.find(
      (product) => product._id === productId
    );
    if (foundProduct) {
      res.send(foundProduct);
    } else {
      next(
        createHttpError(
          404,
          `Blog Post with id ${req.params.productId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

productsRouter.put("/:productId", async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const productsArray = await getProducts();

    const index = productsArray.findIndex(
      (product) => product._id === productId
    );

    const oldProduct = productsArray[index];

    const updatedProduct = {
      ...oldProduct,
      ...req.body,
      updatedAt: new Date(),
    };

    productsArray[index] = updatedProduct;

    await writeProducts(productsArray);

    res.send(updatedProduct);
  } catch (error) {
    next(error);
  }
});

productsRouter.delete("/:productId", async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const productsArray = await getProducts();

    const remaningProducts = productsArray.filter(
      (products) => products._id !== productId
    );

    await writeProducts(remaningProducts);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

//Image post
productsRouter.post(
  "/:productsId/uploadImageUrl",
  multer().single("imageUrl"),
  async (req, res, next) => {
    // "imageUrl" does need to match exactly to the name used in FormData field in the frontend, otherwise Multer is not going to be able to find the file in the req.body
    try {
      console.log("FILE: ", req.file);
      await saveProductsImageUrl(req.file.originalname, req.file.buffer);
      const productId = req.params.productsId;

      const productsArray = await getProducts();

      const index = productsArray.findIndex(
        (product) => product._id === productId
      );

      const oldProduct = productsArray[index];

      const updatedProduct = {
        ...oldProduct,
        imageUrl: "http://locahost:3001/img/products/" + req.file.originalname,
        updatedAt: new Date(),
      };

      productsArray[index] = updatedProduct;

      await writeProducts(productsArray);

      res.send("Ok");
    } catch (error) {
      next(error);
    }
  }
);

// CRUD REVIEWS

productsRouter.get("/:productId/reviews", async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const productsArray = await getProducts();

    const foundProduct = productsArray.find(
      (product) => product._id === productId
    );
    if (!foundProduct) {
      res.status(404).send({
        message: `Product with ${req.params.productId} is not found!`,
      });
    }

    foundProduct.reviews = foundProduct.reviews || [];
    res.send(foundProduct.reviews);
  } catch (error) {
    next(error);
  }
});

productsRouter.post(
  "/:productId/reviews",
  newReviewValidation,
  async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const { comment, rate } = req.body;
      const review = {
        _id: uniqid(),
        comment,
        rate,
        productId: productId,
        createdAt: new Date(),
      };

      const productsArray = await getProducts();

      const index = productsArray.findIndex(
        (product) => product._id === req.params.productId
      );
      if (!index == -1) {
        res.status(404).send({
          message: `product with ${productId} is not found!`,
        });
      }
      const oldProduct = productsArray[index];
      oldProduct.reviews = oldProduct.reviews || [];
      const updatedProduct = {
        ...oldProduct,
        ...req.body,
        reviews: [...oldProduct.reviews, review],
        updatedAt: new Date(),
      };
      productsArray[index] = updatedProduct;

      await writeProducts(productsArray);
      res.send("ok");
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.delete(
  "/:productId/reviews/:reviewId",

  async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const reviewId = req.params.reviewId;

      const productsArray = await getProducts();

      const index = productsArray.findIndex(
        (product) => product._id === productId
      );

      const oldProduct = productsArray[index];

      const remainingReviews = oldProduct.reviews.filter(
        (review) => review._id !== reviewId
      );

      oldProduct["reviews"] = remainingReviews;

      productsArray[index] = oldProduct;

      await writeProducts(productsArray);

      res.send(oldProduct.reviews);
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.put(
  "/:productId/reviews/:reviewId",

  async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const reviewId = req.params.reviewId;

      const productsArray = await getProducts();

      const index = productsArray.findIndex(
        (product) => product._id === productId
      );

      const oldProduct = productsArray[index];

      const oldReviewIndex = oldProduct.reviews.findIndex(
        (review) => review._id === reviewId
      );

      const oldReview = oldProduct.reviews[oldReviewIndex];

      const updatedReview = {
        ...oldReview,
        ...req.body,
        updatedAt: new Date(),
      };

      oldProduct.reviews[oldReviewIndex] = updatedReview;

      const updatedProduct = oldProduct;

      productsArray[index] = updatedProduct;

      await writeProducts(productsArray);

      res.send(updatedProduct.reviews);
    } catch (error) {
      next(error);
    }
  }
);

export default productsRouter;
