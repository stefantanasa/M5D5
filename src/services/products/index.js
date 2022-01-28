import express from "express";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { newBlogPostsValidation } from "./validation.js";
import multer from "multer";
import { saveBlogPostsCovers, writeProducts } from "../../lib/fs-tools.js";
import { getBlogPosts, writeBlogPosts } from "../../lib/fs-tools.js";



// CRUD
const productsRouter = express.Router();

productsRouter.post("/", async (req, res, next) => {
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
    const blogPostsArray = await getBlogPosts();

    res.send(blogPostsArray);
  } catch (error) {
    next(error); // With the next function I can send the error to the error handler middleware
  }
});

productsRouter.get("/:blogPostId", async (req, res, next) => {
  try {
    const blogPostId = req.params.blogPostId;

    const blogPostsArray = await getBlogPosts();

    const foundBlogPosts = blogPostsArray.find(
      (blogPost) => blogPost._id === blogPostId
    );
    if (foundBlogPosts) {
      res.send(foundBlogPosts);
    } else {
      next(
        createHttpError(
          404,
          `Blog Post with id ${req.params.blogPostId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

productsRouter.put("/:blogPostId", async (req, res, next) => {
  try {
    const blogPostId = req.params.blogPostsRouter;

    const blogPostsArray = await getBlogPosts();

    const index = blogPostsArray.findIndex(
      (blogPost) => blogPost._id === blogPostId
    );

    const oldBlogPost = blogPostsArray[index];

    const updatedBlogPost = {
      ...oldBlogPost,
      ...req.body,
      updatedAt: new Date(),
    };

    blogPostsArray[index] = updatedBlogPost;

    await writeBlogPosts(blogPostsArray);

    res.send(updatedBlogPost);
  } catch (error) {
    next(error);
  }
});

productsRouter.delete("/:blogPostId", async (req, res, next) => {
  try {
    const blogPostId = req.params.blogPostId;

    const blogPostsArray = await getBlogPosts();

    const remaningBlogPosts = blogPostsArray.filter(
      (blogPosts) => blogPosts._id !== blogPostId
    );

    await writeBlogPosts(remaningBlogPosts);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

productsRouter.post(
  "/:blogPostId/uploadCover",
  multer().single("cover"),
  async (req, res, next) => {
    // "avatar" does need to match exactly to the name used in FormData field in the frontend, otherwise Multer is not going to be able to find the file in the req.body
    try {
      console.log("FILE: ", req.file);
      await saveBlogPostsCovers(req.file.originalname, req.file.buffer);
      const blogPostId = req.params.blogPostsRouter;

      const blogPostsArray = await getBlogPosts();

      const index = blogPostsArray.findIndex(
        (blogPost) => blogPost._id === blogPostId
      );

      const oldBlogPost = blogPostsArray[index];

      const updatedBlogPost = {
        ...oldBlogPost,
        cover: req.file,
        updatedAt: new Date(),
      };

      blogPostsArray[index] = updatedBlogPost;

      await writeBlogPosts(blogPostsArray);

      res.send("Ok");
    } catch (error) {
      next(error);
    }
  }
);

// GET /blogPosts/:id/comments, get all the comments for a specific post

productsRouter.get("/:blogPostId/comments", async (req, res, next) => {
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

export default blogPostsRouter;
