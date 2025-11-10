// header.js
(function () {
  if (window.__HEADER_INIT__) return;
  window.__HEADER_INIT__ = true;

  function $(id) { return document.getElementById(id); }
  const classes = {
    cartHidden: 'translate-x-full',
    wishlistHidden: '-translate-x-full',
  };

  function init() {
    const cartBtn = $('cartBtn');
    const wishlistBtn = $('wishlistBtn');
    const cartDrawer = $('cartDrawer');
    const wishlistDrawer = $('wishlistDrawer');

    // Open drawers
    cartBtn?.addEventListener('click', () => cartDrawer?.classList.remove(classes.cartHidden));
    wishlistBtn?.addEventListener('click', () => wishlistDrawer?.classList.remove(classes.wishlistHidden));

    // Close drawers
    document.querySelectorAll('.closeCart').forEach(b =>
      b.addEventListener('click', () => cartDrawer?.classList.add(classes.cartHidden)));
    document.querySelectorAll('.closeWishlist').forEach(b =>
      b.addEventListener('click', () => wishlistDrawer?.classList.add(classes.wishlistHidden)));

    // Initial badge counts from localStorage (app.js will keep them in sync)
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setCartCount(cart.reduce((s, i) => s + (i.quantity || 1), 0));
      setWishlistCount(wishlist.length);
    } catch {}
  }

  function setCartCount(n) {
    const el = $('cartCount'); if (el) el.textContent = String(n || 0);
  }
  function setWishlistCount(n) {
    const el = $('wishlistCount'); if (el) el.textContent = String(n || 0);
  }

  // Expose simple API for app.js
  window.Header = {
    setCartCount,
    setWishlistCount
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();