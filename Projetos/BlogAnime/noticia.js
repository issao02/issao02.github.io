/**
 * Script para páginas individuais de notícia.
 * Preenche título, data e imagem a partir do #noticia-meta.
 * Renderiza a lista de últimas noticias na sidebar.
 */
(function () {
  const metaEl = document.getElementById('noticia-meta');
  const tituloEl = document.getElementById('noticia-titulo-dynamic');
  const dataEl = document.querySelector('.noticia-data-dynamic');
  const imagemEl = document.querySelector('.noticia-imagem-dynamic');
  const listaEl = document.getElementById('lista-ultimas');

  // Preencher meta da notícia atual
  if (metaEl) {
    try {
      const meta = JSON.parse(metaEl.textContent.trim());
      if (tituloEl) tituloEl.textContent = meta.titulo || '';
      if (dataEl) dataEl.textContent = formatarData(meta.data || '');
      if (imagemEl && meta.imagem) {
        imagemEl.innerHTML = `<img src="${meta.imagem}" alt="${meta.titulo || ''}">`;
      }
    } catch (_) {}
  }

  // Carregar lista de últimas notícias (excluindo a atual)
  const arquivoAtual = window.location.pathname.split('/').pop() || 
    (window.location.href.split('/').pop() || '').split('?')[0];
  const base = '';
  const isLocal = window.location.protocol === 'file:';

  function renderizarLista(noticias) {
    if (!listaEl) return;
    const outras = noticias
      .filter(n => {
        const arq = typeof n === 'string' ? n : n.arquivo;
        return arq && arq !== arquivoAtual && !arq.startsWith('_');
      })
      .map(n => typeof n === 'string' ? { arquivo: n, titulo: n, data: '' } : n)
      .sort((a, b) => new Date(b.data) - new Date(a.data));
    listaEl.innerHTML = outras.length
      ? outras.map(n => `<li><a href="${base + n.arquivo}">${(n.titulo || '').replace(/</g, '&lt;')} — ${formatarData(n.data)}</a></li>`).join('')
      : '<li>Nenhuma outra notícia.</li>';
  }

  if (isLocal && window.LISTA_NOTICIAS) {
    renderizarLista(window.LISTA_NOTICIAS);
  } else if (!isLocal) {
    (async function () {
      if (!listaEl) return;
      try {
        const res = await fetch(base + 'lista.json');
        if (!res.ok) throw new Error();
        const arquivos = await res.json();
        const noticias = [];
        for (const arq of arquivos) {
          if (arq === arquivoAtual) continue;
          try {
            const r = await fetch(base + arq);
            const html = await r.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const m = doc.getElementById('noticia-meta');
            if (!m) continue;
            const meta = JSON.parse(m.textContent.trim());
            noticias.push({ arquivo: arq, titulo: meta.titulo || 'Sem título', data: meta.data || '' });
          } catch (_) {}
        }
        renderizarLista(noticias);
      } catch (_) {
        listaEl.innerHTML = '<li>Nenhuma outra notícia.</li>';
      }
    })();
  } else {
    listaEl.innerHTML = '<li>Carregue lista.js antes de noticia.js para ver as outras notícias.</li>';
  }
})();

function formatarData(str) {
  if (!str) return '';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
