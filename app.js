const $ = (id) => document.getElementById(id);

let apiProducts = [];
let customProducts = [];
let cart = [];
let selectedCategory = "All";

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function money(value) {
  return "$" + Number(value).toFixed(2);
}

function allProducts() {
  return [...apiProducts, ...customProducts];
}

/* Demo login and logout */
function setupAuth() {
  const savedUser = readStorage("shopzoneDemoUser", null);

  if (
    savedUser &&
    typeof savedUser.name === "string" &&
    typeof savedUser.email === "string"
  ) {
    showApp(savedUser);
  }

  $("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("loginName").value.trim();
    const email = $("loginEmail").value.trim();

    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      $("loginStatus").textContent =
        "Enter a valid name and email address.";
      return;
    }

    const user = { name, email };
    writeStorage("shopzoneDemoUser", user);
    showApp(user);

    $("loginStatus").textContent = "Demo sign-in successful.";
  });

  $("logoutButton").addEventListener("click", () => {
    try {
      localStorage.removeItem("shopzoneDemoUser");
    } catch {}

    $("appContent").hidden = true;
    $("loginPanel").hidden = false;
    $("logoutButton").hidden = true;
    $("userGreeting").textContent = "";
    $("loginStatus").textContent = "You have logged out.";
  });
}

function showApp(user) {
  $("loginPanel").hidden = true;
  $("appContent").hidden = false;
  $("logoutButton").hidden = false;
  $("userGreeting").textContent = `Hi, ${user.name}`;
}

/* Light and dark theme */
function setupTheme() {
  const theme = readStorage("shopzoneTheme", "light");

  document.body.classList.toggle("dark", theme === "dark");
  updateThemeLabel();

  $("themeToggle").addEventListener("click", () => {
    const dark = document.body.classList.toggle("dark");

    writeStorage("shopzoneTheme", dark ? "dark" : "light");
    updateThemeLabel();
  });
}

function updateThemeLabel() {
  $("themeToggle").textContent =
    document.body.classList.contains("dark")
      ? "☀️ Light mode"
      : "🌙 Dark mode";
}

/* Reusable button creation */
function makeButton(label, action, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;

  if (className) {
    button.className = className;
  }

  button.addEventListener("click", action);
  return button;
}

/* Category filter */
function renderCategories() {
  const select = $("categorySelect");

  const categories = [
    "All",
    ...new Set(
      allProducts()
        .map((product) => product.category)
        .filter(Boolean)
    )
  ];

  select.replaceChildren();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent =
      category === "All" ? "All categories" : category;

    select.appendChild(option);
  });

  if (!categories.includes(selectedCategory)) {
    selectedCategory = "All";
  }

  select.value = selectedCategory;
}

/* Search, filter, and sorting */
function getVisibleProducts() {
  const query = $("searchInput").value.trim().toLowerCase();

  let result = allProducts().filter((product) => {
    const title = String(product.title || "").toLowerCase();
    const category = String(product.category || "").toLowerCase();

    const matchesSearch =
      title.includes(query) || category.includes(query);

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  switch ($("sortSelect").value) {
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

/* Display product cards */
function renderProducts() {
  const list = $("productList");
  list.replaceChildren();

  const products = getVisibleProducts();

  $("status").textContent = products.length
    ? `${products.length} product(s) found.`
    : "No products found. Try another search or category.";

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    if (product.image) {
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.title;
      image.loading = "lazy";

      image.addEventListener("error", () => image.remove());
      card.appendChild(image);
    }

    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.category;

    const title = document.createElement("h3");
    title.textContent = product.title;

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = money(product.price);

    const addButton = makeButton(
      "Add to cart",
      () => addToCart(product.id),
      "primary-button"
    );

    card.append(category, title, price, addButton);
    list.appendChild(card);
  });
}

/* Shopping cart */
function normalizeCart(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) =>
      typeof item === "number"
        ? { id: item, quantity: 1 }
        : item
    )
    .filter(
      (item) =>
        item &&
        Number.isInteger(item.id) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
}

function saveCart() {
  writeStorage("shopzoneCart", cart);
  updateCartCount();
}

function updateCartCount() {
  $("cartCount").textContent = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
}

function addToCart(id) {
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }

  saveCart();
  renderCart();
  $("status").textContent = "Product added to cart.";
}

function changeQuantity(id, amount) {
  const item = cart.find((entry) => entry.id === id);

  if (!item) return;

  item.quantity += amount;
  cart = cart.filter((entry) => entry.quantity > 0);

  saveCart();
  renderCart();
}

function renderCart() {
  const container = $("cartItems");
  container.replaceChildren();

  let subtotal = 0;

  cart.forEach((item) => {
    const product = allProducts().find(
      (entry) => entry.id === item.id
    );

    if (!product) return;

    subtotal += product.price * item.quantity;

    const row = document.createElement("div");
    row.className = "cart-row";

    const name = document.createElement("strong");
    name.textContent =
      `${product.title} — ${money(product.price * item.quantity)}`;

    const controls = document.createElement("div");
    controls.className = "quantity-actions";

    controls.append(
      makeButton("−", () => changeQuantity(item.id, -1)),
      document.createTextNode(` ${item.quantity} `),
      makeButton("+", () => changeQuantity(item.id, 1)),
      makeButton("Remove", () => {
        cart = cart.filter(
          (entry) => entry.id !== item.id
        );

        saveCart();
        renderCart();
      })
    );

    row.append(name, controls);
    container.appendChild(row);
  });

  if (!container.children.length) {
    const empty = document.createElement("p");
    empty.textContent = "Your cart is empty.";
    container.appendChild(empty);
  }

  $("cartTotal").textContent = money(subtotal);
  updateCartCount();
}

function toggleCart(show) {
  $("cartPanel").hidden = !show;

  $("viewCart").setAttribute(
    "aria-expanded",
    String(show)
  );

  if (show) {
    renderCart();

    $("cartPanel").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

/* CRUD: create, read, update, delete */
function saveCustomProducts() {
  const saved = writeStorage(
    "shopzoneCustomProducts",
    customProducts
  );

  if (!saved) {
    $("crudStatus").textContent =
      "Could not save in browser storage. Check your browser settings.";
  }
}

function renderCustomProducts() {
  const container = $("customProductList");
  container.replaceChildren();

  if (!customProducts.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent =
      "No custom products yet. Add one using the form above.";

    container.appendChild(empty);
    return;
  }

  customProducts.forEach((product) => {
    const row = document.createElement("div");
    row.className = "custom-row";

    const info = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = product.title;

    const details = document.createElement("p");
    details.className = "muted";
    details.textContent =
      `${product.category} · ${money(product.price)}`;

    info.append(name, details);

    const actions = document.createElement("div");
    actions.className = "row-actions";

    actions.append(
      makeButton("Edit", () => startEdit(product.id)),
      makeButton("Delete", () => deleteCustom(product.id))
    );

    row.append(info, actions);
    container.appendChild(row);
  });
}

function resetProductForm() {
  $("productForm").reset();
  $("editProductId").value = "";
  $("saveProduct").textContent = "Add product";
  $("cancelEdit").hidden = true;
}

function startEdit(id) {
  const product = customProducts.find(
    (entry) => entry.id === id
  );

  if (!product) return;

  $("editProductId").value = String(id);
  $("productName").value = product.title;
  $("productPrice").value = product.price;
  $("productCategory").value = product.category;
  $("saveProduct").textContent = "Save changes";
  $("cancelEdit").hidden = false;
  $("productName").focus();
}

function deleteCustom(id) {
  customProducts = customProducts.filter(
    (product) => product.id !== id
  );

  cart = cart.filter((item) => item.id !== id);

  saveCustomProducts();
  saveCart();
  renderCustomProducts();
  renderCategories();
  renderProducts();
  renderCart();

  $("crudStatus").textContent = "Custom product deleted.";
}

function setupCrud() {
  const saved = readStorage("shopzoneCustomProducts", []);

  customProducts = Array.isArray(saved)
    ? saved.filter(
        (product) =>
          product &&
          Number.isInteger(product.id) &&
          typeof product.title === "string" &&
          typeof product.category === "string" &&
          Number.isFinite(Number(product.price))
      )
    : [];

  $("productForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const title = $("productName").value.trim();
    const price = Number($("productPrice").value);
    const category = $("productCategory").value.trim();

    if (
      !title ||
      !category ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      $("crudStatus").textContent =
        "Enter a name, category, and price greater than zero.";
      return;
    }

    const editValue = $("editProductId").value;

    if (editValue) {
      const id = Number(editValue);

      const index = customProducts.findIndex(
        (product) => product.id === id
      );

      if (index !== -1) {
        customProducts[index] = {
          ...customProducts[index],
          title,
          price,
          category
        };
      }

      $("crudStatus").textContent =
        "Custom product updated and saved.";
    } else {
      const maxId = allProducts().reduce(
        (max, product) =>
          Math.max(max, Number(product.id) || 0),
        0
      );

      const id = Math.max(Date.now(), maxId + 1);

      customProducts.push({
        id,
        title,
        price,
        category,
        image: ""
      });

      $("crudStatus").textContent =
        "Custom product created and saved.";
    }

    saveCustomProducts();
    resetProductForm();
    renderCategories();
    renderProducts();
    renderCustomProducts();
  });

  $("cancelEdit").addEventListener(
    "click",
    resetProductForm
  );

  renderCustomProducts();
}

/* Search, filters, and cart events */
function setupEvents() {
  $("searchInput").addEventListener(
    "input",
    renderProducts
  );

  $("categorySelect").addEventListener("change", () => {
    selectedCategory = $("categorySelect").value;
    renderProducts();
  });

  $("sortSelect").addEventListener(
    "change",
    renderProducts
  );

  $("viewCart").addEventListener("click", () => {
    toggleCart($("cartPanel").hidden);
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

/* Start the application */
setupTheme();
setupAuth();
setupEvents();
setupCrud();

cart = normalizeCart(
  readStorage("shopzoneCart", [])
);

updateCartCount();

fetchProducts()
  .then((data) => {
    apiProducts = data;

    const validIds = new Set(
      allProducts().map((product) => product.id)
    );

    cart = cart.filter(
      (item) => validIds.has(item.id)
    );

    saveCart();
    renderCategories();
    renderProducts();
    renderCart();
  })
  .catch((error) => {
    console.error(error);

    $("status").textContent =
      "Online products could not load. Check your connection and refresh. Custom product management is still available after demo sign-in.";

    renderCategories();
    renderProducts();
    renderCart();
  });