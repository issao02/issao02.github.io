/**
 * Carrega as notícias automaticamente e renderiza na home.
 * - HTTP/HTTPS: usa fetch com lista.json
 * - file://: usa lista.js (script) + iframes para ler o HTML
 */
(function () {
  const gridEl = document.getElementById('noticias-grid');
  const listaEl = document.getElementById('ultimas-lista');
  const loadingEl = document.getElementById('loading');

  if (!gridEl || !listaEl) return;

  const isLocal = window.location.protocol === 'file:';
  const BASE = isLocal ? 'noticias/' : (document.currentScript?.src ? new URL(document.currentScript.src).href.replace(/\/[^/]+$/, '/') + 'noticias/' : 'noticias/');

  function formatarData(str) {
    if (!str) return '';
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function renderizar(noticias) {
    if (noticias.length === 0) {
      gridEl.innerHTML = '<p style="color:var(--text-muted)">Nenhuma notícia publicada ainda.</p>';
    } else {
      noticias.sort((a, b) => new Date(b.data) - new Date(a.data));
      gridEl.style.display = 'grid';
      gridEl.innerHTML = noticias.map(n => `
        <a href="${BASE + n.arquivo}" class="noticia-card">
          <div class="noticia-card-imagem">
            ${n.imagem ? `<img src="${n.imagem}" alt="${(n.titulo || '').replace(/"/g, '&quot;')}" loading="lazy">` : ''}
          </div>
          <div class="noticia-card-body">
            <div class="noticia-card-data">${formatarData(n.data)}</div>
            <h2 class="noticia-card-titulo">${(n.titulo || '').replace(/</g, '&lt;')}</h2>
            <p class="noticia-card-preview">${(n.preview || '').replace(/</g, '&lt;')}</p>
          </div>
        </a>
      `).join('');
      listaEl.innerHTML = noticias.map(n => `
        <li><a href="${BASE + n.arquivo}">${(n.titulo || '').replace(/</g, '&lt;')}<span class="data-mini">${formatarData(n.data)}</span></a></li>
      `).join('');
    }
    if (loadingEl) loadingEl.style.display = 'none';
  }

  if (isLocal) {
    // Modo file://: usa lista.js com metadata completa (script funciona localmente)
    const noticias = window.LISTA_NOTICIAS || [];
    const validas = noticias.filter(n => n && (typeof n === 'string' ? !n.startsWith('_') : n.arquivo && !n.arquivo.startsWith('_')));
    const normalizadas = validas.map(n => typeof n === 'string' ? { arquivo: n, titulo: '', data: '', imagem: '', preview: '' } : n);
    renderizar(normalizadas);
  } else {
    // Modo HTTP: fetch
    (async function () {
      try {
        const res = await fetch(BASE + 'lista.json');
        if (!res.ok) throw new Error('lista.json não encontrado (HTTP ' + res.status + ')');
        const arquivos = await res.json();
        if (!Array.isArray(arquivos) || arquivos.length === 0) {
          renderizar([]);
          return;
        }

        const noticias = [];
        for (const arquivo of arquivos) {
          if (arquivo.startsWith('_')) continue;
          try {
            const r = await fetch(BASE + arquivo);
            const html = await r.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const metaEl = doc.getElementById('noticia-meta');
            const conteudoEl = doc.getElementById('noticia-conteudo');
            if (!metaEl || !conteudoEl) continue;
            const meta = JSON.parse(metaEl.textContent.trim());
            const p = conteudoEl.querySelector('p');
            const preview = p ? p.textContent.trim().slice(0, 150) + (p.textContent.length > 150 ? '...' : '') : '';
            noticias.push({ arquivo, titulo: meta.titulo || '', data: meta.data || '', imagem: meta.imagem || '', preview });
          } catch (_) {}
        }
        renderizar(noticias);
      } catch (e) {
        console.error('Erro ao carregar notícias:', e);
        gridEl.innerHTML = '<p style="color:var(--text-muted)">Erro: ' + (e.message || 'falha no fetch') + '. Verifique lista.json.</p>';
        if (loadingEl) loadingEl.style.display = 'none';
      }
    })();
  }
})();
