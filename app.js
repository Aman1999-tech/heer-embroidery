// =======================
// app.js - Home Page Logic (uses shared header.js)
// =======================

let products = [];
let currentFilter = "All";
const productGrid = document.getElementById("productGrid");

// =======================
// RENDER PRODUCTS
// =======================
function renderProducts(filter = "All") {
  currentFilter = filter;
  productGrid.innerHTML = "";

  const filtered = filter === "All" ? products : products.filter(p => p.category === filter);
  if (!filtered.length) {
    productGrid.innerHTML = `<p class="text-center text-gray-500 col-span-3">No products available</p>`;
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement("div");
    card.className =
      "glass rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-lg transition cursor-pointer";

    card.innerHTML = `
      <img src="${product.img}" alt="${product.name}" class="w-40 h-40 object-cover rounded-lg mb-3">
      <h3 class="font-semibold">${product.name}</h3>
      <p class="text-pink-600 font-bold">₹${product.price}</p>
      <div class="flex gap-2 mt-2">
        <button class="bg-green-600 text-white px-3 py-1 rounded addCart">Add to Cart</button>
        <button class="bg-yellow-400 text-black px-3 py-1 rounded addWish">♡ Wishlist</button>
      </div>
    `;

    // Button functionality using global Header
    card.querySelector(".addCart").addEventListener("click", (e) => {
      e.stopPropagation();
      Header.addToCart(product);
    });

    card.querySelector(".addWish").addEventListener("click", (e) => {
      e.stopPropagation();
      Header.addToWishlist(product);
    });

    // Navigate to product detail
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${product.id}`;
    });

    productGrid.appendChild(card);
  });
}

// =======================
// FILTER BUTTONS
// =======================
function renderFilterButtons() {
  const container = document.querySelector(".filter-btns-container");
  if (!container) return;

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  container.innerHTML = "";

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `filter-btn glass px-3 py-1 rounded ${cat === "All" ? "bg-pink-600 text-white" : ""}`;
    btn.textContent = cat;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("bg-pink-600", "text-white"));
      btn.classList.add("bg-pink-600", "text-white");
      renderProducts(cat);
    });

    container.appendChild(btn);
  });
}

// =======================
// LOAD PRODUCTS FROM SERVER
// =======================
async function loadProducts() {
  try {
    const res = await fetch("/products");
    const adminProducts = await res.json();
    products = adminProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      img: p.image || "public/images/placeholder.jpg",
      description: p.description || ""
    }));
    renderFilterButtons();
    renderProducts("All");
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// =======================
// INIT (after header/footer loaded)
// =======================
document.addEventListener("partials:loaded", () => {
  loadProducts();
  Header.updateCounts(); // sync badge counts
});
