import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

async function loadProduct() {
  const id = getQueryParam("id");
  if (!id) return;
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const product = docSnap.data();
    document.getElementById("productName").textContent = product.name;
    document.getElementById("productPrice").textContent = `₹${product.price}`;
    document.getElementById("productDesc").textContent = product.description || "";
    const img = document.getElementById("productImg");
    img.src = product.img || "public/images/placeholder.jpg";
    img.addEventListener("click", () => {
      const lb = document.getElementById("lightbox");
      const lbImg = document.getElementById("lightboxImg");
      lbImg.src = img.src;
      lb.style.display = "flex";
    });

    document.getElementById("addCartBtn").addEventListener("click", () => {
      cart.push({ id, name: product.name, price: product.price });
      localStorage.setItem("cart", JSON.stringify(cart));
      alert("Added to cart!");
    });

    document.getElementById("addWishlistBtn").addEventListener("click", () => {
      wishlist.push({ id, name: product.name, price: product.price });
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      alert("Added to wishlist!");
    });
  } else {
    document.getElementById("productName").textContent = "Product not found!";
  }
}

document.getElementById("backShopBtn").addEventListener("click", () => window.history.back());

document.addEventListener("DOMContentLoaded", loadProduct);
