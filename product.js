// =======================
// GET PRODUCT FROM URL
// =======================
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// Fallback sample products
let products = [
  { id: "1", name: "Handmade Embroidery", price: 1200, img: "public/images/embroidery1.jpg", description: "Beautiful handmade embroidery work." },
  { id: "2", name: "Custom Bouquet", price: 800, img: "public/images/bouquet1.jpg", description: "Custom bouquets for every occasion." },
  { id: "3", name: "Gift Box", price: 500, img: "public/images/gift1.jpg", description: "Perfect gift box for loved ones." }
];

// =======================
// GLOBAL ARRAYS
// =======================
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

// =======================
// HELPERS
// =======================
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }

function updateHeaderCounts() {
  const cartQty = cart.reduce((s, i) => s + i.quantity, 0);
  const wishQty = wishlist.length;
  window.Header?.setCartCount(cartQty);
  window.Header?.setWishlistCount(wishQty);
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
const cartItems = document.getElementById("cartItems");
const wishlistItems = document.getElementById("wishlistItems");
const cartTotal = document.getElementById("cartTotal");
const cartDrawer = document.getElementById("cartDrawer");
const wishlistDrawer = document.getElementById("wishlistDrawer");
const checkoutDrawer = document.getElementById("checkoutDrawer");

// =======================
// POPUP
// =======================
function showPopupMessage(message, color = "bg-green-600") {
  const popup = document.createElement("div");
  popup.textContent = message;
  popup.className = `${color} text-white px-4 py-2 rounded shadow-lg fixed top-6 right-6 z-[9999] animate-slideIn`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1500);
}

// =======================
// CART / WISHLIST LOGIC
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
        <p class="text-sm text-gray-600">₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</p>
      </div>
      <div class="flex flex-col items-center gap-1">
        <button class="bg-gray-300 px-2 rounded increase">+</button>
        <span>${item.quantity}</span>
        <button class="bg-gray-300 px-2 rounded decrease">-</button>
      </div>`;
    div.querySelector(".increase").onclick = () => updateCartQuantity(item.id, "increase");
    div.querySelector(".decrease").onclick = () => updateCartQuantity(item.id, "decrease");
    cartItems.appendChild(div);
  });
  cartTotal.textContent = `₹${total}`;
  saveCart();
  updateHeaderCounts();
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity++;
  else cart.push({ ...product, quantity: 1 });
  wishlist = wishlist.filter(i => i.id !== product.id);
  renderWishlist();
  renderCart();
  saveWishlist();
  showPopupMessage("✅ Added to cart!");
}

function updateCartQuantity(id, action) {
  cart = cart.map(item => {
    if (item.id === id) {
      if (action === "increase") item.quantity++;
      if (action === "decrease") item.quantity--;
    }
    return item;
  }).filter(i => i.quantity > 0);
  renderCart();
}

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
      </div>`;
    div.querySelector(".moveCart").onclick = () => addToCart(item);
    div.querySelector(".removeWishlist").onclick = () => removeFromWishlist(item.id);
    wishlistItems.appendChild(div);
  });
  saveWishlist();
  updateHeaderCounts();
}

function addToWishlist(product) {
  if (!wishlist.find(i => i.id === product.id)) {
    wishlist.push(product);
    renderWishlist();
    showPopupMessage("💖 Added to wishlist!", "bg-pink-600");
  } else {
    showPopupMessage("⚠️ Already in wishlist!", "bg-yellow-500");
  }
}

function removeFromWishlist(id) {
  wishlist = wishlist.filter(i => i.id !== id);
  renderWishlist();
}

// =======================
// LOAD PRODUCT DETAILS
// =======================
async function loadProduct() {
  try {
    let allProducts = [...products];
    const res = await fetch("/products");
    if (res.ok) {
      const data = await res.json();
      allProducts.push(...data.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        img: p.image || "public/images/placeholder.jpg",
        description: p.description || ""
      })));
    }
    const product = allProducts.find(p => p.id == productId);
    if (!product) return (window.location.href = "index.html");
    productImg.src = product.img;
    productName.textContent = product.name;
    productPrice.textContent = `₹${product.price}`;
    productDesc.textContent = product.description;
    addCartBtn.onclick = () => addToCart(product);
    addWishlistBtn.onclick = () => addToWishlist(product);
  } catch (e) {
    console.error(e);
  }
}

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  renderWishlist();
  loadProduct();
  document.getElementById("backShopBtn").onclick = () => (window.location.href = "index.html");
});
document.addEventListener("partials:loaded", updateHeaderCounts);
