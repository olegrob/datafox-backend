export const ADDITIONAL_PRICE_TAGS = {
  "acc": { code: "acc", fee: 7 },
  "actionpl": { code: "actionpl", fee: 10 },
  "also": { code: "also", fee: 4.95 },
  "asbis": { code: "asbis", fee: 5 },
  "eet": { code: "eet", fee: 15 },
  "elko": { code: "elko", fee: 7 },
  "f9": { code: "f9", fee: 5.50 },
  "imcomplex": { code: "imcomplex", fee: 20 },
  "nordic": { code: "nordic", fee: 6 },
  "tdbaltic": { code: "tdbaltic", fee: 3.75 }
};

export const DEFAULT_MARKUPS = [
  { maxPrice: Infinity, minPrice: 10000, markup: 2 },
  { maxPrice: 10000, minPrice: 1000, markup: 2 },
  { maxPrice: 1000, minPrice: 900, markup: 2.1 },
  { maxPrice: 900, minPrice: 800, markup: 2.2 },
  { maxPrice: 800, minPrice: 700, markup: 2.3 },
  { maxPrice: 700, minPrice: 600, markup: 2.4 },
  { maxPrice: 600, minPrice: 500, markup: 2.5 },
  { maxPrice: 500, minPrice: 400, markup: 2.6 },
  { maxPrice: 400, minPrice: 300, markup: 2.7 },
  { maxPrice: 300, minPrice: 200, markup: 2.8 },
  { maxPrice: 200, minPrice: 100, markup: 2.9 },
  { maxPrice: 100, minPrice: 90, markup: 3 },
  { maxPrice: 90, minPrice: 80, markup: 3.1 },
  { maxPrice: 80, minPrice: 70, markup: 3.2 },
  { maxPrice: 70, minPrice: 60, markup: 3.3 },
  { maxPrice: 60, minPrice: 50, markup: 3.4 },
  { maxPrice: 50, minPrice: 40, markup: 3.5 },
  { maxPrice: 40, minPrice: 30, markup: 3.6 },
  { maxPrice: 30, minPrice: 20, markup: 3.7 },
  { maxPrice: 20, minPrice: 10, markup: 3.8 },
  { maxPrice: 10, minPrice: 0, markup: 3.9 }
]; 