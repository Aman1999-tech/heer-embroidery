// =======================
// product.js - Product Detail Page
// =======================

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// Fallback products
const fallbackProducts = [
  { id: "1", name: "Handmade Embroidery", price: 1200, img: "public/images/embroidery1.jpg", description: "Beautiful handmade embroidery work." },
  { id: "2", name: "Custom Bouquet", price: 800, img: "public/images/bouquet1.jpg", description: "Custom bouquets for every occasion." },
  { id: "3", name: "Gift Box", price: 500, img: "public/images/gift1.jpg", description: "Perfect gift box." }
];

async function loadProduct() {
  try {
    let allProducts = [...fallbackProducts];

    // Fetch from backend
    const res = await fetch("/products");
    if (res.ok) {
      const server = await res.json();
      server.forEach(p => {
        if (!allProducts.find(a => a.id == p.id)) {
          allProducts.push({
            id: p.id,
            name: p.name,
            price: p.price,
            img: p.image || "public/images/placeholder.jpg",
            description: p.description || ""
          });
        }
      });
    }

    // Find product
    const product = allProducts.find(p => p.id == productId);
    if (!product) {
      alert("Product not found");
      location.href = "index.html";
      return;
    }

    // Set HTML
    document.getElementById("productImg").src = product.img;
    document.getElementById("productName").textContent = product.name;
    document.getElementById("productPrice").textContent = `₹${product.price}`;
    document.getElementById("productDesc").textContent = product.description;

    document.getElementById("backShopBtn").onclick = () => location.href = "index.html";

    // =============== FIXED COMPLETE WORKING ADD TO CART / WISHLIST =====================

    function attachButtons() {
      if (window.Header) {
        document.getElementById("addCartBtn").onclick = () => Header.addToCart(product);
        document.getElementById("addWishlistBtn").onclick = () => Header.addToWishlist(product);
        console.log("Buttons attached after header ready");
      }
    }

    // Method 1: If header.js already loaded → attach immediately
    if (window.Header) {
      attachButtons();
    } else {
      console.log("Waiting for header...");
    }

    // Method 2: If header loads late → attach on event
    document.addEventListener("header:ready", attachButtons);

  } catch (err) {
    console.error("Product Load Error:", err);
  }
}

// Run after header/footer injected
document.addEventListener("partials:loaded", loadProduct);
