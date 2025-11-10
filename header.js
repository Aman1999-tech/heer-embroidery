// ===========================================
// header.js - Global Cart, Wishlist, Checkout Logic
// ===========================================

(function () {
  if (window.__HEADER_INIT__) return;
  window.__HEADER_INIT__ = true;

  // -------------------------------
  // DOM Helpers
  // -------------------------------
  const $ = (id) => document.getElementById(id);

  const cartDrawer = $("cartDrawer");
  const wishlistDrawer = $("wishlistDrawer");
  const checkoutDrawer = $("checkoutDrawer");
  const cartItems = $("cartItems");
  const wishlistItems = $("wishlistItems");
  const cartTotal = $("cartTotal");
  const checkoutMsg = $("checkoutMsg");

  // -------------------------------
  // LocalStorage
  // -------------------------------
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));
  const saveWishlist = () => localStorage.setItem("wishlist", JSON.stringify(wishlist));

  // -------------------------------
  // Utility: Show popup messages
  // -------------------------------
  function showPopup(msg, color = "bg-green-600") {
    const popup = document.createElement("div");
    popup.textContent = msg;
    popup.className = `${color} text-white px-4 py-2 rounded shadow-lg fixed top-6 right-6 z-[9999] animate-slideIn`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
  }

  // -------------------------------
  // Update counts on header buttons
  // -------------------------------
  function updateCounts() {
    const cartQty = cart.reduce((sum, i) => sum + i.quantity, 0);
    const wishQty = wishlist.length;
    const cartCount = $("cartCount");
    const wishlistCount = $("wishlistCount");
    if (cartCount) cartCount.textContent = cartQty;
    if (wishlistCount) wishlistCount.textContent = wishQty;
  }

  // -------------------------------
  // Render Cart
  // -------------------------------
  function renderCart() {
    if (!cartItems) return;
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
      div.querySelector(".increase").onclick = () => updateQuantity(item.id, "increase");
      div.querySelector(".decrease").onclick = () => updateQuantity(item.id, "decrease");
      cartItems.appendChild(div);
    });

    cartTotal.textContent = `₹${total}`;
    saveCart();
    updateCounts();
  }

  // -------------------------------
  // Render Wishlist
  // -------------------------------
  function renderWishlist() {
    if (!wishlistItems) return;
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
    updateCounts();
  }

  // -------------------------------
  // Add / Remove Logic
  // -------------------------------
  function addToCart(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      showPopup("⚠️ Already in cart!", "bg-yellow-500");
      return;
    }
    cart.push({ ...product, quantity: 1 });
    wishlist = wishlist.filter(i => i.id !== product.id);
    saveWishlist();
    renderWishlist();
    renderCart();
    showPopup("✅ Added to cart!");
  }

  function addToWishlist(product) {
    if (wishlist.find(i => i.id === product.id)) {
      showPopup("⚠️ Already in wishlist!", "bg-yellow-500");
      return;
    }
    wishlist.push(product);
    saveWishlist();
    renderWishlist();
    showPopup("💖 Added to wishlist!", "bg-pink-600");
  }

  function removeFromWishlist(id) {
    wishlist = wishlist.filter(i => i.id !== id);
    renderWishlist();
  }

  function updateQuantity(id, action) {
    cart = cart.map(item => {
      if (item.id === id) {
        if (action === "increase") item.quantity++;
        if (action === "decrease") item.quantity--;
      }
      return item;
    }).filter(i => i.quantity > 0);
    renderCart();
  }

  // -------------------------------
  // Checkout Logic
  // -------------------------------
  async function checkout() {
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
            body: JSON.stringify({ ...response })
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
        theme: { color: "#e11d48" }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      checkoutMsg.textContent = "❌ Could not create order, please try again later.";
    }
  }

  // -------------------------------
  // Drawer Controls
  // -------------------------------
  function initDrawers() {
    const cartBtn = $("cartBtn");
    const wishlistBtn = $("wishlistBtn");
    const closeCart = document.querySelector(".closeCart");
    const closeWishlist = document.querySelector(".closeWishlist");
    const closeCheckout = document.querySelector(".closeCheckout");
    const checkoutBtn = $("checkoutBtn");

    cartBtn?.addEventListener("click", () => cartDrawer?.classList.remove("translate-x-full"));
    wishlistBtn?.addEventListener("click", () => wishlistDrawer?.classList.remove("-translate-x-full"));
    closeCart?.addEventListener("click", () => cartDrawer?.classList.add("translate-x-full"));
    closeWishlist?.addEventListener("click", () => wishlistDrawer?.classList.add("-translate-x-full"));
    closeCheckout?.addEventListener("click", () => checkoutDrawer?.classList.add("translate-x-full"));

    checkoutBtn?.addEventListener("click", () => {
      cartDrawer.classList.add("translate-x-full");
      checkoutDrawer.classList.remove("translate-x-full");
      checkout();
    });
  }

  // -------------------------------
  // Initialization
  // -------------------------------
  function init() {
    initDrawers();
    renderCart();
    renderWishlist();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // Expose globally for product/app pages
  window.Header = {
    addToCart,
    addToWishlist,
    renderCart,
    renderWishlist,
    updateCounts
  };
})();
