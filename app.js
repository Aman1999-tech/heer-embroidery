import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let currentFilter = "All";

const productGrid = document.getElementById("productGrid");
const cartDrawer = document.getElementById("cartDrawer");
const wishlistDrawer = document.getElementById("wishlistDrawer");
const checkoutDrawer = document.getElementById("checkoutDrawer");
const cartItems = document.getElementById("cartItems");
const wishlistItems = document.getElementById("wishlistItems");
const cartCount = document.getElementById("cartCount");
const wishlistCount = document.getElementById("wishlistCount");
const cartTotal = document.getElementById("cartTotal");

// ------------------- Render -------------------
function renderProducts(filter = "All") {
  currentFilter = filter;
  productGrid.innerHTML = "";
  products.filter(p => filter === "All" || p.category === filter)
    .forEach(product => {
      const card = document.createElement("div");
      card.className = "glass rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition";
      card.innerHTML = `
        <img src="${product.img}" alt="${product.name}" class="w-40 h-40 object-cover rounded-lg mb-3">
        <h3 class="font-semibold">${product.name}</h3>
        <p class="text-pink-600 font-bold">₹${product.price}</p>
      `;
      card.addEventListener("click", () => window.location.href = `product.html?id=${product.id}`);
      productGrid.appendChild(card);
    });
}

function renderFilterButtons() {
  const container = document.querySelector(".filter-btns-container");
  if (!container) return;
  const categories = ["All", ...new Set(products.map(p => p.category))];
  container.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn glass px-3 py-1 rounded";
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.addEventListener("click", () => renderProducts(cat));
    container.appendChild(btn);
  });
}

// ------------------- Cart & Wishlist -------------------
function renderCart() {
  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    total += item.price;
    const div = document.createElement("div");
    div.className = "flex justify-between p-2 border-b";
    div.innerHTML = `<span>${item.name}</span><span>₹${item.price}</span>`;
    cartItems.appendChild(div);
  });
  cartTotal.textContent = `₹${total}`;
  cartCount.textContent = cart.length;
}

function renderWishlist() {
  wishlistItems.innerHTML = "";
  wishlist.forEach(item => {
    const div = document.createElement("div");
    div.className = "flex justify-between p-2 border-b";
    div.innerHTML = `<span>${item.name}</span><span>₹${item.price}</span>`;
    wishlistItems.appendChild(div);
  });
  wishlistCount.textContent = wishlist.length;
}

// ------------------- Firestore -------------------
async function loadProductsFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    products = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name,
        price: data.price,
        category: data.category,
        img: data.img || "public/images/placeholder.jpg",
        description: data.description || ""
      });
    });
    renderProducts(currentFilter);
    renderFilterButtons();
  } catch (err) {
    console.error("Error fetching products:", err);
  }
}

// ------------------- Init -------------------
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  renderWishlist();
  loadProductsFromFirestore();

  document.getElementById("cartBtn").addEventListener("click", () => cartDrawer.classList.remove("translate-x-full"));
  document.querySelector(".closeCart").addEventListener("click", () => cartDrawer.classList.add("translate-x-full"));
  document.getElementById("wishlistBtn").addEventListener("click", () => wishlistDrawer.classList.remove("-translate-x-full"));
  document.querySelector(".closeWishlist").addEventListener("click", () => wishlistDrawer.classList.add("-translate-x-full"));
  document.getElementById("checkoutBtn").addEventListener("click", () => {
    cartDrawer.classList.add("translate-x-full");
    checkoutDrawer.classList.remove("translate-x-full");
  });
  document.querySelector(".closeCheckout").addEventListener("click", () => checkoutDrawer.classList.add("translate-x-full"));
});
