(() => {
  const byId = (id) => document.getElementById(id);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  // tabs
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

  // preload csv/json text content for display
  const loadText = async (url, targetId) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const text = await res.text();
      byId(targetId).textContent = text;
    } catch (e) {
      byId(targetId).textContent = `无法加载 ${url}: ${e.message}`;
    }
  };

  loadText('data.csv', 'csv-output');
  loadText('data.json', 'json-output');
})();
