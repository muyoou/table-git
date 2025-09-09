(() => {
  const byId = (id) => document.getElementById(id);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));
  const buttons = qsa('.tabs button');
  const panels = {
    html: byId('panel-html'),
    csv: byId('panel-csv'),
    json: byId('panel-json'),
  };
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.getAttribute('data-tab');
      Object.entries(panels).forEach(([k, el]) => el.classList.toggle('active', k === tab));
    });
  });
})();
