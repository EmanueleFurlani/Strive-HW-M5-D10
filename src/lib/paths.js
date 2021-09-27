import { fileURLToPath } from "url";
import { dirname, join } from "path";

export const mediaJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../data/media.json"
);

export const reviewsJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../data/reviews.json"
);
