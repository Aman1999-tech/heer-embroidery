// =======================================
// header.js - Shared Cart, Wishlist, Checkout Logic
// =======================================
(function () {
  if (window.__HEADER_INIT__) return;
  window.__HEADER_INIT__ = true;

  // =======================
  // GLOBAL STATE
  // =======================
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  // =======================
  // DOM HELPERS
  // =======================
  const $ = (id) => document.getElementById(id);

  const cartDrawer = $("cartDrawer");
  const wishlistDrawer = $("wishlistDrawer");
  const checkoutDrawer = $("checkoutDrawer");
  const cartItems = $("cartItems");
  const wishlistItems = $("wishlistItems");
  const cartTotal = $("cartTotal");
  const checkoutForm = $("checkoutForm");
  const checkoutMsg = $("checkoutMsg");

  // =======================
  // STORAGE HELPERS
  // =======================
  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  function saveWishlist() {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }

  // =======================
  // HEADER BADGE COUNTS
  // =======================
  function updateHeaderCounts() {
    const cartQty = cart.reduce((sum, i) => sum + i.quantity, 0);
    const wishQty = wishlist.length;
    setCartCount(cartQty);
    setWishlistCount(wishQty);
  }

  function setCartCount(n) {
    const el = $("cartCount");
    if (el) el.textContent = String(n || 0);
  }
  function setWishlistCount(n) {
    const el = $("wishlistCount");
    if (el) el.textContent = String(n || 0);
  }

  // =======================
  // CART FUNCTIONS
  // =======================
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
        </div>
      `;
      div.querySelector(".increase").addEventListener("click", () => updateCartQuantity(item.id, "increase"));
      div.querySelector(".decrease").addEventListener("click", () => updateCartQuantity(item.id, "decrease"));
      cartItems.appendChild(div);
    });

    if (cartTotal) cartTotal.textContent = `₹${total}`;
    saveCart();
    updateHeaderCounts();
  }

  function addToCart(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });

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
  // CHECKOUT FUNCTIONS
  // =======================
  function openCheckout() {
    if (cartDrawer && checkoutDrawer) {
      cartDrawer.classList.add("translate-x-full");
      checkoutDrawer.classList.remove("translate-x-full");
    }
  }

  function closeCheckout() {
    if (checkoutDrawer) checkoutDrawer.classList.add("translate-x-full");
  }

  async function handleCheckout(e) {
    e.preventDefault();

    const orderData = {
      name: $("custName")?.value,
      email: $("custEmail")?.value,
      phone: $("custPhone")?.value,
      address: $("custAddress")?.value,
      items: cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price }))
    };

    const amount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    if (amount <= 0) {
      if (checkoutMsg) checkoutMsg.textContent = "⚠️ Cart is empty!";
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
            if (checkoutMsg) checkoutMsg.textContent = "✅ Payment successful! Thank you.";
            cart = [];
            renderCart();
          } else {
            if (checkoutMsg) checkoutMsg.textContent = "❌ Payment verification failed.";
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
      if (checkoutMsg) checkoutMsg.textContent = "❌ Could not create order, please try again later.";
    }
  }

  // =======================
  // INIT
  // =======================
  function init() {
    // Drawer controls
    const cartBtn = $("cartBtn");
    const wishlistBtn = $("wishlistBtn");
    const closeCartBtn = document.querySelector(".closeCart");
    const closeWishlistBtn = document.querySelector(".closeWishlist");
    const checkoutBtn = $("checkoutBtn");
    const closeCheckoutBtn = document.querySelector(".closeCheckout");

    cartBtn?.addEventListener("click", () => cartDrawer?.classList.remove("translate-x-full"));
    wishlistBtn?.addEventListener("click", () => wishlistDrawer?.classList.remove("-translate-x-full"));
    closeCartBtn?.addEventListener("click", () => cartDrawer?.classList.add("translate-x-full"));
    closeWishlistBtn?.addEventListener("click", () => wishlistDrawer?.classList.add("-translate-x-full"));

    checkoutBtn?.addEventListener("click", openCheckout);
    closeCheckoutBtn?.addEventListener("click", closeCheckout);

    if (checkoutForm) checkoutForm.addEventListener("submit", handleCheckout);

    renderCart();
    renderWishlist();
    updateHeaderCounts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // =======================
  // EXPOSE GLOBAL API
  // =======================
  window.Header = {
    addToCart,
    addToWishlist,
    renderCart,
    renderWishlist,
    updateCounts: updateHeaderCounts,
    setCartCount,
    setWishlistCount
  };
})();
