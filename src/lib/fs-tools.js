import fs from "fs-extra"; // 3rd party module
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const { readJSON, writeJSON, writeFile } = fs;

const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), "../data");
const productsPublicFolderPath = join(process.cwd(), "./public/img/products");

const productsJSONPath = join(dataFolderPath, "products.json");
const reviewsJSONPath = join(dataFolderPath, "products.json");

export const getProducts = () => readJSON(productsJSONPath);
export const writeProducts = (content) => writeJSON(productsJSONPath, content);

export const saveProductsImageUrl = (filename, contentAsABuffer) =>
  writeFile(join(productsPublicFolderPath, filename), contentAsABuffer);
