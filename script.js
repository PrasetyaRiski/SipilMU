const SipilMU = (() => {
  let latestResult = null;
  let activeCategory = 'Semua';
  const AHSP = window.AHSP_DATA || { items: [], groups: {} };
  const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 });

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const byId = id => document.getElementById(id);
  const pageTitle = () => document.querySelector('.page-title-row h1')?.textContent?.trim() || 'Kalkulator AHSP Umum';
  const normalize = value => String(value || '').replace(',', '.');
  const getValue = id => {
    const el = byId(id);
    if (!el) return NaN;
    const value = parseFloat(normalize(el.value));
    return Number.isFinite(value) ? value : NaN;
  };
  const getOptionalPrice = id => {
    const el = byId(id);
    if (!el || !el.value) return 0;
    const value = parseFloat(normalize(el.value));
    return Number.isFinite(value) && value > 0 ? value : 0;
  };
  const getItem = id => (AHSP.items || []).find(item => item.id === id);
  const stripHtml = text => {
    const div = document.createElement('div');
    div.innerHTML = text || '';
    return div.textContent || div.innerText || '';
  };
  const cleanTitle = title => String(title || '').replace(/^A\.\s*[\d\.\s]*/, '').replace(/\s+/g, ' ').trim();
  const formatQty = (value, unit = '') => !Number.isFinite(value) ? '-' : `${number.format(value)}${unit ? ' ' + unit : ''}`;
  const money = value => Number.isFinite(value) ? currency.format(value) : '-';

  function clearErrors() { qsa('.field-error').forEach(el => el.textContent = ''); }
  function setError(id, message) {
    const errorEl = document.querySelector(`[data-error-for="${id}"]`);
    if (errorEl) errorEl.textContent = message;
  }
  function validatePositive(fields) {
    clearErrors();
    let valid = true;
    fields.forEach(field => {
      const value = getValue(field.id);
      if (!Number.isFinite(value) || value <= 0) {
        setError(field.id, `${field.label} wajib diisi lebih dari 0.`);
        valid = false;
      }
    });
    return valid;
  }

  function populateAhspSelects() {
    qsa('select[data-ahsp-group]').forEach(select => {
      const groupName = select.dataset.ahspGroup;
      const ids = groupName === 'all' ? AHSP.items.map(i => i.id) : (AHSP.groups[groupName] || []);
      const items = ids.map(getItem).filter(Boolean);
      select.innerHTML = items.map(item => `<option value="${item.id}">${cleanTitle(item.title)}</option>`).join('');
      if (!items.length) select.innerHTML = '<option value="">Data tidak tersedia</option>';
    });
  }

  function calculateAhspRows(item, qty, materialMargin = 0) {
    const rows = (item.items || []).map(row => {
      const margin = row.section === 'Bahan' ? (1 + materialMargin) : 1;
      const kebutuhan = qty * Number(row.coefficient || 0) * margin;
      const biaya = row.price ? kebutuhan * Number(row.price) : 0;
      return { ...row, kebutuhan, biaya, marginApplied: row.section === 'Bahan' && materialMargin > 0 };
    });
    const totalBiaya = rows.reduce((sum, row) => sum + (row.biaya || 0), 0);
    const totalAhspDasar = qty * Number(item.hsp || 0);
    return { rows, totalBiaya, totalAhspDasar };
  }

  function ahspTableHtml(rows) {
    if (!rows || !rows.length) return '';
    return `<div class="result-table-wrap"><table class="result-table">
      <thead><tr><th>Kelompok</th><th>Uraian</th><th>Koef.</th><th>Kebutuhan</th><th>Harga contoh</th><th>Jumlah contoh</th></tr></thead>
      <tbody>${rows.map(row => `<tr>
        <td><span class="section-pill">${row.section}</span></td>
        <td>${row.name}${row.marginApplied ? '<small>+ cadangan</small>' : ''}</td>
        <td>${formatQty(Number(row.coefficient || 0), row.unit)}</td>
        <td><strong>${formatQty(row.kebutuhan, row.unit)}</strong></td>
        <td>${row.price ? money(Number(row.price)) : '-'}</td>
        <td>${row.biaya ? money(row.biaya) : '-'}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

  function renderResult(payload) {
    latestResult = payload;
    const empty = qs('#result-empty');
    const content = qs('#result-content');
    const mainLabel = qs('#result-main-label');
    const mainValue = qs('#result-main-value');
    const list = qs('#result-list');
    const table = qs('#result-table');
    if (!empty || !content || !mainLabel || !mainValue || !list) return;
    empty.style.display = 'none';
    content.classList.remove('show');
    void content.offsetWidth;
    content.classList.add('show');
    mainLabel.textContent = payload.mainLabel;
    mainValue.innerHTML = payload.mainValue;
    list.innerHTML = payload.items.map(item => `<div class="result-item"><span>${item.label}</span><strong>${item.value}</strong></div>`).join('');
    if (table) table.innerHTML = payload.tableHtml || '';
    ['#save-result', '#share-result', '#print-result'].forEach(sel => { const btn = qs(sel); if (btn) btn.disabled = false; });
    if (window.matchMedia('(max-width: 780px)').matches) {
      const resultCard = qs('.result-card');
      resultCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function resultToText(result) {
    if (!result) return '';
    const lines = [`Hasil ${result.title} SipilMU`, `${result.mainLabel}: ${stripHtml(result.mainValue)}`, ...result.items.map(item => `${item.label}: ${stripHtml(item.value)}`)];
    return lines.join('\n');
  }

  function resultToPrintHtml(result) {
    const items = (result.items || []).map(item => `<tr><td>${item.label}</td><td><strong>${stripHtml(item.value)}</strong></td></tr>`).join('');
    return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${result.title}</title><style>body{font-family:Arial,sans-serif;margin:28px;color:#111827}h1{margin:0 0 8px}p{color:#4b5563}.main{padding:16px;border:1px solid #e5e7eb;border-radius:14px;margin:16px 0}.main strong{font-size:28px}table{width:100%;border-collapse:collapse;margin-top:12px}td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left}.small{font-size:12px;color:#6b7280;margin-top:18px}</style></head><body><h1>${result.title}</h1><p>Hasil perhitungan dari SipilMU.</p><div class="main"><span>${result.mainLabel}</span><br><strong>${stripHtml(result.mainValue)}</strong></div><table>${items}</table><p class="small">Dicetak dari riwayat SipilMU.</p><script>window.print()<\/script></body></html>`;
  }

  function saveHistory() {
    if (!latestResult) return;
    const history = JSON.parse(localStorage.getItem('sipilmu_history') || '[]');
    history.unshift({ ...latestResult, tableHtml: '', createdAt: new Date().toISOString() });
    localStorage.setItem('sipilmu_history', JSON.stringify(history.slice(0, 50)));
    const btn = qs('#save-result');
    if (btn) {
      const oldText = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check2-circle"></i> Tersimpan';
      setTimeout(() => btn.innerHTML = oldText, 1300);
    }
  }
  function shareResult() {
    if (!latestResult) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(resultToText(latestResult))}`, '_blank');
  }
  function resetForm(form) {
    form.reset();
    clearErrors();
    populateAhspSelects();
    const empty = qs('#result-empty');
    const content = qs('#result-content');
    const table = qs('#result-table');
    if (empty) empty.style.display = 'grid';
    if (content) content.classList.remove('show');
    if (table) table.innerHTML = '';
    ['#save-result', '#share-result', '#print-result'].forEach(sel => { const btn = qs(sel); if (btn) btn.disabled = true; });
    latestResult = null;
  }

  function calcItemByArea(selectId, qty, marginPercent, title, mainLabel) {
    const item = getItem(byId(selectId)?.value);
    if (!item) return;
    const margin = Math.max(0, marginPercent || 0) / 100;
    const calc = calculateAhspRows(item, qty, margin);
    renderResult({
      type: title.toLowerCase(),
      title,
      mainLabel,
      mainValue: formatQty(qty, item.unit),
      items: [
        { label: 'Jenis pekerjaan AHSP', value: cleanTitle(item.title) },
        { label: 'Baris sumber spreadsheet', value: `ANALISA row ${item.row}` },
        { label: 'Satuan pekerjaan', value: `per ${item.unit}` },
        { label: 'Harga satuan pekerjaan contoh', value: money(Number(item.hsp || 0)) },
        { label: 'Total harga contoh', value: money(calc.totalBiaya || calc.totalAhspDasar) },
        { label: 'Cadangan bahan', value: `${formatQty(marginPercent || 0, '%')}` }
      ],
      tableHtml: ahspTableHtml(calc.rows)
    });
  }

  function calcBata() {
    if (!validatePositive([{id:'panjangDinding',label:'Panjang dinding'},{id:'tinggiDinding',label:'Tinggi dinding'}])) return;
    const luas = getValue('panjangDinding') * getValue('tinggiDinding');
    calcItemByArea('wallVariant', luas, getValue('marginMaterial') || 0, 'Kalkulator Pasangan Dinding', 'Luas pasangan dinding');
  }
  function calcBeton() {
    if (!validatePositive([{id:'panjang',label:'Panjang area'},{id:'lebar',label:'Lebar area'},{id:'tinggi',label:'Tebal atau tinggi beton'}])) return;
    const volume = getValue('panjang') * getValue('lebar') * getValue('tinggi');
    calcItemByArea('betonVariant', volume, getValue('marginMaterial') || 0, 'Kalkulator Beton', 'Volume beton');
  }
  function calcPlester() {
    if (!validatePositive([{id:'panjangDinding',label:'Panjang bidang'},{id:'tinggiDinding',label:'Tinggi bidang'}])) return;
    const item = getItem(byId('plesterVariant')?.value);
    const qty = item && item.unit === 'm' ? getValue('panjangDinding') : getValue('panjangDinding') * getValue('tinggiDinding');
    calcItemByArea('plesterVariant', qty, getValue('marginMaterial') || 0, 'Kalkulator Plesteran dan Finishing', item && item.unit === 'm' ? 'Panjang pekerjaan' : 'Luas pekerjaan');
  }
  function calcKeramik() {
    if (!validatePositive([{id:'panjang',label:'Panjang bidang'},{id:'lebar',label:'Lebar atau tinggi bidang'}])) return;
    const item = getItem(byId('keramikVariant')?.value);
    const qty = item && item.unit === 'm' ? getValue('panjang') : getValue('panjang') * getValue('lebar');
    calcItemByArea('keramikVariant', qty, getValue('marginMaterial') || 0, 'Kalkulator Keramik', item && item.unit === 'm' ? 'Panjang pekerjaan' : 'Luas pekerjaan');
  }
  function calcBekisting() {
    if (!validatePositive([{id:'luas',label:'Luas bekisting'}])) return;
    calcItemByArea('bekistingVariant', getValue('luas'), getValue('marginMaterial') || 0, 'Kalkulator Bekisting', 'Luas bekisting');
  }
  function calcCat() {
    if (!validatePositive([{id:'luas',label:'Luas permukaan'}])) return;
    calcItemByArea('catVariant', getValue('luas'), getValue('marginMaterial') || 0, 'Kalkulator Pengecatan', 'Luas permukaan');
  }
  function calcWiremesh() {
    if (!validatePositive([{id:'berat',label:'Berat wiremesh'}])) return;
    calcItemByArea('wiremeshVariant', getValue('berat'), getValue('marginMaterial') || 0, 'Kalkulator Wiremesh', 'Berat wiremesh');
  }
  function calcAhsp() {
    if (!validatePositive([{id:'jumlahPekerjaan',label:'Jumlah pekerjaan'}])) return;
    const item = getItem(byId('ahspItem')?.value);
    calcItemByArea('ahspItem', getValue('jumlahPekerjaan'), getValue('marginMaterial') || 0, pageTitle(), item ? `Jumlah pekerjaan (${item.unit})` : 'Jumlah pekerjaan');
  }
  function calcAcian() {
    if (!validatePositive([{id:'panjangDinding',label:'Panjang dinding'},{id:'lebarDinding',label:'Tinggi atau lebar dinding'}])) return;
    const luas = getValue('panjangDinding') * getValue('lebarDinding');
    const semenKg = luas * 3.25;
    const hargaSemen = getOptionalPrice('hargaSemen');
    const totalBiaya = semenKg * hargaSemen;
    renderResult({ type:'acian', title:'Kalkulator Acian', mainLabel:'Kebutuhan semen', mainValue:formatQty(semenKg,'kg'), items:[
      {label:'Luas bidang', value:formatQty(luas,'m²')}, {label:'Koefisien praktis semen', value:'3,25 kg/m²'}, {label:'Estimasi biaya manual', value: totalBiaya > 0 ? money(totalBiaya) : 'Isi harga semen untuk menghitung biaya'}
    ]});
  }
  function calcUrugan() {
    if (!validatePositive([{id:'panjang',label:'Panjang area'},{id:'lebar',label:'Lebar area'},{id:'kedalaman',label:'Kedalaman urugan'}])) return;
    const volumeAwal = getValue('panjang') * getValue('lebar') * getValue('kedalaman');
    const volumeUrug = volumeAwal * 1.2;
    const hargaTanah = getOptionalPrice('hargaTanah');
    renderResult({ type:'urugan', title:'Kalkulator Urugan Tanah', mainLabel:'Kebutuhan tanah urug', mainValue:formatQty(volumeUrug,'m³'), items:[
      {label:'Volume dasar', value:formatQty(volumeAwal,'m³')}, {label:'Faktor cadangan volume', value:'20%'}, {label:'Tambahan volume', value:formatQty(volumeUrug-volumeAwal,'m³')}, {label:'Estimasi biaya manual', value: hargaTanah > 0 ? money(volumeUrug*hargaTanah) : 'Isi harga tanah untuk menghitung biaya'}
    ]});
  }

  function initCalculator() {
    populateAhspSelects();
    const form = qs('#calc-form');
    if (!form) return;
    const type = document.body.dataset.calculator;
    const handlers = { ahsp:calcAhsp, bata:calcBata, beton:calcBeton, plester:calcPlester, keramik:calcKeramik, bekisting:calcBekisting, cat:calcCat, wiremesh:calcWiremesh, acian:calcAcian, urugan:calcUrugan };
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const oldText = btn ? btn.innerHTML : '';
      if (btn) { btn.classList.add('loading'); btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Menghitung'; }
      window.setTimeout(() => {
        if (handlers[type]) handlers[type]();
        if (btn) { btn.classList.remove('loading'); btn.innerHTML = oldText; }
      }, 160);
    });
    qs('#reset-form')?.addEventListener('click', () => resetForm(form));
    qs('#save-result')?.addEventListener('click', saveHistory);
    qs('#share-result')?.addEventListener('click', shareResult);
    qs('#print-result')?.addEventListener('click', () => window.print());
  }

  function applyHomeFilters() {
    const input = qs('#calculatorSearch');
    const cards = qsa('[data-tool-card]');
    const empty = qs('#searchEmpty');
    const keyword = input ? input.value.trim().toLowerCase() : '';
    let visible = 0;
    cards.forEach(card => {
      const text = `${card.dataset.search || ''} ${card.textContent}`.toLowerCase();
      const categoryOk = activeCategory === 'Semua' || card.dataset.category === activeCategory;
      const searchOk = !keyword || text.includes(keyword);
      const show = categoryOk && searchOk;
      card.style.display = show ? 'flex' : 'none';
      if (show) visible += 1;
    });
    if (empty) empty.hidden = visible !== 0;
  }
  function initSearch() {
    const input = qs('#calculatorSearch');
    if (input) input.addEventListener('input', applyHomeFilters);
    qsa('[data-category-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.categoryFilter;
        qsa('[data-category-filter]').forEach(item => item.classList.toggle('active', item === btn));
        applyHomeFilters();
      });
    });
    applyHomeFilters();
  }

  function renderHistory() {
    const wrap = qs('#history-list');
    if (!wrap) return;
    const history = JSON.parse(localStorage.getItem('sipilmu_history') || '[]');
    if (!history.length) {
      wrap.innerHTML = '<div class="empty-state"><div><i class="bi bi-clock-history"></i><h3>Belum ada riwayat</h3><p>Hitung kebutuhan pekerjaan lalu klik tombol Simpan Riwayat.</p></div></div>';
      return;
    }
    wrap.innerHTML = history.map((item, index) => {
      const date = new Date(item.createdAt).toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' });
      const chips = (item.items || []).slice(0,4).map(result => `<span>${result.label}: ${stripHtml(result.value)}</span>`).join('');
      const details = (item.items || []).map(result => `<div><dt>${result.label}</dt><dd>${stripHtml(result.value)}</dd></div>`).join('');
      return `<article class="history-card" data-history-card="${index}">
        <div><h3>${item.title}</h3><div class="history-meta">${date}</div><p><strong>${item.mainLabel}:</strong> ${stripHtml(item.mainValue)}</p><div class="history-results">${chips}</div></div>
        <div class="history-actions">
          <button class="btn btn-secondary" type="button" data-detail-history="${index}"><i class="bi bi-eye"></i> Lihat Detail</button>
          <button class="btn btn-ghost" type="button" data-print-history="${index}"><i class="bi bi-printer"></i> Cetak Ulang</button>
          <button class="btn btn-ghost" type="button" data-delete-history="${index}"><i class="bi bi-trash3"></i> Hapus</button>
        </div>
        <div class="history-detail" id="history-detail-${index}"><dl>${details}</dl></div>
      </article>`;
    }).join('');
    qsa('[data-detail-history]').forEach(btn => btn.addEventListener('click', () => {
      const detail = byId(`history-detail-${btn.dataset.detailHistory}`);
      if (detail) detail.classList.toggle('show');
    }));
    qsa('[data-print-history]').forEach(btn => btn.addEventListener('click', () => {
      const data = JSON.parse(localStorage.getItem('sipilmu_history') || '[]');
      const item = data[Number(btn.dataset.printHistory)];
      if (!item) return;
      const printWindow = window.open('', '_blank');
      if (printWindow) { printWindow.document.write(resultToPrintHtml(item)); printWindow.document.close(); }
    }));
    qsa('[data-delete-history]').forEach(btn => btn.addEventListener('click', () => {
      const data = JSON.parse(localStorage.getItem('sipilmu_history') || '[]');
      data.splice(Number(btn.dataset.deleteHistory), 1);
      localStorage.setItem('sipilmu_history', JSON.stringify(data));
      renderHistory();
    }));
  }
  function initTheme() {
    const html = document.documentElement;
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
    const syncIcons = () => qsa('[data-theme-toggle] i').forEach(icon => { icon.className = html.getAttribute('data-theme') === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars'; });
    syncIcons();
    qsa('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      syncIcons();
    }));
  }
  function initMenu() {
    const btn = qs('#mobileMenuBtn');
    const panel = qs('#mobilePanel');
    if (!btn || !panel) return;

    const icon = btn.querySelector('i');
    const closeMenu = () => {
      panel.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Buka menu');
      if (icon) icon.className = 'bi bi-list';
    };
    const openMenu = () => {
      panel.classList.add('show');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Tutup menu');
      if (icon) icon.className = 'bi bi-x-lg';
    };

    btn.addEventListener('click', e => {
      e.stopPropagation();
      panel.classList.contains('show') ? closeMenu() : openMenu();
    });

    qsa('a', panel).forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  }
  function initYear() { qsa('[data-year]').forEach(el => el.textContent = new Date().getFullYear()); }
  function initClearHistory() { qs('#clear-history')?.addEventListener('click', () => { localStorage.removeItem('sipilmu_history'); renderHistory(); }); }
  function init() { initTheme(); initMenu(); initSearch(); initCalculator(); renderHistory(); initClearHistory(); initYear(); }
  return { init };
})();
document.addEventListener('DOMContentLoaded', SipilMU.init);
