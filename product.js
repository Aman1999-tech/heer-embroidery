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

    // Load from server
    const res = await fetch("/products");
    if (res.ok) {
      const fromServer = await res.json();
      fromServer.forEach(p => {
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
      alert("Product not found!");
      window.location.href = "index.html";
      return;
    }

    // Fill HTML
    document.getElementById("productImg").src = product.img;
    document.getElementById("productName").textContent = product.name;
    document.getElementById("productPrice").textContent = `₹${product.price}`;
    document.getElementById("productDesc").textContent = product.description;

    // BACK BUTTON
    document.getElementById("backShopBtn").onclick = () => {
      window.location.href = "index.html";
    };

    // ============================
    // WAIT UNTIL HEADER LOADED!
    // ============================
    document.addEventListener("header:ready", () => {
      document.getElementById("addCartBtn").onclick = () => Header.addToCart(product);
      document.getElementById("addWishlistBtn").onclick = () => Header.addToWishlist(product);
    });

  } catch (err) {
    console.error("Product Load Error:", err);
  }
}

// Wait for header/footer load
document.addEventListener("partials:loaded", loadProduct);
