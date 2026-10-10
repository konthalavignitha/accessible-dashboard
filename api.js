const API_URL = "https://fakestoreapi.com/products";

async function fetchProducts() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Product API request failed.");
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("The product API returned invalid data.");
  }

  return data;
}