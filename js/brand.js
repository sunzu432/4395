/* Renders the company name/logo top-left from js/config.js (used by surveymonkey.html). */
(function () {
  'use strict';
  var cfg = window.APP_CONFIG || {};
  var name = cfg.companyName || 'Company Name';
  var brand = document.getElementById('brand');
  if (brand) {
    brand.textContent = '';
    if (cfg.logoUrl) {
      var img = document.createElement('img');
      img.className = 'brand-logo';
      img.src = cfg.logoUrl;
      img.alt = '';
      brand.appendChild(img);
    }
    var span = document.createElement('span');
    span.className = 'brand-name';
    span.textContent = name;
    brand.appendChild(span);
  }
  document.title = (cfg.surveyTitle ? cfg.surveyTitle + ' | ' : '') + name;
  var h1 = document.getElementById('page-title');
  if (h1 && cfg.surveyTitle) h1.textContent = cfg.surveyTitle;
  if (/^#[0-9a-f]{3,8}$/i.test(cfg.accentColor || '')) {
    document.documentElement.style.setProperty('--accent', cfg.accentColor);
  }
})();
