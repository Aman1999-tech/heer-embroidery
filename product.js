// =======================
// product.js - Product Detail Page (Firestore Loading)
// =======================

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { app } from "./firebase-config.js";

const db = getFirestore(app);

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// =======================
// LOAD PRODUCT FROM FIRESTORE
// =======================
async function loadProduct() {
  try {
    const ref = doc(db, "products", productId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Product not found!");
      window.location.href = "index.html";
      return;
    }

    const product = snap.data();

    document.getElementById("productImg").src = product.image;
    document.getElementById("productName").textContent = product.name;
    document.getElementById("productPrice").textContent = `₹${product.price}`;
    document.getElementById("productDesc").textContent = product.description;

    // Add / Wishlist buttons
    document.getElementById("addCartBtn").onclick = () =>
      window.Header.addToCart({ id: productId, ...product });

    document.getElementById("addWishlistBtn").onclick = () =>
      window.Header.addToWishlist({ id: productId, ...product });

    // Back button
    document.getElementById("backShopBtn").addEventListener("click", () => {
      window.location.href = "index.html";
    });

    // Lightbox
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");

    document.getElementById("productImg").addEventListener("click", () => {
      lightboxImg.src = product.image;
      lightbox.style.display = "flex";
    });

    lightbox.addEventListener("click", () => {
      lightbox.style.display = "none";
    });

  } catch (err) {
    console.error("Error loading product:", err);
  }
}

// =======================
// INIT (after header/footer loaded)
// =======================
document.addEventListener("partials:loaded", () => {
  loadProduct();
  window.Header?.updateCounts?.();
});
