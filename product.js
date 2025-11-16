// =======================
// product.js - Product Detail Page (uses shared header.js)
// =======================

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// Fallback data if backend is offline
const fallbackProducts = [
  { id: "1", name: "Handmade Embroidery", price: 1200, img: "public/images/embroidery1.jpg", description: "Beautiful handmade embroidery work." },
  { id: "2", name: "Custom Bouquet", price: 800, img: "public/images/bouquet1.jpg", description: "Custom bouquets for every occasion." },
  { id: "3", name: "Gift Box", price: 500, img: "public/images/gift1.jpg", description: "Perfect gift box for loved ones." }
];

// =======================
// LOAD PRODUCT DETAILS
// =======================
async function loadProduct() {
  try {
    let allProducts = [...fallbackProducts];
    const res = await fetch("/products");
    if (res.ok) {
      const adminProducts = await res.json();
      adminProducts.forEach(p => {
        if (!allProducts.find(prod => prod.id == p.id)) {
          allProducts.push({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            img: p.image || "public/images/placeholder.jpg",
            description: p.description || ""
          });
        }
      });
    }

    const product = allProducts.find(p => p.id == productId);
    if (!product) {
      alert("Product not found");
      window.location.href = "index.html";
      return;
    }

    // Display product data
    document.getElementById("productImg").src = product.img;
    document.getElementById("productName").textContent = product.name;
    document.getElementById("productPrice").textContent = `₹${product.price}`;
    document.getElementById("productDesc").textContent = product.description;

    // Button actions using global Header
    document.getElementById("addCartBtn").onclick = () => Header.addToCart(product);
    document.getElementById("addWishlistBtn").onclick = () => Header.addToWishlist(product);

    const backShopBtn = document.getElementById("backShopBtn");
    if (backShopBtn)
      backShopBtn.addEventListener("click", () => (window.location.href = "index.html"));
  } catch (err) {
    console.error("Error loading product:", err);
  }
}

// =======================
// INIT (after header/footer loaded)
// =======================
document.addEventListener("partials:loaded", () => {
  loadProduct();
  Header.updateCounts();
});
