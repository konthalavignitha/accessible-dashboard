
const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");
const categoryTabs = document.getElementById("categoryTabs");
const sortSelect = document.getElementById("sortSelect");
const errorBanner = document.getElementById("errorBanner");
const loading = document.getElementById("loading");

let products = [];
let activeCategory = "All";

let cart = JSON.parse(localStorage.getItem("productCart") || "[]");

function saveCart() {
  localStorage.setItem("productCart", JSON.stringify(cart));
  document.getElementById("cartCount").textContent = cart.length;
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
}

function renderProducts() {
  const search = searchInput.value.toLowerCase();

  let filtered = products.filter(product =>
    product.title.toLowerCase().includes(search) &&
    (activeCategory === "All" || product.category === activeCategory)
  );

  if (sortSelect.value === "priceLow") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortSelect.value === "priceHigh") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortSelect.value === "name") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  productList.replaceChildren();

  if (filtered.length === 0) {
    productList.textContent = "No products found.";
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.title;
    image.loading = "lazy";

    const title = document.createElement("h3");
    title.textContent = product.title;

    const price = document.createElement("p");
    price.textContent = "$" + product.price.toFixed(2);

    const button = document.createElement("button");
    button.textContent = "Add to Cart";
    button.addEventListener("click", () => {
      cart.push(product.id);
      saveCart();
    });

    card.append(image, title, price, button);
    productList.append(card);
  });
}

function renderCategories() {
  categoryTabs.replaceChildren();

  ["All", ...new Set(products.map(p => p.category))].forEach(category => {
    const button = document.createElement("button");
    button.textContent = category;
    button.setAttribute("aria-pressed", category === activeCategory);

    button.addEventListener("click", () => {
      activeCategory = category;
      renderCategories();
      renderProducts();
    });

    categoryTabs.append(button);
  });
}

async function init() {
  loading.hidden = false;
  errorBanner.hidden = true;

  try {
    products = await fetchProducts();
    renderCategories();
    renderProducts();
  } catch (error) {
    showError("Products could not load. Check your internet and refresh.");
  } finally {
    loading.hidden = true;
  }
}

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);

saveCart();
init();
