// =======================
// GET PRODUCT ID FROM URL
// =======================
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id"); // keep as string to match Firebase IDs

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

const backShopBtn = document.getElementById("backShopBtn");

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
    if(item.id === id){
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

  cartBtn.addEventListener("click", () => cartDrawer.classList.remove("translate-x-full"));
  closeCartBtn.addEventListener("click", () => cartDrawer.classList.add("translate-x-full"));
  wishlistBtn.addEventListener("click", () => wishlistDrawer.classList.remove("-translate-x-full"));
  closeWishlistBtn.addEventListener("click", () => wishlistDrawer.classList.add("-translate-x-full"));
});

// =======================
// LOAD PRODUCT (HARDCODE + FIREBASE)
// =======================
async function loadProduct() {
  let allProducts = [...products]; // start with hardcoded products

  // Fetch Firebase / server products
  try {
    const res = await fetch("/products");
    if (res.ok) {
      const firebaseProducts = await res.json();
      allProducts = allProducts.concat(firebaseProducts);
    }
  } catch (err) {
    console.error("Failed to load products from server:", err);
  }

  // Find the product by id
  const product = allProducts.find(p => p.id == productId); // == allows string/number match
  if (!product) {
    alert("Product not found");
    window.location.href = "index.html";
    return;
  }

  // Load product details
  productImg.src = product.img;
  productImg.alt = product.name;
  productName.textContent = product.name;
  productPrice.textContent = `₹${product.price}`;
  productDesc.textContent = product.description;

  addCartBtn.onclick = () => addToCart(product);
  addWishlistBtn.onclick = () => addToWishlist(product);
}

// =======================
// BACK TO SHOP BUTTON
// =======================
backShopBtn.addEventListener("click", () => window.location.href = "index.html");

// =======================
// INITIAL LOAD
// =======================
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  renderWishlist();
  loadProduct();
});
