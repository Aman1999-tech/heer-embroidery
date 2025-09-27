// =======================
// FIREBASE CONFIGURATION
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =======================
// GET PRODUCT FROM URL
// =======================
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

if (!productId) {
  alert("Product not found");
  window.location.href = "index.html";
}

// =======================
// DOM ELEMENTS
// =======================
const productImg = document.getElementById("productImg");
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productDesc = document.getElementById("productDesc");
const addCartBtn = document.getElementById("addCartBtn");
const addWishlistBtn = document.getElementById("addWishlistBtn");

const cartDrawer = document.getElementById("cartDrawer");
const wishlistDrawer = document.getElementById("wishlistDrawer");
const cartItems = document.getElementById("cartItems");
const wishlistItems = document.getElementById("wishlistItems");
const cartCount = document.getElementById("cartCount");
const wishlistCount = document.getElementById("wishlistCount");
const cartTotal = document.getElementById("cartTotal");

// =======================
// CART & WISHLIST STORAGE
// =======================
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }

// =======================
// CART FUNCTIONS
// =======================
function renderCart() {
  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    const div = document.createElement("div");
    div.className = "flex justify-between items-center mb-3 border-b pb-2";
    div.innerHTML = `
      <img src="${item.img}" class="w-16 h-16 object-cover rounded mr-2">
      <div class="flex-1 ml-2">
        <p class="font-semibold">${item.name}</p>
        <p class="text-sm text-gray-600">₹${item.price} × ${item.quantity} = ₹${item.price*item.quantity}</p>
      </div>
      <div class="flex flex-col items-center gap-1">
        <button class="bg-gray-300 px-2 rounded increase">+</button>
        <span>${item.quantity}</span>
        <button class="bg-gray-300 px-2 rounded decrease">-</button>
      </div>
    `;
    div.querySelector(".increase").addEventListener("click", () => updateCartQuantity(item.id, "increase"));
    div.querySelector(".decrease").addEventListener("click", () => updateCartQuantity(item.id, "decrease"));
    cartItems.appendChild(div);
  });
  cartCount.textContent = cart.reduce((sum,i)=>sum+i.quantity,0);
  cartTotal.textContent = `₹${total}`;
  saveCart();
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity++;
  else cart.push({...product, quantity:1});
  wishlist = wishlist.filter(i => i.id !== product.id);
  saveWishlist();
  renderWishlist();
  renderCart();
}

function updateCartQuantity(id, action) {
  cart = cart.map(item => {
    if(item.id === id) {
      if(action === "increase") item.quantity++;
      if(action === "decrease") item.quantity--;
    }
    return item;
  }).filter(i => i.quantity > 0);
  renderCart();
}

// =======================
// WISHLIST FUNCTIONS
// =======================
function renderWishlist() {
  wishlistItems.innerHTML = "";
  wishlist.forEach(item => {
    const div = document.createElement("div");
    div.className = "flex justify-between items-center mb-3 border-b pb-2";
    div.innerHTML = `
      <img src="${item.img}" class="w-16 h-16 object-cover rounded mr-2">
      <div class="flex-1 ml-2">
        <p class="font-semibold">${item.name}</p>
        <p class="text-sm text-gray-600">₹${item.price}</p>
      </div>
      <div class="flex flex-col gap-1">
        <button class="bg-green-600 text-white px-2 rounded moveCart">Move to Cart</button>
        <button class="bg-red-500 text-white px-2 rounded removeWishlist">Remove</button>
      </div>
    `;
    div.querySelector(".moveCart").addEventListener("click", () => addToCart(item));
    div.querySelector(".removeWishlist").addEventListener("click", () => removeFromWishlist(item.id));
    wishlistItems.appendChild(div);
  });
  wishlistCount.textContent = wishlist.length;
  saveWishlist();
}

function addToWishlist(product){
  if(!wishlist.find(i => i.id === product.id)) wishlist.push(product);
  renderWishlist();
}

function removeFromWishlist(id){
  wishlist = wishlist.filter(i => i.id !== id);
  renderWishlist();
}

// =======================
// DRAWER TOGGLES
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const cartBtn = document.getElementById("cartBtn");
  const wishlistBtn = document.getElementById("wishlistBtn");
  const closeCartBtn = document.querySelector(".closeCart");
  const closeWishlistBtn = document.querySelector(".closeWishlist");

  // Open Cart
  cartBtn.addEventListener("click", () => {
    cartDrawer.classList.remove("translate-x-full");
  });

  // Close Cart
  closeCartBtn.addEventListener("click", () => {
    cartDrawer.classList.add("translate-x-full");
  });

  // Open Wishlist
  wishlistBtn.addEventListener("click", () => {
    wishlistDrawer.classList.remove("-translate-x-full");
  });

  // Close Wishlist
  closeWishlistBtn.addEventListener("click", () => {
    wishlistDrawer.classList.add("-translate-x-full");
  });
});

// =======================
// LOAD PRODUCT FROM FIREBASE
// =======================
async function loadProduct() {
  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);

  if (productSnap.exists()) {
    const product = productSnap.data();

    productImg.src = product.img;
    productImg.alt = product.name;
    productName.textContent = product.name;
    productPrice.textContent = `₹${product.price}`;
    productDesc.textContent = product.description;

    addCartBtn.onclick = () => addToCart({ id: productId, ...product });
    addWishlistBtn.onclick = () => addToWishlist({ id: productId, ...product });
  } else {
    alert("Product not found");
    window.location.href = "index.html";
  }
}

// =======================
// BUTTON ACTIONS & INITIAL LOAD
// =======================
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  renderWishlist();

  const backShopBtn = document.getElementById("backShopBtn");
  backShopBtn.addEventListener("click", () => window.location.href = "index.html");

  loadProduct(); // Load product from Firebase
});
