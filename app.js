// =======================
// app.js - Home Page (Firestore Live Loading)
// =======================

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { app } from "./firebase-config.js";

const db = getFirestore(app);

let products = [];
let currentFilter = "All";
const productGrid = document.getElementById("productGrid");

// =======================
// RENDER PRODUCTS
// =======================
function renderProducts(filter = "All") {
  productGrid.innerHTML = "";

  const filtered =
    filter === "All"
      ? products
      : products.filter((p) => p.category === filter);

  if (!filtered.length) {
    productGrid.innerHTML = `<p class="text-center text-gray-500 col-span-3">No products available</p>`;
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className =
      "glass rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-lg transition cursor-pointer";

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="w-40 h-40 object-cover rounded-lg mb-3">
      <h3 class="font-semibold">${product.name}</h3>
      <p class="text-pink-600 font-bold">₹${product.price}</p>
    `;

    // Navigate to product detail page
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

  const categories = ["All", ...new Set(products.map((p) => p.category))];
  container.innerHTML = "";

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = `filter-btn glass px-3 py-1 rounded ${cat === "All" ? "bg-pink-600 text-white" : ""}`;
    btn.textContent = cat;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) =>
        b.classList.remove("bg-pink-600", "text-white")
      );
      btn.classList.add("bg-pink-600", "text-white");
      renderProducts(cat);
    });

    container.appendChild(btn);
  });
}

// =======================
// LOAD PRODUCTS FROM FIRESTORE
// =======================
async function loadProducts() {
  try {
    const colRef = collection(db, "products");
    const snapshot = await getDocs(colRef);

    products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    renderFilterButtons();
    renderProducts();
  } catch (err) {
    console.error("Error loading Firestore products:", err);
  }
}

// =======================
// INIT (after header/footer loaded)
// =======================
document.addEventListener("partials:loaded", () => {
  loadProducts();

  if (window.Header?.updateCounts) {
    window.Header.updateCounts();
  }
});
