// app.js

// =======================
// GLOBAL ARRAYS
// =======================
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let currentFilter = "All";

// =======================
// DOM ELEMENTS
// =======================
const productGrid = document.getElementById("productGrid");
const cartDrawer = document.getElementById("cartDrawer");
const wishlistDrawer = document.getElementById("wishlistDrawer");
const checkoutDrawer = document.getElementById("checkoutDrawer");
const cartItems = document.getElementById("cartItems");
const wishlistItems = document.getElementById("wishlistItems");
const cartTotal = document.getElementById("cartTotal");

// =======================
// STORAGE HELPERS
// =======================
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }

// =======================
// HEADER BADGE UPDATES
// =======================
function updateHeaderCounts() {
  const cartQty = cart.reduce((sum, i) => sum + i.quantity, 0);
  const wishQty = wishlist.length;
  window.Header?.setCartCount(cartQty);
  window.Header?.setWishlistCount(wishQty);
}

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
        <p class="text-sm text-gray-600">₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</p>
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
  cartTotal.textContent = `₹${total}`;
  saveCart();
  updateHeaderCounts();
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity++;
  else cart.push({ ...product, quantity: 1 });

  // If also in wishlist, remove it
  wishlist = wishlist.filter(i => i.id !== product.id);
  saveWishlist();
  renderWishlist();
  renderCart();
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
  saveWishlist();
  updateHeaderCounts();
}

function addToWishlist(product) {
  if (!wishlist.find(i => i.id === product.id)) wishlist.push(product);
  renderWishlist();
}

function removeFromWishlist(id) {
  wishlist = wishlist.filter(i => i.id !== id);
  renderWishlist();
}

// =======================
// RENDER PRODUCTS
// =======================
function renderProducts(filter = "All") {
  currentFilter = filter;
  productGrid.innerHTML = "";

  const filtered = filter === "All" ? products : products.filter((p) => p.category === filter);
  if (!filtered.length) {
    productGrid.innerHTML = `<p class="col-span-3 text-center text-gray-500">No products available</p>`;
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "glass rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-lg transition cursor-pointer";
    card.innerHTML = `
      <img src="${product.img}" alt="${product.name}" class="w-40 h-40 object-cover rounded-lg mb-3">
      <h3 class="font-semibold">${product.name}</h3>
      <p class="text-pink-600 font-bold">₹${product.price}</p>
    `;
    card.addEventListener("click", () => window.location.href = `product.html?id=${product.id}`);
    productGrid.appendChild(card);
  });
}

// =======================
// FILTER BUTTONS
// =======================
function renderFilterButtons() {
  const container = document.querySelector(".filter-btns-container");
  if (!container) return;
  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];
  container.innerHTML = "";
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = `filter-btn glass px-3 py-1 rounded ${cat === "All" ? "bg-pink-600 text-white" : ""}`;
    btn.dataset.cat = cat;
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
async function loadAdminProducts() {
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
    console.error("Error loading admin products:", err);
  }
}

// =======================
// DOMContentLoaded
// =======================
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  renderWishlist();
  loadAdminProducts();

  // Checkout drawer only (cart/wishlist handled by header.js)
  const checkoutBtn = document.getElementById("checkoutBtn");
  const closeCheckoutBtn = document.querySelector(".closeCheckout");
  checkoutBtn?.addEventListener("click", () => {
    cartDrawer.classList.add("translate-x-full");
    checkoutDrawer.classList.remove("translate-x-full");
  });
  closeCheckoutBtn?.addEventListener("click", () => checkoutDrawer.classList.add("translate-x-full"));

  // Checkout form + Razorpay
  const checkoutForm = document.getElementById("checkoutForm");
  const checkoutMsg = document.getElementById("checkoutMsg");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const orderData = {
        name: document.getElementById("custName").value,
        email: document.getElementById("custEmail").value,
        phone: document.getElementById("custPhone").value,
        address: document.getElementById("custAddress").value,
        items: cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price }))
      };
      const amount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      if (amount <= 0) {
        checkoutMsg.textContent = "⚠️ Cart is empty!";
        return;
      }

      try {
        const res = await fetch("/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount })
        });
        const order = await res.json();
        if (!order.id) throw new Error("Order not created");

        const options = {
          key: order.key,
          amount: order.amount,
          currency: "INR",
          name: "Heer Embroidery",
          description: "Order Payment",
          order_id: order.id,
          handler: async function (response) {
            const verifyRes = await fetch("/verify-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, orderData })
            });
            const verifyJson = await verifyRes.json();
            if (verifyJson.success) {
              checkoutMsg.textContent = "✅ Payment successful! Thank you.";
              cart = [];
              renderCart();
            } else {
              checkoutMsg.textContent = "❌ Payment verification failed.";
            }
          },
          prefill: {
            name: orderData.name,
            email: orderData.email,
            contact: orderData.phone
          },
          theme: { color: "#e11d48" }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error(err);
        checkoutMsg.textContent = "❌ Could not create order, please try again later.";
      }
    });
  }
});

// If header/footer load after app.js, sync counts again
document.addEventListener('partials:loaded', updateHeaderCounts);