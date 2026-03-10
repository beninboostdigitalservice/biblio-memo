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
      setTimeout(function(){ if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }, 400);
    }

    // Only show the loader once (persisted). If already shown, skip insertion.
    try {
      if (!localStorage.getItem('rms_loader_shown')) {
        // mark shown so subsequent navigations won't show it
        localStorage.setItem('rms_loader_shown', '1');
        if (document.readyState === 'loading') insertLoader(); else setTimeout(insertLoader, 10);

        // Hide quickly (1s) to make the splash short and pleasant
        var maxDelay = 1000;
        window.addEventListener('load', hideLoader);
        setTimeout(hideLoader, maxDelay);
      }
    } catch (err) {
      // If localStorage not available, fall back to always showing but short timeout
      if (document.readyState === 'loading') insertLoader(); else setTimeout(insertLoader, 10);
      window.addEventListener('load', hideLoader);
      setTimeout(hideLoader, 1000);
    }
})();
