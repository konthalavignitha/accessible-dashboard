


"use strict";

const $ = (id) => document.getElementById(id);

const productList = $("productList");
const searchInput = $("searchInput");
const categorySelect = $("categorySelect");
const sortSelect = $("sortSelect");
const loading = $("loading");
const errorBanner = $("errorBanner");
const productStatus = $("productStatus");
const cartCount = $("cartCount");
const cartPanel = $("cartPanel");
const cartItems = $("cartItems");
const cartTotal = $("cartTotal");
const viewCart = $("viewCart");
const themeToggle = $("themeToggle");
const contactForm = $("contactForm");
const formStatus = $("formStatus");
const infoDialog = $("infoDialog");

let products = [];
let cart = [];
let activeTheme = "light";

function readSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("productCart") || "[]");
    return Array.isArray(saved)
      ? saved.filter(Number.isInteger)
      : [];
  } catch {
    return [];
  }
}

function saveCart() {
  cartCount.textContent = String(cart.length);

  try {
    localStorage.setItem("productCart", JSON.stringify(cart));
  } catch {
    announce("Cart cannot be saved on this device.");
  }
}

function announce(message) {
  productStatus.textContent = message;
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
}

function formatPrice(price) {
  return "$" + Number(price).toFixed(2);
}

function createButton(text, action, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", action);

  if (className) {
    button.className = className;
  }

  return button;
}

/* Product categories */

function renderCategories() {
  const previous = categorySelect.value;
  const categories = [...new Set(products.map(p => p.category))].sort();

  categorySelect.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = "All categories";
  categorySelect.appendChild(allOption);

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });

  categorySelect.value = categories.includes(previous) ? previous : "All";
}

/* Product search and sorting */

function renderProducts() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  const sort = sortSelect.value;

  let filtered = products.filter(product =>
    product.title.toLowerCase().includes(search) &&
    (category === "All" || product.category === category)
  );

  if (sort === "priceLow") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "priceHigh") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "name") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  productList.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No products found. Try another search.";
    productList.appendChild(empty);
    announce("No products found.");
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.title;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.removeAttribute("src");
      image.alt = product.title + " image unavailable";
    });

    const title = document.createElement("h3");
    title.textContent = product.title;

    const categoryText = document.createElement("p");
    categoryText.className = "category";
    categoryText.textContent = product.category;

    const rating = document.createElement("p");
    rating.className = "rating";

    const rate = Number(product.rating?.rate);
    const count = Number(product.rating?.count);

    rating.textContent =
      Number.isFinite(rate) && Number.isFinite(count)
        ? "Rating: " + rate.toFixed(1) + " out of 5 (" + count + " reviews)"
        : "Rating unavailable";

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = formatPrice(product.price);

    const addButton = createButton("Add to Cart", () => {
      cart.push(product.id);
      saveCart();
      renderCart();
      announce(product.title + " added to cart.");
    });

    card.append(image, title, categoryText, rating, price, addButton);
    productList.appendChild(card);
  });

  announce(filtered.length + " products displayed.");
}

/* Shopping cart */

function renderCart() {
  cartItems.replaceChildren();
  let total = 0;

  const validCart = cart
    .map((id, index) => ({
      product: products.find(p => p.id === id),
      index
    }))
    .filter(item => item.product);

  if (validCart.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Your cart is empty.";
    cartItems.appendChild(empty);
  }

  validCart.forEach(({ product, index }) => {
    total += product.price;

    const item = document.createElement("div");
    item.className = "cart-item";

    const name = document.createElement("p");
    name.textContent = product.title + " — " + formatPrice(product.price);

    const remove = createButton("Remove", () => {
      cart.splice(index, 1);
      saveCart();
      renderCart();
      announce(product.title + " removed from cart.");
    }, "secondary");

    item.append(name, remove);
    cartItems.appendChild(item);
  });

  cartTotal.textContent = formatPrice(total);
  cartCount.textContent = String(cart.length);
}

function setCartOpen(open) {
  cartPanel.hidden = !open;
  viewCart.setAttribute("aria-expanded", String(open));

  if (open) {
    renderCart();
  }
}

viewCart.addEventListener("click", () => {
  setCartOpen(cartPanel.hidden);
});

$("closeCart").addEventListener("click", () => {
  setCartOpen(false);
  viewCart.focus();
});

$("clearCart").addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
  announce("Cart cleared.");
});

/* Light and dark themes */

function applyTheme(theme) {
  activeTheme = theme;
  const dark = theme === "dark";

  document.body.classList.toggle("dark", dark);
  themeToggle.textContent = dark ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-pressed", String(dark));
}

try {
  const savedTheme = localStorage.getItem("dashboardTheme");
  applyTheme(savedTheme === "dark" ? "dark" : "light");
} catch {
  applyTheme("light");
}

themeToggle.addEventListener("click", () => {
  const nextTheme = activeTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem("dashboardTheme", nextTheme);
  } catch {
    // The theme still works for this page session.
  }
});

/* Accessible information dialog */

$("openInfo").addEventListener("click", () => {
  if (typeof infoDialog.showModal === "function") {
    infoDialog.showModal();
  } else {
    announce("Your browser does not support the dialog feature.");
  }
});

$("closeInfo").addEventListener("click", () => {
  infoDialog.close();
});

infoDialog.addEventListener("click", event => {
  if (event.target === infoDialog) {
    infoDialog.close();
  }
});

/* Contact form validation */

const fields = [
  {
    input: $("contactName"),
    error: $("nameError"),
    message: "Enter a name containing at least 2 characters.",
    valid: value => value.trim().length >= 2
  },
  {
    input: $("contactEmail"),
    error: $("emailError"),
    message: "Enter a valid email address.",
    valid: value =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  },
  {
    input: $("contactMessage"),
    error: $("messageError"),
    message: "Enter a message containing at least 10 characters.",
    valid: value => value.trim().length >= 10
  }
];

fields.forEach(field => {
  field.input.setAttribute("aria-describedby", field.error.id);

  field.input.addEventListener("input", () => {
    field.input.removeAttribute("aria-invalid");
    field.error.textContent = "";
  });
});

contactForm.addEventListener("submit", event => {
  event.preventDefault();

  let firstInvalid = null;

  fields.forEach(field => {
    const valid = field.valid(field.input.value);

    field.error.textContent = valid ? "" : field.message;

    if (valid) {
      field.input.removeAttribute("aria-invalid");
    } else {
      field.input.setAttribute("aria-invalid", "true");

      if (!firstInvalid) {
        firstInvalid = field.input;
      }
    }
  });

  if (firstInvalid) {
    formStatus.textContent = "Please correct the errors below.";
    formStatus.className = "error";
    firstInvalid.focus();
    return;
  }

  formStatus.textContent =
    "Form validation successful! This demo does not send your message.";
  formStatus.className = "success";
  contactForm.reset();

  fields.forEach(field => {
    field.error.textContent = "";
    field.input.removeAttribute("aria-invalid");
  });
});

/* Load API data */

async function init() {
  loading.hidden = false;
  errorBanner.hidden = true;
  productList.replaceChildren();

  try {
    products = await fetchProducts();

    // Keep only cart IDs that exist in the current product catalogue.
    const validIds = new Set(products.map(product => product.id));
    cart = cart.filter(id => validIds.has(id));

    saveCart();
    renderCategories();
    renderProducts();
    renderCart();
  } catch {
    showError(
      "Products could not load. Check your internet connection and refresh the page."
    );
  } finally {
    loading.hidden = true;
  }
}

searchInput.addEventListener("input", renderProducts);
categorySelect.addEventListener("change", renderProducts);
sortSelect.addEventListener("change", renderProducts);

cart = readSavedCart();
saveCart();
init();
