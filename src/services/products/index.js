import express from "express";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { newProductValidation, newReviewValidation } from "./validation.js";
import multer from "multer";
import { getProducts, saveProductsImageUrl, writeProducts } from "../../lib/fs-tools.js";




// CRUD
const productsRouter = express.Router();

productsRouter.post("/",newProductValidation, async (req, res, next) => {
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

    res.send(productsArray);
  } catch (error) {
    next(error); // With the next function I can send the error to the error handler middleware
  }
});

productsRouter.get("/:productId", async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const productsArray = await getproduct();

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
    // "avatar" does need to match exactly to the name used in FormData field in the frontend, otherwise Multer is not going to be able to find the file in the req.body
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
        imageUrl: req.file,
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

// GET /blogPosts/:id/comments, get all the comments for a specific post

productsRouter.get("/:productId/reviews",newReviewValidation, async (req, res, next) => {
  try {
    const blogPostId = req.params.blogPostId;

    const blogPostsArray = await getBlogPosts();

    const foundBlogPosts = blogPostsArray.find(
      (blogPost) => blogPost._id === blogPostId
    );
    if (!foundBlogPosts) {
      res
        .status(404)
        .send({ message: `blog with ${req.params.id} is not found!` });
    }

    foundBlogPosts.comments = foundBlogPosts.comments || [];
    res.send(foundBlogPosts.comments);
  } catch (error) {
    next(error);
  }
});

productsRouter.post("/:blogPostId/comment", async (req, res, next) => {
  try {
    const { text, userName } = req.body;
    const comment = { id: uniqid(), text, userName, createdAt: new Date() };

    const blogPostsArray = await getBlogPosts();

    const index = blogPostsArray.findIndex(
      (blogPost) => blogPost._id === req.params.blogPostId
    );
    if (!index == -1) {
      res.status(404).send({
        message: `blog with ${req.params.blogPostId} is not found!`,
      });
    }
    const oldBlogPost = blogPostsArray[index];
    oldBlogPost.comments = oldBlogPost.comments || [];
    const updatedBlogPost = {
      ...oldBlogPost,
      ...req.body,
      comments: [...oldBlogPost.comments, comment],
      updatedAt: new Date(),
      id: req.params.id,
    };
    blogPostsArray[index] = updatedBlogPost;

    await writeBlogPosts(blogPostsArray);
    res.send("ok");
  } catch (error) {
    next(error);
  }
});

export default productsRouter;
