

const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");
const categoryTabs = document.getElementById("categoryTabs");
const sortSelect = document.getElementById("sortSelect");
const errorBanner = document.getElementById("errorBanner");
const loading = document.getElementById("loading");
const cartCount = document.getElementById("cartCount");
const cartButton = document.getElementById("viewCart");
const cartPanel = document.getElementById("cartPanel");

let products = [];
let activeCategory = "All";
let cart = [];

try {
  const savedCart = JSON.parse(
    localStorage.getItem("productCart") || "[]"
  );

  if (Array.isArray(savedCart)) {
    cart = savedCart.filter(id => Number.isInteger(id));
  }
} catch {
  cart = [];
}

function updateCartCount() {
  if (cartCount) {
    cartCount.textContent = cart.length;
  }
}

function saveCart() {
  updateCartCount();

  try {
    localStorage.setItem("productCart", JSON.stringify(cart));
  } catch {
    showToast("Could not save your cart on this device.");
  }
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
}

function showToast(message) {
  let toast = document.getElementById("cartMessage");

  if (!toast) {
    toast = document.createElement("p");
    toast.id = "cartMessage";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = "cart-message";
  toast.hidden = false;

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2500);
}

function addToCart(product) {
  cart.push(product.id);
  saveCart();
  showToast(product.title + " added to cart!");
}

function renderProducts() {
  const search = searchInput.value.trim().toLowerCase();

  let filtered = products.filter(product =>
    product.title.toLowerCase().includes(search) &&
    (activeCategory === "All" ||
      product.category === activeCategory)
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

    image.addEventListener("error", () => {
      image.alt = product.title + " image unavailable";
      image.removeAttribute("src");
    });

    const title = document.createElement("h3");
    title.textContent = product.title;

    const rating = document.createElement("p");
    const rate = Number(product.rating?.rate);
    const reviewCount = Number(product.rating?.count);

    rating.textContent =
      Number.isFinite(rate) && Number.isFinite(reviewCount)
        ? "⭐ " + rate.toFixed(1) + " (" + reviewCount + " reviews)"
        : "Rating unavailable";

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = "$" + product.price.toFixed(2);

    const button = document.createElement("button");
    button.textContent = "Add to Cart";
    button.addEventListener("click", () => addToCart(product));

    card.append(image, title, rating, price, button);
    productList.appendChild(card);
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

    categoryTabs.appendChild(button);
  });
}

function renderCart() {
  cartPanel.replaceChildren();

  const heading = document.createElement("h2");
  heading.textContent = "Your Shopping Cart";
  cartPanel.appendChild(heading);

  let total = 0;

  const cartItems = cart.map((id, index) => ({
    product: products.find(p => p.id === id),
    index
  })).filter(item => item.product);

  if (cartItems.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Your cart is empty.";
    cartPanel.appendChild(empty);
  }

  cartItems.forEach(({ product, index }) => {
    total += product.price;

    const item = document.createElement("div");
    item.className = "cart-item";

    const name = document.createElement("p");
    name.textContent =
      product.title + " — $" + product.price.toFixed(2);

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      cart.splice(index, 1);
      saveCart();
      renderCart();
    });

    item.append(name, removeButton);
    cartPanel.appendChild(item);
  });

  const totalText = document.createElement("h3");
  totalText.textContent = "Total: $" + total.toFixed(2);
  cartPanel.appendChild(totalText);

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close Cart";
  closeButton.addEventListener("click", () => {
    cartPanel.hidden = true;
  });

  cartPanel.appendChild(closeButton);
  cartPanel.hidden = false;
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

cartButton.addEventListener("click", () => {
  if (products.length === 0) {
    showToast("Please wait for products to load.");
    return;
  }

  renderCart();
});

updateCartCount();
init();
