(function() {
  const path = window.location.pathname;
  const isStocks = path.includes('stocks');
  const isRnP    = path.includes('rnp');

  const css = `
    .site-header { background: #0d1117; border-bottom: 1px solid #1a2333; padding: 14px 28px 0; font-family: 'Geologica', system-ui, sans-serif; }
    .site-header-top { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; }
    .sh-logo { width: 44px; height: 44px; background: #cb11ab; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #fff; box-shadow: 0 0 24px rgba(203,17,171,0.3); flex-shrink: 0; }
    .sh-name { font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #dde4ee; line-height: 1.1; text-transform: uppercase; }
    .sh-sub  { font-size: 11px; color: #4a5568; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }
    .sh-meta { display: flex; align-items: center; gap: 10px; margin-left: auto; }
    .site-nav { display: flex; gap: 2px; }
    .site-nav a { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 700; letter-spacing: 0.4px; color: rgba(255,255,255,0.35); text-decoration: none; transition: all .2s; position: relative; top: 1px; border: 1px solid transparent; border-bottom: none; }
    .site-nav a:hover  { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.05); }
    .site-nav a.active { background: #080c10; color: #fff; border-color: #1a2333; border-bottom-color: #080c10; }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const header = document.createElement('div');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="site-header-top">
      <div class="sh-logo">WB</div>
      <div>
        <div class="sh-name">WB Analytics</div>
        <div class="sh-sub">Никита</div>
      </div>
    </div>
    <nav class="site-nav">
      <a href="rnp.html"    ${isRnP    ? 'class="active"' : ''}>📈 РнП</a>
      <a href="stocks.html" ${isStocks ? 'class="active"' : ''}>📦 Остатки</a>
    </nav>`;

  document.body.insertBefore(header, document.body.firstChild);
})();
