// =======================================
// header.js - Shared Cart, Wishlist, Checkout + Auth Logic
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
  updateDoc
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
  // AUTH UI
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

  function showModal() {
    profileModal.classList.remove("hidden");
  }

  function hideModal() {
    profileModal.classList.add("hidden");
    userEmail.value = "";
    userPassword.value = "";
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
    $("cartCount").textContent = cart.reduce((s, i) => s + i.quantity, 0);
    $("wishlistCount").textContent = wishlist.length;
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
  // CART FUNCTIONS
  // =======================
  const cartItems = $("cartItems");
  const wishlistItems = $("wishlistItems");
  const cartTotal = $("cartTotal");

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

    cartTotal.textContent = "₹" + total;
    saveLocal();
    saveToFirestore();
    updateHeaderCounts();
  }

  function updateCartQty(id, type) {
    cart = cart.map(item => {
      if (item.id === id) {
        if (type === "inc") item.quantity++;
        if (type === "dec") item.quantity--;
      }
      return item;
    }).filter(i => i.quantity > 0);

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
  }

  // =======================
  // AUTH STATE
  // =======================
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
      userInfo.classList.remove("hidden");
      profileContent.classList.add("hidden");
      userName.textContent = user.email.split("@")[0];
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
      userInfo.classList.add("hidden");
      profileContent.classList.remove("hidden");
    }
  });

  // =======================
  // INIT FUNCTION (run immediately)
// =======================
  function initHeader() {
    if (!profileBtn) return; // safety

    profileBtn.onclick = showModal;
    closeProfileModal.onclick = hideModal;
    loginBtn.onclick = handleLogin;
    signupBtn.onclick = handleSignup;
    logoutBtn.onclick = handleLogout;

    renderCart();
    renderWishlist();
    updateHeaderCounts();

    // 🔔 Tell other scripts (product.js) that Header is ready
    document.dispatchEvent(new Event("header:ready"));
  }

  // Run init now (or after DOM ready if needed)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeader);
  } else {
    initHeader();
  }

  // Expose global functions for other scripts
  window.Header = { addToCart, addToWishlist };
})();
