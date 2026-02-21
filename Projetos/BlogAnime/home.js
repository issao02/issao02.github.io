/**
 * Carrega as notícias automaticamente e renderiza na home.
 * - HTTP/HTTPS: usa fetch com lista.json
 * - file://: usa lista.js (script) + iframes para ler o HTML
 * - Cards limitados a 9 por página com paginação
 */
(function () {
  const CARDS_POR_PAGINA = 9;
  const gridEl = document.getElementById('noticias-grid');
  const listaEl = document.getElementById('ultimas-lista');
  const loadingEl = document.getElementById('loading');
  const paginacaoEl = document.getElementById('paginacao');

  if (!gridEl || !listaEl) return;

  const isLocal = window.location.protocol === 'file:';
  const BASE = isLocal ? 'noticias/' : (document.currentScript?.src ? new URL(document.currentScript.src).href.replace(/\/[^/]+$/, '/') + 'noticias/' : 'noticias/');

  let todasNoticias = [];
  let paginaAtual = 1;

  function formatarData(str) {
    if (!str) return '';
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatarDataDDMMYYYY(str) {
    if (!str) return '';
    const d = new Date(str);
    if (isNaN(d)) return str;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function renderizarCards(noticias) {
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
  }

  function renderizarPaginacao(total, pagina) {
    if (!paginacaoEl || total <= CARDS_POR_PAGINA) return;
    const totalPaginas = Math.ceil(total / CARDS_POR_PAGINA);
    const inicio = (pagina - 1) * CARDS_POR_PAGINA;
    const fim = Math.min(inicio + CARDS_POR_PAGINA, total);
    let html = '<div class="paginacao-info">Página ' + pagina + ' de ' + totalPaginas + ' (' + inicio + '-' + fim + ' de ' + total + ')</div>';
    html += '<div class="paginacao-botoes">';
    html += '<button type="button" class="paginacao-btn paginacao-prev" ' + (pagina <= 1 ? 'disabled' : '') + '>Anterior</button>';
    html += '<div class="paginacao-numeros">';
    const maxVisiveis = 5;
    let inicioNum = Math.max(1, pagina - Math.floor(maxVisiveis / 2));
    const fimNum = Math.min(totalPaginas, inicioNum + maxVisiveis - 1);
    inicioNum = Math.max(1, fimNum - maxVisiveis + 1);
    if (inicioNum > 1) html += '<button type="button" class="paginacao-btn paginacao-num" data-pag="1">1</button><span class="paginacao-ellipsis">…</span>';
    for (let i = inicioNum; i <= fimNum; i++) {
      html += '<button type="button" class="paginacao-btn paginacao-num' + (i === pagina ? ' ativo' : '') + '" data-pag="' + i + '">' + i + '</button>';
    }
    if (fimNum < totalPaginas) html += '<span class="paginacao-ellipsis">…</span><button type="button" class="paginacao-btn paginacao-num" data-pag="' + totalPaginas + '">' + totalPaginas + '</button>';
    html += '</div>';
    html += '<button type="button" class="paginacao-btn paginacao-next" ' + (pagina >= totalPaginas ? 'disabled' : '') + '>Próxima</button>';
    html += '</div>';
    paginacaoEl.innerHTML = html;
    paginacaoEl.style.display = 'flex';
    paginacaoEl.querySelector('.paginacao-prev')?.addEventListener('click', () => irParaPagina(pagina - 1));
    paginacaoEl.querySelector('.paginacao-next')?.addEventListener('click', () => irParaPagina(pagina + 1));
    paginacaoEl.querySelectorAll('.paginacao-num').forEach(btn => {
      btn.addEventListener('click', () => irParaPagina(parseInt(btn.dataset.pag, 10)));
    });
  }

  function irParaPagina(pag) {
    if (pag < 1 || pag > Math.ceil(todasNoticias.length / CARDS_POR_PAGINA)) return;
    paginaAtual = pag;
    const inicio = (pag - 1) * CARDS_POR_PAGINA;
    const paginaNoticias = todasNoticias.slice(inicio, inicio + CARDS_POR_PAGINA);
    renderizarCards(paginaNoticias);
    renderizarPaginacao(todasNoticias.length, pag);
    window.scrollTo({ top: gridEl.offsetTop - 80, behavior: 'smooth' });
  }

  function renderizar(noticias) {
    if (noticias.length === 0) {
      gridEl.innerHTML = '<p style="color:var(--text-muted)">Nenhuma notícia publicada ainda.</p>';
      if (paginacaoEl) paginacaoEl.style.display = 'none';
    } else {
      noticias.sort((a, b) => new Date(b.data) - new Date(a.data));
      todasNoticias = noticias;
      paginaAtual = 1;
      gridEl.style.display = 'grid';
      const primeiraPagina = noticias.slice(0, CARDS_POR_PAGINA);
      renderizarCards(primeiraPagina);
      renderizarPaginacao(noticias.length, 1);
      listaEl.innerHTML = noticias.map(n => `
        <li><a href="${BASE + n.arquivo}"><span class="data-ddmm">${formatarDataDDMMYYYY(n.data)}</span> — ${(n.titulo || '').replace(/</g, '&lt;')}</a></li>
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
