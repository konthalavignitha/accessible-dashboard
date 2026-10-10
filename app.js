

const $ = (id) => document.getElementById(id);

const productList = $("productList");
const statusMessage = $("status");
const searchInput = $("searchInput");
const categorySelect = $("categorySelect");
const sortSelect = $("sortSelect");
const cartPanel = $("cartPanel");

let products = [];
let cart = [];
let selectedCategory = "All";

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function saveCart() {
  try {
    localStorage.setItem("productCart", JSON.stringify(cart));
  } catch {
    // The cart still works for the current session.
  }
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $("cartCount").textContent = count;
}

function money(value) {
  return "$" + Number(value).toFixed(2);
}

function makeButton(label, action, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) button.className = className;
  button.addEventListener("click", action);
  return button;
}

function renderCategories() {
  const categories = [
    "All",
    ...new Set(products.map((p) => p.category))
  ];

  categorySelect.replaceChildren();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent =
      category === "All"
        ? "All categories"
        : category.charAt(0).toUpperCase() + category.slice(1);

    categorySelect.appendChild(option);
  });

  categorySelect.value = selectedCategory;
}

function getVisibleProducts() {
  const query = searchInput.value.trim().toLowerCase();

  let result = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  switch (sortSelect.value) {
    case "priceLow":
      result.sort((a, b) => a.price - b.price);
      break;
    case "priceHigh":
      result.sort((a, b) => b.price - a.price);
      break;
    case "name":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }

  return result;
}

function renderProducts() {
  productList.replaceChildren();

  const visible = getVisibleProducts();

  statusMessage.textContent =
    visible.length === 0
      ? "No products found. Try another search or category."
      : `${visible.length} product(s) found.`;

  visible.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.title;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.alt = "Product image unavailable";
      image.removeAttribute("src");
    });

    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.category;

    const title = document.createElement("h3");
    title.textContent = product.title;

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = money(product.price);

    const addButton = makeButton(
      "Add to Cart",
      () => addToCart(product.id),
      "primary-button"
    );

    card.append(image, category, title, price, addButton);
    productList.appendChild(card);
  });
}

function addToCart(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }

  saveCart();
  renderCart();
  statusMessage.textContent = `${product.title} added to cart.`;
}

function changeQuantity(id, change) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter((entry) => entry.id !== id);
  }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  const cartItems = $("cartItems");
  cartItems.replaceChildren();

  let subtotal = 0;
  let totalQuantity = 0;

  cart.forEach((item) => {
    const product = products.find((p) => p.id === item.id);
    if (!product) return;

    subtotal += product.price * item.quantity;
    totalQuantity += item.quantity;

    const row = document.createElement("div");
    row.className = "cart-item";

    const title = document.createElement("h3");
    title.textContent = product.title;

    const price = document.createElement("p");
    price.textContent = money(product.price * item.quantity);

    const controls = document.createElement("div");
    controls.className = "cart-controls";

    controls.append(
      makeButton("−", () => changeQuantity(item.id, -1)),
      document.createTextNode(String(item.quantity)),
      makeButton("+", () => changeQuantity(item.id, 1)),
      makeButton("Remove", () => removeFromCart(item.id))
    );

    row.append(title, price, controls);
    cartItems.appendChild(row);
  });

  $("cartTotal").textContent = money(subtotal);
  $("cartCount").textContent = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  if (totalQuantity === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Your cart is empty.";
    cartItems.appendChild(empty);
  }
}

function toggleCart(show) {
  cartPanel.hidden = !show;
  $("viewCart").setAttribute("aria-expanded", String(show));

  if (show) {
    renderCart();
    cartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setupTheme() {
  const savedTheme = readStorage("dashboardTheme", "light");
  const isDark = savedTheme === "dark";

  document.body.classList.toggle("dark", isDark);
  updateThemeButton();

  $("themeToggle").addEventListener("click", () => {
    const dark = document.body.classList.toggle("dark");

    try {
      localStorage.setItem(
        "dashboardTheme",
        dark ? "dark" : "light"
      );
    } catch {
      // Theme still changes for this session.
    }

    updateThemeButton();
  });
}

function updateThemeButton() {
  const dark = document.body.classList.contains("dark");
  $("themeToggle").textContent =
    dark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function setupEvents() {
  searchInput.addEventListener("input", renderProducts);

  categorySelect.addEventListener("change", () => {
    selectedCategory = categorySelect.value;
    renderProducts();
  });

  sortSelect.addEventListener("change", renderProducts);

  $("viewCart").addEventListener("click", () => {
    toggleCart(cartPanel.hidden);
  });

  $("closeCart").addEventListener("click", () => {
    toggleCart(false);
  });

  $("clearCart").addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
  });
}

async function init() {
  setupTheme();
  setupEvents();

  const savedCart = readStorage("productCart", []);
  cart = Array.isArray(savedCart)
    ? savedCart.map((item) => {
        if (typeof item === "number") {
          return { id: item, quantity: 1 };
        }
        return item;
      }).filter((item) =>
        item &&
        Number.isInteger(item.id) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      )
    : [];

  updateCartCount();

  try {
    products = await fetchProducts();

    const validIds = new Set(products.map((p) => p.id));
    cart = cart.filter((item) => validIds.has(item.id));

    saveCart();
    renderCategories();
    renderProducts();
    renderCart();
  } catch (error) {
    statusMessage.textContent =
      "Products could not load. Check your internet connection and try again.";

    const retry = makeButton("Retry loading products", init);
    productList.replaceChildren(retry);
    console.error(error);
  }
}

init();
