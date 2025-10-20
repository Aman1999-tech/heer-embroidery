document.addEventListener("DOMContentLoaded", () => {
  let unauthorizedShown = false; // prevent multiple alerts

  // -------------------- TOKEN --------------------
  document.getElementById("setTokenBtn").addEventListener("click", () => {
    const token = document.getElementById("adminTokenInput").value.trim();
    if (!token) {
      alert("⚠️ Please enter a token");
      return;
    }

    localStorage.setItem("adminToken", token);
    unauthorizedShown = false; // reset warning
    alert("✅ Admin token saved! Reloading products and orders...");
    loadOrders();
    loadProducts();
  });

  // -------------------- LOAD ORDERS --------------------
  async function loadOrders() {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const res = await fetch("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        if (!unauthorizedShown) {
          alert("❌ Unauthorized — invalid token");
          unauthorizedShown = true;
        }
        return;
      }

      const orders = await res.json();
      const table = document.getElementById("ordersTable");
      table.innerHTML = "";

      orders.forEach((o) => {
        const c = o.customer || {};
        const items = c.items || [];
        const orderId = o.orderId || o.id || "—";
        const date = o.date ? new Date(o.date).toLocaleString() : "";

        table.innerHTML += `
          <tr class="border">
            <td class="p-2">${orderId}</td>
            <td>${c.name || ""}<br>${c.email || ""}<br>${c.phone || ""}</td>
            <td>${c.address || ""}</td>
            <td>${items.map(i => `${i.name} ×${i.qty}`).join("<br>")}</td>
            <td>${date}</td>
          </tr>`;
      });

      // show message if no orders
      if (orders.length === 0) {
        table.innerHTML =
          '<tr><td colspan="5" class="text-center p-4 text-gray-500">No orders found</td></tr>';
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  }

  setInterval(() => {
    if (localStorage.getItem("adminToken")) loadOrders();
  }, 5000);

  // -------------------- LOAD PRODUCTS --------------------
  async function loadProducts() {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const res = await fetch("/products");
      const products = await res.json();
      const container = document.getElementById("productsContainer");
      if (!container) return;

      container.innerHTML = "";
      products.forEach((p) => {
        const div = document.createElement("div");
        div.className =
          "border p-2 mb-2 rounded flex justify-between items-center";
        div.innerHTML = `
          <div>
            <a href="${p.image}" target="_blank">
              <img src="${p.image}" alt="${p.name}" class="w-24 h-24 object-cover mb-2">
            </a>
            <b>${p.name}</b> (${p.category}) - ₹${p.price}<br>
            <small>${p.description || ""}</small>
          </div>
          <div class="flex gap-2">
            <button class="bg-yellow-400 px-2 rounded editBtn">Edit</button>
            <button class="bg-red-500 text-white px-2 rounded deleteBtn">Delete</button>
          </div>`;

        // --- EDIT ---
        div.querySelector(".editBtn").addEventListener("click", async () => {
          const newName = prompt("Name:", p.name);
          const newPrice = prompt("Price:", p.price);
          const newCategory = prompt("Category:", p.category);
          const newImage = prompt("Image URL:", p.image);
          const newDesc = prompt("Description:", p.description);

          const res = await fetch(`/products/${p.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: newName,
              price: newPrice,
              category: newCategory,
              image: newImage,
              description: newDesc,
            }),
          });

          if (res.ok) loadProducts();
          else alert("Failed to update product");
        });

        // --- DELETE ---
        div.querySelector(".deleteBtn").addEventListener("click", async () => {
          if (!confirm("Are you sure to delete?")) return;
          const res = await fetch(`/products/${p.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) loadProducts();
          else alert("Failed to delete product");
        });

        container.appendChild(div);
      });
    } catch (err) {
      console.error("Error loading products:", err);
    }
  }

  // -------------------- ADD PRODUCT --------------------
  document
    .getElementById("productForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("⚠️ Set token first");
        return;
      }

      const product = {
        name: document.getElementById("prodName").value,
        price: parseFloat(document.getElementById("prodPrice").value),
        category: document.getElementById("prodCategory").value,
        image: document.getElementById("prodImage").value,
        description: document.getElementById("prodDesc").value,
      };

      try {
        const res = await fetch("/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(product),
        });

        if (res.ok) {
          alert("✅ Product added!");
          document.getElementById("productForm").reset();
          loadProducts();
        } else {
          alert("Failed to add product");
        }
      } catch (err) {
        console.error(err);
      }
    });

  // -------------------- INITIAL LOAD --------------------
  if (localStorage.getItem("adminToken")) {
    loadOrders();
    loadProducts();
  }
});