// =======================
// PRODUCTS DATA
// =======================
let products = [
  { id: 1, name: "Handmade Embroidery", price: 1200, category: "Embroidery", img: "public/images/embroidery1.jpg", description: "Beautiful handmade embroidery work." },
  { id: 2, name: "Custom Bouquet", price: 800, category: "Bouquet", img: "public/images/bouquet1.jpg", description: "Fresh customized flower bouquet." },
  { id: 3, name: "Gift Box", price: 500, category: "Gifts", img: "public/images/gift1.jpg", description: "Lovely gift box for special occasions." }
];

// =======================
// LOAD ADMIN PRODUCTS
// =======================
async function loadAdminProducts() {
  try {
    const res = await fetch("/products");
    const adminProducts = await res.json();
    adminProducts.forEach(p => {
      if (!products.find(prod => prod.id === p.id)) {
        products.push({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          img: p.image || "public/images/placeholder.jpg",
          description: p.description || ""
        });
      }
    });
    renderProducts(currentFilter || "All");
    renderFilterButtons();
  } catch (err) {
    console.error("Error loading admin products:", err);
  }
}

// =======================
// CART & WISHLIST STORAGE
// =======================
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }

// =======================
// RENDER PRODUCTS
// =======================
const productGrid = document.getElementById("productGrid");
let currentFilter = "All";

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
      
      // ✅ Go to product detail page
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

// =======================
// CART FUNCTIONS
// =======================
const cartDrawer = document.getElementById("cartDrawer");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");

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
  wishlist = wishlist.filter(i=>i.id!==product.id);
  saveWishlist();
  renderWishlist();
  renderCart();
}

function updateCartQuantity(id, action) {
  cart = cart.map(item=>{
    if(item.id===id){
      if(action==="increase") item.quantity++;
      if(action==="decrease") item.quantity--;
    }
    return item;
  }).filter(i=>i.quantity>0);
  renderCart();
}

// =======================
// WISHLIST FUNCTIONS
// =======================
const wishlistDrawer = document.getElementById("wishlistDrawer");
const wishlistItems = document.getElementById("wishlistItems");
const wishlistCount = document.getElementById("wishlistCount");

function renderWishlist() {
  wishlistItems.innerHTML = "";
  wishlist.forEach(item=>{
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
    div.querySelector(".moveCart").addEventListener("click", ()=>addToCart(item));
    div.querySelector(".removeWishlist").addEventListener("click", ()=>removeFromWishlist(item.id));
    wishlistItems.appendChild(div);
  });
  wishlistCount.textContent = wishlist.length;
  saveWishlist();
}

function addToWishlist(product){
  if(!wishlist.find(i=>i.id===product.id)) wishlist.push(product);
  renderWishlist();
}

function removeFromWishlist(id){
  wishlist = wishlist.filter(i=>i.id!==id);
  renderWishlist();
}

// =======================
// DRAWER TOGGLES
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const cartBtn = document.getElementById("cartBtn");
  const wishlistBtn = document.getElementById("wishlistBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const cartDrawer = document.getElementById("cartDrawer");
  const wishlistDrawer = document.getElementById("wishlistDrawer");
  const checkoutDrawer = document.getElementById("checkoutDrawer");

  const closeCartBtn = document.querySelector(".closeCart");
  const closeWishlistBtn = document.querySelector(".closeWishlist");
  const closeCheckoutBtn = document.querySelector(".closeCheckout");

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

  // Checkout from Cart
  checkoutBtn.addEventListener("click", () => {
    cartDrawer.classList.add("translate-x-full");
    checkoutDrawer.classList.remove("translate-x-full");
  });

  // Close Checkout
  closeCheckoutBtn.addEventListener("click", () => {
    checkoutDrawer.classList.add("translate-x-full");
  });
});

// =======================
// INITIAL LOAD
// =======================
document.addEventListener("DOMContentLoaded", ()=>{
  renderCart();
  renderWishlist();
  renderFilterButtons();
  renderProducts();
  loadAdminProducts();
});
