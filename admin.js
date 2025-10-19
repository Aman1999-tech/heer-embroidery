document.addEventListener("DOMContentLoaded", () => {
  let unauthorizedShown = false; // prevent multiple alerts
  let editingProductId = null;

  // -------------------- TOKEN --------------------
  const tokenInput = document.getElementById("adminTokenInput");
  const setTokenBtn = document.getElementById("setTokenBtn");
  const logoutTokenBtn = document.getElementById("logoutTokenBtn");
  const tokenStatus = document.getElementById("tokenStatus");

  function updateTokenUI() {
    const token = localStorage.getItem("adminToken");
    if (token) {
      tokenStatus.textContent = "Token active ✅";
      logoutTokenBtn.classList.remove("hidden");
    } else {
      tokenStatus.textContent = "";
      logoutTokenBtn.classList.add("hidden");
    }
  }

  setTokenBtn.addEventListener("click", () => {
    const token = tokenInput.value.trim();
    if (!token) { alert("⚠️ Please enter a token"); return; }

    localStorage.setItem("adminToken", token);
    unauthorizedShown = false; // reset warning
    updateTokenUI();
    alert("✅ Admin token saved! Reloading products and orders...");
    loadOrders();
    loadProducts();
  });

  logoutTokenBtn.addEventListener("click", () => {
    if (!confirm("Logout admin token?")) return;
    localStorage.removeItem("adminToken");
    updateTokenUI();
    alert("Logged out.");
  });

  updateTokenUI();

  // -------------------- LOAD ORDERS --------------------
  async function loadOrders() {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      document.getElementById("ordersTable").innerHTML = `<tr><td colspan="5" class="p-4 text-center muted">Set token to load orders.</td></tr>`;
      return;
    }

    try {
      const res = await fetch("/orders", { headers: { "Authorization": `Bearer ${token}` } });

      if (res.status === 403) {
        if (!unauthorizedShown) {
          alert("❌ Unauthorized — invalid token");
          unauthorizedShown = true;
        }
        document.getElementById("ordersTable").innerHTML = `<tr><td colspan="5" class="p-4 text-center muted">Unauthorized. Check token.</td></tr>`;
        return;
      }

      if (!res.ok) throw new Error(`Orders request failed (${res.status})`);

      const orders = await res.json();
      const table = document.getElementById("ordersTable");
      table.innerHTML = "";
      if (!orders || orders.length === 0) {
        table.innerHTML = `<tr><td colspan="5" class="p-4 text-center muted">No orders yet.</td></tr>`;
        return;
      }
      orders.forEach(o => {
        table.innerHTML += `
          <tr class="border">
            <td class="p-2">${o.orderId}</td>
            <td>${o.customer.name}<br>${o.customer.email}<br>${o.customer.phone}</td>
            <td>${o.customer.address}</td>
            <td>${o.customer.items.map(i => `${i.name} x${i.qty}`).join("<br>")}</td>
            <td>${new Date(o.date).toLocaleString()}</td>
          </tr>`;
      });
    } catch (err) {
      console.error("Error loading orders:", err);
      document.getElementById("ordersTable").innerHTML = `<tr><td colspan="5" class="p-4 text-center muted">Error loading orders.</td></tr>`;
    }
  }

  setInterval(() => { if (localStorage.getItem("adminToken")) loadOrders(); }, 5000);

  // -------------------- LOAD PRODUCTS --------------------
  async function loadProducts() {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      document.getElementById("productsContainer").innerHTML = `<div class="p-4 muted">Set token to manage products.</div>`;
      return;
    }

    try {
      const res = await fetch("/products");
      if (!res.ok) throw new Error(`Products request failed (${res.status})`);
      const products = await res.json();
      const container = document.getElementById("productsContainer");
      if (!container) return;

      container.innerHTML = "";
      if (!products || products.length === 0) {
        container.innerHTML = `<div class="p-4 muted">No products uploaded yet.</div>`;
        return;
      }

      products.forEach(p => {
        const div = document.createElement("div");
        div.className = "border p-2 mb-2 rounded flex justify-between items-center";
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
        div.querySelector(".editBtn").addEventListener("click", () => {
          // open modal with values
          editingProductId = p.id;
          document.getElementById("editName").value = p.name;
          document.getElementById("editPrice").value = p.price;
          document.getElementById("editCategory").value = p.category;
          document.getElementById("editImage").value = p.image || "";
          document.getElementById("editDesc").value = p.description || "";
          document.getElementById("editModal")?.classList?.remove("hidden");
          document.getElementById("editModal")?.classList?.add("flex");
          // our modal is #editModal, actual id used below is editModal
          document.getElementById("editModal")?.classList?.remove("hidden");
          // show the modal root
          document.getElementById("editModal")?.style?.display = 'flex';
          // But we used #editModal in markup? We used id="editModal" in some code paths; fallback:
          const modal = document.getElementById("editModal");
          if (modal) modal.style.display = 'flex';
          // Our markup uses id="editModal"? Actually admin.html uses id="editModal". If not, use editModal fallback:
          const fallback = document.getElementById("editModal") || document.getElementById("editModal");
        });

        // --- DELETE ---
        div.querySelector(".deleteBtn").addEventListener("click", async () => {
          if (!confirm("Are you sure to delete?")) return;
          try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`/products/${p.id}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) loadProducts();
            else alert("Failed to delete product");
          } catch (err) {
            console.error(err);
            alert("Error deleting product");
          }
        });

        container.appendChild(div);
      });
    } catch (err) {
      console.error("Error loading products:", err);
      document.getElementById("productsContainer").innerHTML = `<div class="p-4 muted">Error loading products.</div>`;
    }
  }

  // -------------------- ADD PRODUCT --------------------
  document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    if (!token) { alert("⚠️ Set token first"); return; }

    const product = {
      name: document.getElementById("prodName").value,
      price: parseFloat(document.getElementById("prodPrice").value),
      category: document.getElementById("prodCategory").value,
      image: document.getElementById("prodImage").value,
      description: document.getElementById("prodDesc").value
    };

    // basic validation
    if (!product.name || isNaN(product.price) || !product.category) {
      alert("Please fill required fields correctly.");
      return;
    }

    try {
      const res = await fetch("/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });

      if (res.ok) {
        alert("✅ Product added!");
        document.getElementById("productForm").reset();
        loadProducts();
      } else {
        const text = await res.text().catch(()=>null);
        alert("Failed to add product: " + (text || res.status));
      }
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    }
  });

  // -------------------- EDIT PRODUCT (modal) --------------------
  const editModal = document.getElementById("editModal");
  const editProductForm = document.getElementById("editProductForm");
  const cancelEdit = document.getElementById("cancelEdit");

  // open/hide modal functions
  function hideEditModal() {
    editingProductId = null;
    if (editModal) editModal.classList.add("hidden");
    if (editModal) editModal.style.display = 'none';
  }
  function showEditModal() {
    if (editModal) {
      editModal.classList.remove("hidden");
      editModal.style.display = 'flex';
    }
  }

  cancelEdit.addEventListener("click", (e) => {
    e.preventDefault();
    hideEditModal();
  });

  editProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!editingProductId) { alert("No product selected"); return; }
    const token = localStorage.getItem("adminToken");
    if (!token) { alert("Set token"); return; }

    const payload = {
      name: document.getElementById("editName").value,
      price: parseFloat(document.getElementById("editPrice").value),
      category: document.getElementById("editCategory").value,
      image: document.getElementById("editImage").value,
      description: document.getElementById("editDesc").value
    };

    try {
      const res = await fetch(`/products/${editingProductId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        hideEditModal();
        loadProducts();
      } else {
        alert("Failed to update product");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating product");
    }
  });

  // -------------------- INITIAL LOAD --------------------
  updateTokenUI();
  if (localStorage.getItem("adminToken")) {
    loadOrders();
    loadProducts();
  }
});
