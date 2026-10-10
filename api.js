
const API_URL = "https://fakestoreapi.com/products";

async function fetchProducts() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Unable to load products. Please try again.");
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid product data.");
  }

  return data;
}
