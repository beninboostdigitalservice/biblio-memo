// loader.js — inject loader.html and handle hiding
(function(){
  function insertLoader() {
    // insert loader.css
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'loader.css';
    document.head.appendChild(link);

    // Insert loader HTML directly (avoids fetch so it works on file:// and offline)
    var html = '\n<div id="loader">\n  <div class="particles">\n    <div class="particle"></div>\n    <div class="particle"></div>\n    <div class="particle"></div>\n    <div class="particle"></div>\n    <div class="particle"></div>\n    <div class="particle"></div>\n    <div class="particle"></div>\n    <div class="particle"></div>\n  </div>\n  <div class="spinner-container">\n    <div class="spinner spinner-1"></div>\n    <div class="spinner spinner-2"></div>\n    <div class="spinner spinner-3"></div>\n    <div class="pulse-dot"></div>\n  </div>\n  <p>\n    Chargement\n    <span class="loading-dots">\n      <span></span>\n      <span></span>\n      <span></span>\n    </span>\n  </p>\n</div>\n';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.insertBefore(wrap.firstElementChild, document.body.firstChild);
  }

  function hideLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.opacity = '0';
    setTimeout(function(){ if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
  }

  // Insert loader as early as possible
  if (document.readyState === 'loading') insertLoader(); else setTimeout(insertLoader, 10);

  // Events to hide loader
  window.addEventListener('flutter-first-frame', hideLoader);
  window.addEventListener('load', hideLoader);
  // fallback timeout
  setTimeout(hideLoader, 6000);
})();
