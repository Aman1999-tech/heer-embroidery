// =======================================
// header.js - Shared Cart, Wishlist, Checkout + Auth + Razorpay Logic
// =======================================
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(function () {
  if (window.__HEADER_INIT__) return;
  window.__HEADER_INIT__ = true;

  // =======================
  // GLOBAL STATE
  // =======================
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  let currentUser = null;

  const $ = (id) => document.getElementById(id);

  // =======================
  // AUTH UI ELEMENTS
  // =======================
  const profileBtn = $("profileBtn");
  const profileModal = $("profileModal");
  const closeProfileModal = $("closeProfileModal");
  const loginBtn = $("loginBtn");
  const signupBtn = $("signupBtn");
  const logoutBtn = $("logoutBtn");
  const userInfo = $("userInfo");
  const profileContent = $("profileContent");
  const userName = $("userName");

  const userEmail = $("userEmail");
  const userPassword = $("userPassword");

  // Header buttons
  const cartBtn = $("cartBtn");
  const wishlistBtn = $("wishlistBtn");

  // Drawers + elements
  const cartDrawer = $("cartDrawer");
  const wishlistDrawer = $("wishlistDrawer");
  const checkoutDrawer = $("checkoutDrawer");

  const cartItems = $("cartItems");
  const wishlistItems = $("wishlistItems");
  const cartTotal = $("cartTotal");
  const checkoutBtn = $("checkoutBtn");
  const checkoutForm = $("checkoutForm");
  const checkoutMsg = $("checkoutMsg");

  const closeCartBtns = document.querySelectorAll(".closeCart");
  const closeWishlistBtns = document.querySelectorAll(".closeWishlist");
  const closeCheckoutBtns = document.querySelectorAll(".closeCheckout");

  function showModal() {
    if (!profileModal) return;
    profileModal.classList.remove("hidden");
  }

  function hideModal() {
    if (!profileModal) return;
    profileModal.classList.add("hidden");
    if (userEmail) userEmail.value = "";
    if (userPassword) userPassword.value = "";
  }

  // =======================
  // LOGIN / SIGNUP
  // =======================
  async function handleSignup() {
    const email = userEmail.value.trim();
    const password = userPassword.value.trim();
    if (!email || !password) return alert("Please fill both fields.");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        email,
        name: email.split("@")[0],
        cart: [],
        wishlist: []
      });

      alert("Account created successfully!");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogin() {
    const email = userEmail.value.trim();
    const password = userPassword.value.trim();
    if (!email || !password) return alert("Please fill both fields.");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  // =======================
  // SAVE FUNCTIONS
  // =======================
  function saveLocal() {
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }

  async function saveToFirestore() {
    if (!currentUser) return;
    const ref = doc(db, "users", currentUser.uid);
    await updateDoc(ref, { cart, wishlist }).catch(() => {
      // ignore if doc doesn't exist yet
    });
  }

  function updateHeaderCounts() {
    const cartCountEl = $("cartCount");
    const wishlistCountEl = $("wishlistCount");
    if (cartCountEl) {
      cartCountEl.textContent = cart.reduce((s, i) => s + i.quantity, 0);
    }
    if (wishlistCountEl) {
      wishlistCountEl.textContent = wishlist.length;
    }
  }

  function ensureLoggedIn() {
    if (!currentUser) {
      showModal();
      alert("Please log in or create a profile first.");
      return false;
    }
    return true;
  }

  // =======================
  // DRAWER HELPERS
  // =======================
  function openCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.style.transform = "translateX(0)";
  }
  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.style.transform = "translateX(100%)";
  }

  function openWishlistDrawer() {
    if (!wishlistDrawer) return;
    wishlistDrawer.style.transform = "translateX(0)";
  }
  function closeWishlistDrawer() {
    if (!wishlistDrawer) return;
    wishlistDrawer.style.transform = "translateX(-100%)";
  }

  function openCheckoutDrawer() {
    if (!checkoutDrawer) return;
    checkoutDrawer.style.transform = "translateX(0)";
  }
  function closeCheckoutDrawer() {
    if (!checkoutDrawer) return;
    checkoutDrawer.style.transform = "translateX(100%)";
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

      const row = document.createElement("div");
      row.className = "flex justify-between items-center mb-3 border-b pb-2";

      row.innerHTML = `
        <img src="${item.img}" class="w-16 h-16 rounded object-cover">
        <div class="flex-1 ml-2">
          <p class="font-semibold">${item.name}</p>
          <p class="text-sm">₹${item.price} × ${item.quantity}</p>
        </div>

        <div class="flex flex-col items-center gap-1">
          <button class="increase bg-gray-300 px-2 rounded">+</button>
          <span>${item.quantity}</span>
          <button class="decrease bg-gray-300 px-2 rounded">-</button>
        </div>
      `;

      row.querySelector(".increase").onclick = () => updateCartQty(item.id, "inc");
      row.querySelector(".decrease").onclick = () => updateCartQty(item.id, "dec");

      cartItems.appendChild(row);
    });

    if (cartTotal) {
      cartTotal.textContent = "₹" + total;
    }

    saveLocal();
    saveToFirestore();
    updateHeaderCounts();
  }

  function updateCartQty(id, type) {
    cart = cart
      .map(item => {
        if (item.id === id) {
          if (type === "inc") item.quantity++;
          if (type === "dec") item.quantity--;
        }
        return item;
      })
      .filter(i => i.quantity > 0);

    renderCart();
  }

  function addToCart(product) {
    if (!ensureLoggedIn()) return;

    const item = cart.find(i => i.id === product.id);
    if (item) item.quantity++;
    else cart.push({ ...product, quantity: 1 });

    // Remove from wishlist if present
    wishlist = wishlist.filter(i => i.id !== product.id);

    renderWishlist();
    renderCart();
    openCartDrawer();
  }

  // =======================
  // WISHLIST FUNCTIONS
  // =======================
  function renderWishlist() {
    if (!wishlistItems) return;

    wishlistItems.innerHTML = "";

    wishlist.forEach(item => {
      const row = document.createElement("div");
      row.className = "flex justify-between items-center mb-3 border-b pb-2";

      row.innerHTML = `
        <img src="${item.img}" class="w-16 h-16 rounded object-cover">
        <div class="flex-1 ml-2">
          <p class="font-semibold">${item.name}</p>
          <p class="text-sm text-gray-600">₹${item.price}</p>
        </div>

        <div class="flex flex-col gap-1">
          <button class="moveCart bg-green-600 text-white px-2 rounded">Move</button>
          <button class="removeWishlist bg-red-500 text-white px-2 rounded">Remove</button>
        </div>
      `;

      row.querySelector(".moveCart").onclick = () => addToCart(item);
      row.querySelector(".removeWishlist").onclick = () => removeFromWishlist(item.id);

      wishlistItems.appendChild(row);
    });

    saveLocal();
    saveToFirestore();
    updateHeaderCounts();
  }

  function removeFromWishlist(id) {
    wishlist = wishlist.filter(i => i.id !== id);
    renderWishlist();
  }

  function addToWishlist(product) {
    if (!ensureLoggedIn()) return;

    if (!wishlist.find(i => i.id === product.id)) {
      wishlist.push(product);
    }

    renderWishlist();
    openWishlistDrawer();
  }

  // =======================
  // RAZORPAY HELPERS
  // =======================
  function getCartTotalAmount() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async function createRazorpayOrder(amountInPaise) {
    const resp = await fetch("/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR"
      })
    });

    if (!resp.ok) {
      throw new Error("Failed to create order");
    }

    // ⚠️ Assumption:
    // Backend returns: { key, orderId, amount, currency }
    // Adjust here if your backend returns a slightly different JSON.
    return await resp.json();
  }

  async function saveOrderToFirestore(orderData) {
    try {
      await addDoc(collection(db, "orders"), orderData);
    } catch (e) {
      console.error("Error saving order:", e);
    }
  }

  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    if (!ensureLoggedIn()) return;
    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    if (!checkoutMsg) return;

    const name = $("custName")?.value.trim();
    const email = $("custEmail")?.value.trim();
    const phone = $("custPhone")?.value.trim();
    const address = $("custAddress")?.value.trim();

    if (!name || !email || !phone || !address) {
      checkoutMsg.textContent = "Please fill all details.";
      checkoutMsg.classList.remove("text-green-600");
      checkoutMsg.classList.add("text-red-600");
      return;
    }

    const total = getCartTotalAmount(); // in ₹
    if (total <= 0) {
      checkoutMsg.textContent = "Invalid cart total.";
      checkoutMsg.classList.remove("text-green-600");
      checkoutMsg.classList.add("text-red-600");
      return;
    }

    if (typeof Razorpay === "undefined") {
      alert("Payment system not loaded. Please refresh and try again.");
      return;
    }

    checkoutMsg.textContent = "Creating order, please wait...";
    checkoutMsg.classList.remove("text-red-600");
    checkoutMsg.classList.add("text-gray-600");

    try {
      const amountInPaise = total * 100;
      const data = await createRazorpayOrder(amountInPaise);

      const options = {
        key: data.key, // from backend
        amount: data.amount, // in paise
        currency: data.currency || "INR",
        name: "Heer Embroidery",
        description: "Order Payment",
        order_id: data.orderId,
        prefill: {
          name,
          email,
          contact: phone
        },
        notes: {
          address
        },
        theme: {
          color: "#ec4899"
        },
        handler: async function (response) {
          checkoutMsg.textContent = "Payment successful! Saving order...";
          checkoutMsg.classList.remove("text-red-600");
          checkoutMsg.classList.add("text-green-600");

          const orderPayload = {
            userId: currentUser ? currentUser.uid : null,
            customer: { name, email, phone, address },
            cart,
            total,
            currency: "INR",
            razorpay: {
              orderId: data.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            },
            createdAt: new Date().toISOString()
          };

          await saveOrderToFirestore(orderPayload);

          // Clear cart
          cart = [];
          saveLocal();
          renderCart();

          // Close drawers after short delay
          setTimeout(() => {
            closeCheckoutDrawer();
            closeCartDrawer();
            checkoutMsg.textContent = "";
            checkoutForm.reset();
          }, 1200);
        }
      };

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        console.error("Payment failed:", resp.error);
        checkoutMsg.textContent = "Payment failed. Please try again.";
        checkoutMsg.classList.remove("text-green-600");
        checkoutMsg.classList.add("text-red-600");
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      checkoutMsg.textContent = "Failed to start payment. Please try again.";
      checkoutMsg.classList.remove("text-green-600");
      checkoutMsg.classList.add("text-red-600");
    }
  }

  // =======================
  // AUTH STATE
  // =======================
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
      if (userInfo) userInfo.classList.remove("hidden");
      if (profileContent) profileContent.classList.add("hidden");
      if (userName) userName.textContent = user.email.split("@")[0];
      hideModal();

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        cart = snap.data().cart || [];
        wishlist = snap.data().wishlist || [];
      }

      renderCart();
      renderWishlist();
      updateHeaderCounts();

    } else {
      if (userInfo) userInfo.classList.add("hidden");
      if (profileContent) profileContent.classList.remove("hidden");
    }
  });

  // =======================
  // INIT FUNCTION
  // =======================
  function initHeader() {
    if (profileBtn) profileBtn.onclick = showModal;
    if (closeProfileModal) closeProfileModal.onclick = hideModal;
    if (loginBtn) loginBtn.onclick = handleLogin;
    if (signupBtn) signupBtn.onclick = handleSignup;
    if (logoutBtn) logoutBtn.onclick = handleLogout;

    if (cartBtn) {
      cartBtn.onclick = () => {
        openCartDrawer();
      };
    }
    if (wishlistBtn) {
      wishlistBtn.onclick = () => {
        openWishlistDrawer();
      };
    }

    closeCartBtns.forEach(btn => btn.addEventListener("click", closeCartDrawer));
    closeWishlistBtns.forEach(btn => btn.addEventListener("click", closeWishlistDrawer));
    closeCheckoutBtns.forEach(btn => btn.addEventListener("click", closeCheckoutDrawer));

    if (checkoutBtn) {
      checkoutBtn.onclick = () => {
        if (!cart.length) {
          alert("Your cart is empty.");
          return;
        }
        openCheckoutDrawer();
      };
    }

    if (checkoutForm) {
      checkoutForm.addEventListener("submit", handleCheckoutSubmit);
    }

    // initial render from local storage
    renderCart();
    renderWishlist();
    updateHeaderCounts();

    // 🔔 Tell other scripts (if needed) that Header is ready
    document.dispatchEvent(new Event("header:ready"));
  }

  // Run init now (or after DOM ready if needed)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeader);
  } else {
    initHeader();
  }

  // Expose global functions for other scripts
  window.Header = {
    addToCart,
    addToWishlist,
    updateCounts: updateHeaderCounts
  };
})();
