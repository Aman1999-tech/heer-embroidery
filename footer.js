// footer.js
(function () {
  function init() {
    const y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();