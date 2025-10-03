// =======================
// GET PRODUCT FROM URL
// =======================
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// Example products (hardcoded)
let products = [
  { id: "1", name: "Handmade Embroidery", price: 1200, img: "public/images/embroidery1.jpg", description: "Beautiful handmade embroidery work." },
  { id: "2", name: "Custom Bouquet", price: 800, img: "public/images/bouquet1.jpg", description: "Custom bouquets for every occasion." },
  { id: "3", name: "Gift Box", price: 500, img: "public/images/gift1.jpg", description: "Perfect gift box for loved ones." }
];

// =======================
// DOM ELEMENTS
// =======================
const productImg = document.getElementById("productImg");
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productDesc = document.getElementById("productDesc");
const addCartBtn = document.getElementById("addCartBtn");
const addWishlistBtn = document.getElementById("addWishlistBtn");
const cartItems = document.getElementById("cartItems");
const wishlistItems = document.getElementById("wishlistItems");
const cartCount = document.getElementById("cartCount");
const wishlistCount = document.getElementById("wishlistCount");
const cartTotal = document.getElementById("cartTotal");

// Drawers
const cartDrawer = document.getElementById("cartDrawer");
const wishlistDrawer = document.getElementById("wishlistDrawer");
const checkoutDrawer = document.getElementById("checkoutDrawer");

// =======================
// CART & WISHLIST STORAGE
// =======================
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }

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
  cartCount.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
  cartTotal.textContent = `₹${total}`;
  saveCart();
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity++;
  else cart.push({ ...product, quantity: 1 });
  wishlist = wishlist.filter(i => i.id !== product.id);
  renderWishlist();
  renderCart();
  saveWishlist();
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
  wishlistCount.textContent = wishlist.length;
  saveWishlist();
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
// LOAD PRODUCT
// =======================
async function loadProduct() {
  let allProducts = [...products];

  if (typeof firebase !== "undefined") {
    const db = firebase.firestore();
    const snapshot = await db.collection("products").get();
    snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
  }

  const product = allProducts.find(p => p.id == productId);
  if (!product) {
    alert("Product not found");
    window.location.href = "index.html";
    return;
  }

  productImg.src = product.img;
  productImg.alt = product.name;
  productName.textContent = product.name;
  productPrice.textContent = `₹${product.price}`;
  productDesc.textContent = product.description;

  addCartBtn.onclick = () => addToCart(product);
  addWishlistBtn.onclick = () => addToWishlist(product);
}

// =======================
// INITIAL LOAD & EVENT LISTENERS
// =======================
document.addEventListener("DOMContentLoaded", () => {
  // Render existing cart/wishlist
  renderCart();
  renderWishlist();

  // Load product
  loadProduct();

  // Back button
  const backShopBtn = document.getElementById("backShopBtn");
  if (backShopBtn) backShopBtn.addEventListener("click", () => window.location.href = "index.html");

  // Drawer toggles
  const cartBtn = document.getElementById("cartBtn");
  const wishlistBtn = document.getElementById("wishlistBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const closeCartBtn = document.querySelector(".closeCart");
  const closeWishlistBtn = document.querySelector(".closeWishlist");
  const closeCheckoutBtn = document.querySelector(".closeCheckout");

  if (cartBtn) cartBtn.addEventListener("click", () => cartDrawer.classList.remove("translate-x-full"));
  if (closeCartBtn) closeCartBtn.addEventListener("click", () => cartDrawer.classList.add("translate-x-full"));
  if (wishlistBtn) wishlistBtn.addEventListener("click", () => wishlistDrawer.classList.remove("-translate-x-full"));
  if (closeWishlistBtn) closeWishlistBtn.addEventListener("click", () => wishlistDrawer.classList.add("-translate-x-full"));
  if (checkoutBtn) checkoutBtn.addEventListener("click", () => {
    cartDrawer.classList.add("translate-x-full");
    checkoutDrawer.classList.remove("translate-x-full");
  });
  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener("click", () => checkoutDrawer.classList.add("translate-x-full"));

  // =======================
  // Checkout form submit
  // =======================
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
