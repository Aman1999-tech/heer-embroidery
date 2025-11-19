// ======================================================
// header.js — Global Cart + Wishlist + Auth + Firestore Sync
// ======================================================
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

  // ------------------------------------------------------
  // GLOBAL STATE
  // ------------------------------------------------------
  let currentUser = null;
  let cart = [];
  let wishlist = [];

  const $ = (id) => document.getElementById(id);

  // UI Elements
  const cartItems = $("cartItems");
  const wishlistItems = $("wishlistItems");
  const cartTotal = $("cartTotal");

  // ------------------------------------------------------
  // FIRESTORE HELPERS
  // ------------------------------------------------------
  async function saveCartToFirestore() {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), { cart });
  }

  async function saveWishlistToFirestore() {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), { wishlist });
  }

  async function loadUserData() {
    if (!currentUser) return;

    const ref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      cart = data.cart || [];
      wishlist = data.wishlist || [];
    }
  }

  // ------------------------------------------------------
  // UPDATE HEADER COUNTS
  // ------------------------------------------------------
  function updateCounts() {
    $("cartCount").textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
    $("wishlistCount").textContent = wishlist.length;
  }

  // ------------------------------------------------------
  // CART RENDER
  // ------------------------------------------------------
  function renderCart() {
    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
      total += item.quantity * item.price;

      const div = document.createElement("div");
      div.className = "flex justify-between items-center mb-3 border-b pb-2";

      div.innerHTML = `
        <img src="${item.img}" class="w-16 h-16 object-cover rounded mr-2">
        <div class="flex-1 ml-2">
          <p class="font-semibold">${item.name}</p>
          <p class="text-sm text-gray-600">
            ₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}
          </p>
        </div>

        <div class="flex flex-col items-center gap-1">
          <button class="increase bg-gray-300 px-2 rounded">+</button>
          <span>${item.quantity}</span>
          <button class="decrease bg-gray-300 px-2 rounded">-</button>
        </div>
      `;

      div.querySelector(".increase").onclick = () => changeQuantity(item.id, "inc");
      div.querySelector(".decrease").onclick = () => changeQuantity(item.id, "dec");

      cartItems.appendChild(div);
    });

    cartTotal.textContent = "₹" + total;

    updateCounts();
    saveCartToFirestore();
  }

  // ------------------------------------------------------
  // CHANGE CART QUANTITY
  // ------------------------------------------------------
  function changeQuantity(id, action) {
    cart = cart.map(item => {
      if (item.id === id) {
        if (action === "inc") item.quantity++;
        else if (action === "dec" && item.quantity > 1) item.quantity--;
      }
      return item;
    });

    renderCart();
  }

  // ------------------------------------------------------
  // WISHLIST RENDER
  // ------------------------------------------------------
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

        <div class="flex flex-col gap-2">
          <button class="moveCart bg-green-600 text-white px-2 rounded">Move to Cart</button>
          <button class="removeWishlist bg-red-600 text-white px-2 rounded">Remove</button>
        </div>
      `;

      div.querySelector(".moveCart").onclick = () => addToCart(item);
      div.querySelector(".removeWishlist").onclick = () => removeFromWishlist(item.id);

      wishlistItems.appendChild(div);
    });

    updateCounts();
    saveWishlistToFirestore();
  }

  // ------------------------------------------------------
  // ADD TO CART
  // ------------------------------------------------------
  function addToCart(product) {
    if (!checkLogin()) return;

    const exist = cart.find(i => i.id === product.id);

    if (exist) exist.quantity++;
    else cart.push({ ...product, quantity: 1 });

    wishlist = wishlist.filter(i => i.id !== product.id);

    saveWishlistToFirestore();
    renderWishlist();
    renderCart();
  }

  // ------------------------------------------------------
  // ADD TO WISHLIST
  // ------------------------------------------------------
  function addToWishlist(product) {
    if (!checkLogin()) return;

    if (!wishlist.find(i => i.id === product.id)) {
      wishlist.push(product);
    }

    renderWishlist();
  }

  // ------------------------------------------------------
  // REMOVE FROM WISHLIST
  // ------------------------------------------------------
  function removeFromWishlist(id) {
    wishlist = wishlist.filter(i => i.id !== id);
    renderWishlist();
  }

  // ------------------------------------------------------
  // ENSURE USER LOGGED IN
  // ------------------------------------------------------
  function checkLogin() {
    if (!currentUser) {
      $("profileModal").classList.remove("hidden");
      alert("Please login to continue");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------
  // AUTH STATE LISTENER
  // ------------------------------------------------------
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
      const userDoc = doc(db, "users", user.uid);

      // Create user doc if not exist
      if (!(await getDoc(userDoc)).exists()) {
        await setDoc(userDoc, { cart: [], wishlist: [] });
      }

      await loadUserData();
      renderCart();
      renderWishlist();
    } else {
      cart = [];
      wishlist = [];
      renderCart();
      renderWishlist();
    }
  });

  // ------------------------------------------------------
  // EXPOSE FUNCTIONS GLOBALLY
  // ------------------------------------------------------
  window.Header = {
    addToCart,
    addToWishlist,
    updateCounts: updateCounts
  };
})();
