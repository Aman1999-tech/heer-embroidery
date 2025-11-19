const id=new URLSearchParams(location.search).get("id");

async function loadProduct(){
  let r=await fetch("/products");
  let list=await r.json();
  let p=list.find(i=>i.id==id);

  if(!p){
    alert("Product not found");
    location.href="index.html";
    return;
  }

  $("productImg").src=p.image;
  $("productName").textContent=p.name;
  $("productPrice").textContent=`₹${p.price}`;
  $("productDesc").textContent=p.description;

  $("addCartBtn").onclick=()=>Header.addToCart(p);
  $("addWishlistBtn").onclick=()=>Header.addToWishlist(p);
}

document.addEventListener("partials:loaded",()=>{
  loadProduct();
  Header.updateCounts();
});
