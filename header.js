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
  getDoc
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
  // CART / WISHLIST (as before)
  // =======================
  const cartDrawer = $("cartDrawer");
  const wishlistDrawer = $("wishlistDrawer");
  const checkoutDrawer = $("checkoutDrawer");
  const cartItems = $("cartItems");
  const wishlistItems = $("wishlistItems");
  const cartTotal = $("cartTotal");

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  function saveWishlist() {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }

  function updateHeaderCounts() {
    const cartQty = cart.reduce((sum, i) => sum + i.quantity, 0);
    const wishQty = wishlist.length;
    $("cartCount").textContent = cartQty;
    $("wishlistCount").textContent = wishQty;
  }

  function ensureLoggedIn() {
    if (!currentUser) {
      showModal();
      alert("Please log in or create a profile first.");
      return false;
    }
    return true;
  }

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
      div.querySelector(".increase").onclick = () => updateCartQuantity(item.id, "increase");
      div.querySelector(".decrease").onclick = () => updateCartQuantity(item.id, "decrease");
      cartItems.appendChild(div);
    });

    cartTotal.textContent = `₹${total}`;
    saveCart();
    updateHeaderCounts();
  }

  function addToCart(product) {
    if (!ensureLoggedIn()) return;
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
      div.querySelector(".moveCart").onclick = () => addToCart(item);
      div.querySelector(".removeWishlist").onclick = () => removeFromWishlist(item.id);
      wishlistItems.appendChild(div);
    });
    saveWishlist();
    updateHeaderCounts();
  }

  function addToWishlist(product) {
    if (!ensureLoggedIn()) return;
    if (!wishlist.find(i => i.id === product.id)) wishlist.push(product);
    renderWishlist();
  }

  function removeFromWishlist(id) {
    wishlist = wishlist.filter(i => i.id !== id);
    renderWishlist();
  }

  // =======================
  // INIT & AUTH STATE
  // =======================
  function init() {
    profileBtn.onclick = showModal;
    closeProfileModal.onclick = hideModal;
    loginBtn.onclick = handleLogin;
    signupBtn.onclick = handleSignup;
    logoutBtn.onclick = handleLogout;

    onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      if (user) {
        userInfo.classList.remove("hidden");
        profileContent.classList.add("hidden");
        userName.textContent = user.email.split("@")[0];
        hideModal();
        // Load user data from Firestore
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          cart = data.cart || [];
          wishlist = data.wishlist || [];
          renderCart();
          renderWishlist();
        }
      } else {
        userInfo.classList.add("hidden");
        profileContent.classList.remove("hidden");
      }
    });

    renderCart();
    renderWishlist();
    updateHeaderCounts();
  }

  document.addEventListener("DOMContentLoaded", init);

  window.Header = { addToCart, addToWishlist };
})();
