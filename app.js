// =======================
// App (index) - improved
// =======================

// Start with empty products; will be loaded from backend
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let currentFilter = "All";

// DOM elements
const productGrid = document.getElementById("productGrid");
const cartDrawer = document.getElementById("cartDrawer");
const wishlistDrawer = document.getElementById("wishlistDrawer");
const checkoutDrawer = document.getElementById("checkoutDrawer");
const cartItems = document.getElementById("cartItems");
const wishlistItems = document.getElementById("wishlistItems");
const cartCount = document.getElementById("cartCount");
const wishlistCount = document.getElementById("wishlistCount");
const cartTotal = document.getElementById("cartTotal");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const adminTokenIndicator = document.getElementById("adminTokenIndicator");
const tokenStatus = document.getElementById("tokenStatus");
const logoutToken = document.getElementById("logoutToken");

// Storage helpers
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }

// Toast helper
function showToast(message, type="success") {
  const color = type === "success" ? "bg-green-600" : (type === "warn" ? "bg-yellow-500" : "bg-red-600");
  const toast = document.createElement("div");
  toast.className = `${color} text-white px-4 py-2 rounded shadow-lg fixed top-6 right-6 z-[9999]`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity .4s, transform .4s";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 400);
  }, 1400);
}

// CART FUNCTIONS
function renderCart() {
  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    const div = document.createElement("div");
    div.className = "flex justify-between items-center mb-3 border-b pb-2";
    div.innerHTML = `
      <img src="${item.img}" class="w-16 h-16 object-cover rounded mr-2" loading="lazy">
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
  else cart.push({ ...product, quantity: 1 });
  wishlist = wishlist.filter(i => i.id !== product.id);
  saveWishlist();
  renderWishlist();
  renderCart();
  showToast("✅ Added to cart");
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

// WISHLIST FUNCTIONS
function renderWishlist() {
  wishlistItems.innerHTML = "";
  wishlist.forEach(item => {
    const div = document.createElement("div");
    div.className = "flex justify-between items-center mb-3 border-b pb-2";
    div.innerHTML = `
      <img src="${item.img}" class="w-16 h-16 object-cover rounded mr-2" loading="lazy">
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

function addToWishlist(product) {
  if (!wishlist.find(i => i.id === product.id)) {
    wishlist.push(product);
    renderWishlist();
    showToast("💖 Added to wishlist", "success");
  } else showToast("⚠️ Already in wishlist", "warn");
}
function removeFromWishlist(id) {
  wishlist = wishlist.filter(i => i.id !== id);
  renderWishlist();
}

// PRODUCTS UI
function renderProducts(filter = "All") {
  currentFilter = filter;
  productGrid.innerHTML = "";

  const filtered = products.filter(p => filter === "All" || p.category === filter);
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "col-span-full text-center text-gray-600";
    empty.innerHTML = `<p class="text-lg font-medium">No products available${filter !== "All" ? ` in "${filter}"` : ""}.</p><p class="text-sm mt-2">Check back soon or contact the shop.</p>`;
    productGrid.appendChild(empty);
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement("div");
    card.className = "glass rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition";
    card.innerHTML = `
      <img src="${product.img}" alt="${product.name}" class="w-full h-48 object-cover rounded-lg mb-3" loading="lazy">
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
  const categories = ["All", ...new Set(products.map(p => p.category || "Uncategorized"))];
  container.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `filter-btn glass px-3 py-1 rounded ${cat === currentFilter ? 'bg-pink-600 text-white' : ''}`;
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      renderProducts(cat);
      // update active style
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('bg-pink-600','text-white'));
      btn.classList.add('bg-pink-600','text-white');
    });
    container.appendChild(btn);
  });
}

// LOAD ADMIN PRODUCTS (from backend)
async function loadAdminProducts() {
  productGrid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">Loading products...</div>`;
  try {
    const res = await fetch("/products");
    if (!res.ok) throw new Error('Failed to fetch products');
    const adminProducts = await res.json();
    products = []; // replace local array with backend data
    adminProducts.forEach(p => {
      products.push({
        id: p.id || p._id || p.productId,
        name: p.name,
        price: Number(p.price) || 0,
        category: p.category || "Uncategorized",
        img: p.image || "public/images/placeholder.jpg",
        description: p.description || ""
      });
    });
    renderProducts(currentFilter);
    renderFilterButtons();
  } catch (err) {
    productGrid.innerHTML = `<div class="col-span-full text-center py-12 text-red-500">Unable to load products. Please try again later.</div>`;
    console.error("Error loading admin products:", err);
  }
}

// DRAWER & BACKDROP handling
function openDrawer(drawerEl) {
  drawerEl.classList.remove("translate-x-full", "-translate-x-full");
  drawerBackdrop.classList.add("visible");
}
function closeDrawer(drawerEl) {
  if (drawerEl.classList.contains("translate-x-full")) drawerEl.classList.add("translate-x-full");
  if (drawerEl.classList.contains("-translate-x-full")) drawerEl.classList.add("-translate-x-full");
  drawerBackdrop.classList.remove("visible");
}

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  renderWishlist();
  renderFilterButtons();
  renderProducts();
  loadAdminProducts();

  // Drawer toggles
  const cartBtn = document.getElementById("cartBtn");
  const wishlistBtn = document.getElementById("wishlistBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const closeCartBtn = document.querySelector(".closeCart");
  const closeWishlistBtn = document.querySelector(".closeWishlist");
  const closeCheckoutBtn = document.querySelector(".closeCheckout");

  cartBtn.addEventListener("click", () => openDrawer(cartDrawer));
  closeCartBtn.addEventListener("click", () => closeDrawer(cartDrawer));

  wishlistBtn.addEventListener("click", () => openDrawer(wishlistDrawer));
  closeWishlistBtn.addEventListener("click", () => closeDrawer(wishlistDrawer));

  checkoutBtn.addEventListener("click", () => {
    closeDrawer(cartDrawer);
    openDrawer(checkoutDrawer);
  });
  closeCheckoutBtn.addEventListener("click", () => closeDrawer(checkoutDrawer));

  // backdrop click closes drawers
  drawerBackdrop.addEventListener("click", () => {
    closeDrawer(cartDrawer);
    closeDrawer(wishlistDrawer);
    closeDrawer(checkoutDrawer);
  });

  // Checkout form
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
          handler: async function(response) {
            const verifyRes = await fetch("/verify-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, orderData })
            });
            const verifyJson = await verifyRes.json();
            if (verifyJson.success) {
              checkoutMsg.textContent = "✅ Payment successful! Thank you.";
              showToast("✅ Payment successful!");
              cart = [];
              renderCart();
              closeDrawer(checkoutDrawer);
            } else {
              checkoutMsg.textContent = "❌ Payment verification failed.";
              showToast("❌ Payment verification failed.", "error");
            }
          },
          prefill: { name: orderData.name, email: orderData.email, contact: orderData.phone },
          theme: { color: "#e11d48" }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error(err);
        checkoutMsg.textContent = "❌ Could not create order, please try again later.";
        showToast("❌ Could not create order", "error");
      }
    });
  }

  // Admin token indicator (if token stored)
  const token = localStorage.getItem("adminToken");
  if (token) {
    adminTokenIndicator.classList.remove("hidden");
    tokenStatus.textContent = "active";
  }
  logoutToken.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    adminTokenIndicator.classList.add("hidden");
    tokenStatus.textContent = "—";
    showToast("Token cleared", "warn");
  });
});
