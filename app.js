
"use strict";

const $ = id => document.getElementById(id);

const productList = $("productList");
const searchInput = $("searchInput");
const searchForm = $("searchForm");
const searchCategory = $("searchCategory");
const categoryTabs = $("categoryTabs");
const sortSelect = $("sortSelect");
const loading = $("loading");
const errorBanner = $("errorBanner");
const productStatus = $("productStatus");
const cartCount = $("cartCount");
const cartPanel = $("cartPanel");
const cartItems = $("cartItems");
const cartQuantity = $("cartQuantity");
const cartTotal = $("cartTotal");
const viewCart = $("viewCart");
const themeToggle = $("themeToggle");
const contactForm = $("contactForm");
const formStatus = $("formStatus");
const infoDialog = $("infoDialog");

let products = [];
let cart = [];
let activeCategory = "All";
let activeTheme = "light";

function announce(message) {
  productStatus.textContent = message;
}

function formatPrice(value) {
  return "$" + Number(value).toFixed(2);
}

function safeRead(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = String(count);
  cartQuantity.textContent = String(count);

  try {
    localStorage.setItem("productCart", JSON.stringify(cart));
  } catch {
    announce("Cart could not be saved on this device.");
  }
}

function makeButton(text, action, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", action);
  if (className) button.className = className;
  return button;
}

/* Categories */

function renderCategories() {
  const categories = [...new Set(products.map(p => p.category))].sort();

  categoryTabs.replaceChildren();
  searchCategory.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = "All";
  searchCategory.appendChild(allOption);

  ["All", ...categories].forEach(category => {
    const button = makeButton(category, () => {
      activeCategory = category;
      searchCategory.value = category;
      renderCategories();
      renderProducts();
    });

    button.setAttribute("aria-pressed", String(category === activeCategory));
    categoryTabs.appendChild(button);

    if (category !== "All") {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      searchCategory.appendChild(option);
    }
  });

  searchCategory.value = activeCategory;
}

/* Product display */

function renderProducts() {
  const search = searchInput.value.trim().toLowerCase();

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
    const empty = document.createElement("p");
    empty.textContent = "No products found. Try a different search.";
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

    const category = document.createElement("p");
    category.className = "category";
    category.textContent = product.category;

    const rating = document.createElement("p");
    rating.className = "rating";
    const rate = Number(product.rating?.rate);
    const count = Number(product.rating?.count);
    rating.textContent = Number.isFinite(rate) && Number.isFinite(count)
      ? "★ " + rate.toFixed(1) + " / 5 (" + count + " reviews)"
      : "Rating unavailable";

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = formatPrice(product.price);

    const add = makeButton("Add to Cart", () => {
      const existing = cart.find(item => item.id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id: product.id, quantity: 1 });
      }

      saveCart();
      renderCart();
      announce(product.title + " added to cart.");
    });

    card.append(image, title, category, rating, price, add);
    productList.appendChild(card);
  });

  announce(filtered.length + " products displayed.");
}

/* Cart */

function renderCart() {
  cartItems.replaceChildren();
  let total = 0;
  let count = 0;

  cart = cart.filter(item =>
    products.some(product => product.id === item.id) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );

  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;

    total += product.price * item.quantity;
    count += item.quantity;

    const row = document.createElement("div");
    row.className = "cart-item";

    const name = document.createElement("p");
    name.textContent = product.title + " — " + formatPrice(product.price);

    const quantityControls = document.createElement("div");
    quantityControls.className = "quantity-controls";

    const decrease = makeButton("−", () => {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        cart = cart.filter(entry => entry.id !== item.id);
      }
      saveCart();
      renderCart();
    });
    decrease.setAttribute("aria-label", "Decrease quantity of " + product.title);

    const quantity = document.createElement("span");
    quantity.textContent = "Qty: " + item.quantity;

    const increase = makeButton("+", () => {
      item.quantity += 1;
      saveCart();
      renderCart();
    });
    increase.setAttribute("aria-label", "Increase quantity of " + product.title);

    quantityControls.append(decrease, quantity, increase);

    const remove = makeButton("Remove", () => {
      cart = cart.filter(entry => entry.id !== item.id);
      saveCart();
      renderCart();
      announce(product.title + " removed from cart.");
    }, "light-button");

    row.append(name, quantityControls, remove);
    cartItems.appendChild(row);
  });

  if (count === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Your cart is empty.";
    cartItems.appendChild(empty);
  }

  cartTotal.textContent = formatPrice(total);
  cartQuantity.textContent = String(count);
  saveCart();
}

function setCartOpen(open) {
  cartPanel.hidden = !open;
  viewCart.setAttribute("aria-expanded", String(open));

  if (open) {
    renderCart();
    cartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

viewCart.addEventListener("click", () => setCartOpen(cartPanel.hidden));

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

/* Theme */

function applyTheme(theme) {
  activeTheme = theme;
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "☀️ Light" : "🌙 Theme";
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
}

let savedTheme = "light";
try {
  savedTheme = localStorage.getItem("dashboardTheme") === "dark" ? "dark" : "light";
} catch {}
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const next = activeTheme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem("dashboardTheme", next);
  } catch {}
});

/* Dialog */

$("openInfo").addEventListener("click", () => {
  if (typeof infoDialog.showModal === "function") infoDialog.showModal();
});

$("closeInfo").addEventListener("click", () => infoDialog.close());

infoDialog.addEventListener("click", event => {
  if (event.target === infoDialog) infoDialog.close();
});

/* Contact form */

const fields = [
  {
    input: $("contactName"),
    error: $("nameError"),
    message: "Enter at least 2 characters.",
    valid: value => value.trim().length >= 2
  },
  {
    input: $("contactEmail"),
    error: $("emailError"),
    message: "Enter a valid email address.",
    valid: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  },
  {
    input: $("contactMessage"),
    error: $("messageError"),
    message: "Enter at least 10 characters.",
    valid: value => value.trim().length >= 10
  }
];

fields.forEach(field => {
  field.input.setAttribute("aria-describedby", field.error.id);

  field.input.addEventListener("input", () => {
    field.error.textContent = "";
    field.input.removeAttribute("aria-invalid");
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
      if (!firstInvalid) firstInvalid = field.input;
    }
  });

  if (firstInvalid) {
    formStatus.textContent = "Please correct the errors above.";
    formStatus.className = "error";
    firstInvalid.focus();
    return;
  }

  formStatus.textContent = "Validation successful! This demo does not send messages.";
  formStatus.className = "success";
  contactForm.reset();
});

/* Search */

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  activeCategory = searchCategory.value;
  renderCategories();
  renderProducts();
  $("products").scrollIntoView({ behavior: "smooth" });
});

searchCategory.addEventListener("change", () => {
  activeCategory = searchCategory.value;
  renderCategories();
  renderProducts();
});

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);

/* API startup */

async function init() {
  loading.hidden = false;
  errorBanner.hidden = true;

  try {
    products = await fetchProducts();

    const validIds = new Set(products.map(product => product.id));
    cart = cart.filter(item => validIds.has(item.id));

    renderCategories();
    renderProducts();
    saveCart();
    renderCart();
  } catch {
    errorBanner.textContent =
      "Products could not load. Check your internet connection and refresh the page.";
    errorBanner.hidden = false;
  } finally {
    loading.hidden = true;
  }
}

const savedCart = safeRead("productCart", []);

if (Array.isArray(savedCart)) {
  cart = savedCart.map(item => {
    // Support cart data saved by the older version.
    if (Number.isInteger(item)) return { id: item, quantity: 1 };

    return {
      id: item?.id,
      quantity: Number.isInteger(item?.quantity) ? item.quantity : 1
    };
  }).filter(item => Number.isInteger(item.id) && item.quantity > 0);
}

saveCart();
init();
