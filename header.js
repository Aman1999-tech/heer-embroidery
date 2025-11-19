// header.js (FULL AMAZON STYLE)
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc, setDoc, getDoc, addDoc, collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(function () {
if (window.__HDR_LOADED__) return;
window.__HDR_LOADED__ = true;

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let currentUser = null;

const $ = id => document.getElementById(id);

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  syncUser();
}
function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  syncUser();
}

async function syncUser() {
  if (!currentUser) return;
  await setDoc(doc(db,"users",currentUser.uid),{
    cart, wishlist
  },{merge:true});
}

function ensureLogin() {
  if (!currentUser) { openProfile(); alert("Please login first."); return false; }
  return true;
}
// CART RENDER
function renderCart() {
  const box = $("cartItems"); if (!box) return;
  box.innerHTML = "";
  let total = 0;

  cart.forEach(item=>{
    const q = item.quantity || 1;
    total += item.price*q;

    const div=document.createElement("div");
    div.className="border-b pb-2 mb-2 flex gap-2";

    div.innerHTML=`
      <img src="${item.img}" class="w-16 h-16 object-cover rounded">
      <div class="flex-1">
        <p class="font-semibold">${item.name}</p>
        <p class="text-gray-600 text-sm">₹${item.price} x ${q} = ₹${item.price*q}</p>
        <button class="text-red-600 text-sm underline removeBtn">Delete</button>
      </div>
      <div class="flex flex-col items-center">
        <button class="bg-gray-300 px-2 increase">+</button>
        <span>${q}</span>
        <button class="bg-gray-300 px-2 decrease">-</button>
      </div>
    `;

    div.querySelector(".increase").onclick = ()=>updateQty(item.id,"+");
    div.querySelector(".decrease").onclick = ()=>updateQty(item.id,"-");
    div.querySelector(".removeBtn").onclick = ()=>{
      cart = cart.filter(c=>c.id!==item.id);
      renderCart();
    };

    box.appendChild(div);
  });

  $("cartTotal").textContent = `₹${total}`;
  saveCart();
  updateCounts();
}

function updateQty(id,mode){
  cart = cart.map(item=>{
    if(item.id===id){
      item.quantity = (item.quantity||1) + (mode==="+"?1:-1);
    }
    return item;
  }).filter(i=>(i.quantity||0)>0);

  renderCart();
}

// WISHLIST
function renderWishlist() {
  const box = $("wishlistItems"); if (!box) return;
  box.innerHTML = "";

  wishlist.forEach(item=>{
    const div=document.createElement("div");
    div.className="border-b pb-2 mb-2 flex gap-2";

    div.innerHTML=`
      <img src="${item.img}" class="w-16 h-16 object-cover rounded">
      <div class="flex-1">
        <p class="font-semibold">${item.name}</p>
        <p class="text-gray-600">₹${item.price}</p>
      </div>
      <div class="flex flex-col gap-1">
        <button class="bg-green-600 text-white px-2 rounded move">Move</button>
        <button class="bg-red-600 text-white px-2 rounded del">Remove</button>
      </div>
    `;

    div.querySelector(".move").onclick = ()=>{
      addToCart(item);
      wishlist = wishlist.filter(w=>w.id!==item.id);
      renderWishlist();
    };
    div.querySelector(".del").onclick = ()=>{
      wishlist = wishlist.filter(w=>w.id!==item.id);
      renderWishlist();
    };

    box.appendChild(div);
  });

  saveWishlist();
  updateCounts();
}

// ADD FUNCTIONS
function addToCart(p){
  if(!ensureLogin())return;
  const exist=cart.find(i=>i.id===p.id);
  if(exist) exist.quantity++; else cart.push({...p,quantity:1});
  wishlist = wishlist.filter(w=>w.id!==p.id);
  renderCart(); renderWishlist();
}
function addToWishlist(p){
  if(!ensureLogin())return;
  if(!wishlist.find(w=>w.id===p.id)) wishlist.push(p);
  renderWishlist();
}

window.Header = { addToCart, addToWishlist, updateCounts };

function updateCounts(){
  $("cartCount").textContent = cart.reduce((a,b)=>a+(b.quantity||1),0);
  $("wishlistCount").textContent = wishlist.length;
}

// DRAWERS
const openCart=()=>$("cartDrawer").classList.remove("translate-x-full");
const closeCart=()=>$("cartDrawer").classList.add("translate-x-full");
const openWish=()=>$("wishlistDrawer").classList.remove("-translate-x-full");
const closeWish=()=>$("wishlistDrawer").classList.add("-translate-x-full");
const openCheckout=()=>$("checkoutDrawer").classList.remove("translate-x-full");
const closeCheckout=()=>$("checkoutDrawer").classList.add("translate-x-full");
const openProfile=()=>$("profileModal").classList.remove("hidden");
const closeProfile=()=>$("profileModal").classList.add("hidden");
// CHECKOUT
$("checkoutBtn")?.addEventListener("click",()=>{
  if(!ensureLogin())return;
  if(!cart.length) return alert("Cart empty");
  openCheckout();
});

$("checkoutForm")?.addEventListener("submit",e=>{
  e.preventDefault();

  const name=$("custName").value.trim();
  const email=$("custEmail").value.trim();
  const phone=$("custPhone").value.trim();
  const address=$("custAddress").value.trim();

  const amount = cart.reduce((s,i)=>s+i.price*(i.quantity||1),0);

  const options = {
    key: window.RAZORPAY_KEY_ID,   // Injected by backend
    amount: amount*100,
    currency:"INR",
    name:"Heer Embroidery",
    handler: async (res)=>{
      await addDoc(collection(db,"orders"),{
        user: currentUser.uid,
        name,email,phone,address,
        items:cart,
        amount,
        paymentId:res.razorpay_payment_id,
        createdAt: serverTimestamp()
      });

      cart=[];
      renderCart();
      closeCheckout();
      alert("Order placed!");
    },
    prefill:{name,email,contact:phone}
  };

  new Razorpay(options).open();
});

// LOGIN / SIGNUP
$("profileBtn").onclick=openProfile;
$("closeProfileModal").onclick=closeProfile;
$("loginBtn").onclick=async()=>{
  let e=$("userEmail").value.trim(), p=$("userPassword").value.trim();
  await signInWithEmailAndPassword(auth,e,p).catch(err=>alert(err.message));
};
$("signupBtn").onclick=async()=>{
  let e=$("userEmail").value.trim(), p=$("userPassword").value.trim();
  let u=await createUserWithEmailAndPassword(auth,e,p).catch(err=>alert(err.message));
  if(!u)return;
  await setDoc(doc(db,"users",u.user.uid),{
    email:e,createdAt:serverTimestamp(),cart:[],wishlist:[]
  });
  alert("Account created!");
};
$("logoutBtn").onclick=()=>signOut(auth);

// LOAD USER & DATA
onAuthStateChanged(auth, async user=>{
  currentUser=user;
  if(user){
    const snap=await getDoc(doc(db,"users",user.uid));
    if(snap.exists()){
      cart=snap.data().cart||[];
      wishlist=snap.data().wishlist||[];
    }
    $("userInfo").classList.remove("hidden");
    $("profileContent").classList.add("hidden");
    $("userName").textContent=user.email.split("@")[0];
  } else {
    $("userInfo").classList.add("hidden");
    $("profileContent").classList.remove("hidden");
  }

  renderCart(); renderWishlist(); updateCounts();
});

// BUTTON BINDINGS
document.addEventListener("DOMContentLoaded",()=>{
  $("cartBtn").onclick=openCart;
  $("wishlistBtn").onclick=openWish;
  document.querySelectorAll(".closeCart").forEach(b=>b.onclick=closeCart);
  document.querySelectorAll(".closeWishlist").forEach(b=>b.onclick=closeWish);
  document.querySelectorAll(".closeCheckout").forEach(b=>b.onclick=closeCheckout);
});
})();
