let products=[];
let currentFilter="All";
const productGrid=document.getElementById("productGrid");

function renderProducts(filter="All"){
  productGrid.innerHTML="";
  const filtered=filter==="All"?products:products.filter(p=>p.category===filter);

  filtered.forEach(p=>{
    const card=document.createElement("div");
    card.className="glass p-4 rounded-lg shadow text-center cursor-pointer";

    card.innerHTML=`
      <img src="${p.img}" class="w-40 h-40 object-cover mx-auto rounded mb-3">
      <h3 class="font-semibold">${p.name}</h3>
      <p class="text-pink-600 font-bold">₹${p.price}</p>
      <div class="flex justify-center gap-2 mt-2">
        <button class="addCart bg-green-600 text-white px-3 py-1 rounded">Add to Cart</button>
        <button class="addWish bg-yellow-400 text-black px-3 py-1 rounded">♡ Wishlist</button>
      </div>
    `;

    card.querySelector(".addCart").onclick=(e)=>{e.stopPropagation();Header.addToCart(p);};
    card.querySelector(".addWish").onclick=(e)=>{e.stopPropagation();Header.addToWishlist(p);};
    card.onclick=()=>location.href=`product.html?id=${p.id}`;

    productGrid.appendChild(card);
  });
}

function renderFilters(){
  const box=document.querySelector(".filter-btns-container");
  const cats=["All",...new Set(products.map(p=>p.category))];
  box.innerHTML="";
  cats.forEach(cat=>{
    let b=document.createElement("button");
    b.textContent=cat;
    b.className="px-3 py-1 glass rounded";
    b.onclick=()=>{
      document.querySelectorAll(".filter-btns-container button")
        .forEach(btn=>btn.classList.remove("bg-pink-600","text-white"));
      b.classList.add("bg-pink-600","text-white");
      renderProducts(cat);
    };
    box.appendChild(b);
  });
}

async function loadProducts(){
  let r=await fetch("/products");
  let list=await r.json();
  products=list.map(p=>({...p,img:p.image||"public/images/placeholder.jpg"}));
  renderFilters(); renderProducts();
}

document.addEventListener("partials:loaded",()=>{
  loadProducts();
  Header.updateCounts();
});
