/**
 * Sistema de Estoque - Aplicação
 */
(function () {
  const form = document.getElementById('formProduto');
  const tabela = document.getElementById('tabelaProdutos');
  const tbody = document.getElementById('tbodyProdutos');
  const inputBusca = document.getElementById('inputBusca');
  const selectCategoria = document.getElementById('filtroCategoria');
  const btnNovo = document.getElementById('btnNovo');
  const btnCancelar = document.getElementById('btnCancelar');
  const secaoForm = document.getElementById('secaoForm');
  const secaoLista = document.getElementById('secaoLista');
  const tituloForm = document.getElementById('tituloForm');
  const alertasContainer = document.getElementById('alertasBaixoEstoque');
  const modalMovimento = document.getElementById('modalMovimento');
  const btnFecharModal = document.getElementById('btnFecharModal');
  const formMovimento = document.getElementById('formMovimento');
  const tipoMovimentoSpan = document.getElementById('tipoMovimentoSpan');
  const idProdutoMovimento = document.getElementById('idProdutoMovimento');
  const nomeProdutoMovimento = document.getElementById('nomeProdutoMovimento');
  const quantidadeAtualSpan = document.getElementById('quantidadeAtualSpan');

  let produtos = [];
  let editandoId = null;
  let tipoMovimentoAtual = 'entrada';

  function formatarMoeda(valor) {
    if (valor == null || valor === '') return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      Number(valor)
    );
  }

  function formatarData(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR');
  }

  function mostrarToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast toast-' + tipo + ' toast-visible';
    setTimeout(() => toast.classList.remove('toast-visible'), 2500);
  }

  function toggleForm(mostrar, id = null) {
    secaoForm.classList.toggle('hidden', !mostrar);
    secaoLista.classList.toggle('hidden', mostrar);
    if (mostrar) {
      editandoId = id;
      tituloForm.textContent = id ? 'Editar Produto' : 'Novo Produto';
      if (id) carregarProdutoParaEdicao(id);
      else limparForm();
    }
  }

  function limparForm() {
    form.reset();
    document.getElementById('produtoId').value = '';
    editandoId = null;
  }

  async function carregarProdutoParaEdicao(id) {
    const p = await getProdutoById(id);
    if (!p) return;
    document.getElementById('produtoId').value = p.id;
    document.getElementById('nome').value = p.nome || '';
    document.getElementById('codigo').value = p.codigo || '';
    document.getElementById('quantidade').value = p.quantidade ?? 0;
    document.getElementById('quantidadeMinima').value = p.quantidadeMinima ?? 0;
    document.getElementById('precoCusto').value = p.precoCusto ?? '';
    document.getElementById('precoVenda').value = p.precoVenda ?? '';
    document.getElementById('categoria').value = p.categoria || '';
  }

  function filtrarProdutos() {
    const busca = (inputBusca?.value || '').toLowerCase().trim();
    const cat = selectCategoria?.value || '';
    return produtos.filter((p) => {
      const matchBusca =
        !busca || (p.nome || '').toLowerCase().includes(busca) || (p.codigo || '').toLowerCase().includes(busca);
      const matchCat = !cat || (p.categoria || '') === cat;
      return matchBusca && matchCat;
    });
  }

  function obterCategorias() {
    const cats = new Set(produtos.map((p) => p.categoria).filter(Boolean));
    return [...cats].sort();
  }

  function renderizarTabela(lista) {
    if (!tbody) return;
    if (!lista.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="empty">Nenhum produto cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = lista
      .map(
        (p) => `
      <tr class="${(p.quantidade || 0) <= (p.quantidadeMinima || 0) ? 'alerta' : ''}">
        <td>${escapeHtml(p.codigo || '-')}</td>
        <td>${escapeHtml(p.nome || '-')}</td>
        <td class="num">${Number(p.quantidade ?? 0)}</td>
        <td class="num">${Number(p.quantidadeMinima ?? 0)}</td>
        <td>${formatarMoeda(p.precoCusto)}</td>
        <td>${formatarMoeda(p.precoVenda)}</td>
        <td>${escapeHtml(p.categoria || '-')}</td>
        <td class="acoes">
          <button type="button" class="btn-icon btn-movimento" data-id="${p.id}" data-nome="${escapeAttr(
          p.nome
        )}" data-qtd="${p.quantidade ?? 0}" title="Movimentar">📦</button>
          <button type="button" class="btn-icon btn-editar" data-id="${p.id}" title="Editar">✏️</button>
          <button type="button" class="btn-icon btn-excluir" data-id="${p.id}" title="Excluir">🗑️</button>
        </td>
      </tr>
    `
      )
      .join('');
    bindAcoesTabela();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function bindAcoesTabela() {
    tbody.querySelectorAll('.btn-editar').forEach((btn) => {
      btn.addEventListener('click', () => toggleForm(true, Number(btn.dataset.id)));
    });
    tbody.querySelectorAll('.btn-excluir').forEach((btn) => {
      btn.addEventListener('click', () => excluirProduto(Number(btn.dataset.id)));
    });
    tbody.querySelectorAll('.btn-movimento').forEach((btn) => {
      btn.addEventListener('click', () => abrirModalMovimento(btn.dataset));
    });
  }

  function renderizarAlertas() {
    const baixo = produtos.filter(
      (p) => (p.quantidade ?? 0) <= (p.quantidadeMinima ?? 0) && (p.quantidadeMinima ?? 0) > 0
    );
    if (!alertasContainer) return;
    if (!baixo.length) {
      alertasContainer.innerHTML = '';
      return;
    }
    alertasContainer.innerHTML = `
      <div class="alerta-baixo-estoque">
        <strong>⚠️ Atenção:</strong> ${baixo.length} produto(s) com estoque baixo.
        ${baixo.map((p) => `<span class="alerta-item">${escapeHtml(p.nome)} (${p.quantidade})</span>`).join(', ')}
      </div>
    `;
  }

  function atualizarFiltroCategoria() {
    const cats = obterCategorias();
    if (selectCategoria) {
      const val = selectCategoria.value;
      selectCategoria.innerHTML =
        '<option value="">Todas as categorias</option>' +
        cats.map((c) => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
      selectCategoria.value = val || '';
    }
    const datalist = document.getElementById('listaCategorias');
    if (datalist) {
      datalist.innerHTML = cats.map((c) => `<option value="${escapeAttr(c)}">`).join('');
    }
  }

  async function carregarProdutos() {
    try {
      produtos = await getProdutos();
      renderizarTabela(filtrarProdutos());
      renderizarAlertas();
      atualizarFiltroCategoria();
    } catch (e) {
      mostrarToast('Erro ao carregar produtos: ' + e.message, 'error');
    }
  }

  async function salvarProduto(e) {
    e.preventDefault();
    const id = document.getElementById('produtoId').value;
    const dados = {
      nome: document.getElementById('nome').value.trim(),
      codigo: document.getElementById('codigo').value.trim(),
      quantidade: Number(document.getElementById('quantidade').value) || 0,
      quantidadeMinima: Number(document.getElementById('quantidadeMinima').value) || 0,
      precoCusto: document.getElementById('precoCusto').value ? Number(document.getElementById('precoCusto').value) : null,
      precoVenda: document.getElementById('precoVenda').value ? Number(document.getElementById('precoVenda').value) : null,
      categoria: document.getElementById('categoria').value.trim()
    };
    if (!dados.nome) {
      mostrarToast('Informe o nome do produto.', 'error');
      return;
    }
    try {
      if (id) {
        await updateProduto(id, dados);
        mostrarToast('Produto atualizado!');
      } else {
        await addProduto(dados);
        mostrarToast('Produto cadastrado!');
      }
      toggleForm(false);
      carregarProdutos();
    } catch (erro) {
      if (erro.name === 'ConstraintError' || (erro.message && erro.message.includes('codigo'))) {
        mostrarToast('Código já existe. Use outro código.', 'error');
      } else {
        mostrarToast('Erro ao salvar: ' + (erro.message || erro), 'error');
      }
    }
  }

  async function excluirProduto(id) {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      await deleteProduto(id);
      mostrarToast('Produto excluído.');
      carregarProdutos();
    } catch (e) {
      mostrarToast('Erro ao excluir: ' + e.message, 'error');
    }
  }

  function abrirModalMovimento(data) {
    tipoMovimentoAtual = 'entrada';
    idProdutoMovimento.value = data.id;
    nomeProdutoMovimento.textContent = data.nome || 'Produto';
    quantidadeAtualSpan.textContent = data.qtd ?? 0;
    tipoMovimentoSpan.textContent = 'Entrada';
    document.getElementById('quantidadeMovimento').value = '';
    document.getElementById('tipoEntrada').checked = true;
    document.getElementById('tipoSaida').checked = false;
    modalMovimento?.classList.add('open');
  }

  function fecharModal() {
    modalMovimento?.classList.remove('open');
  }

  function trocarTipoMovimento(tipo) {
    tipoMovimentoAtual = tipo;
    tipoMovimentoSpan.textContent = tipo === 'entrada' ? 'Entrada' : 'Saída';
  }

  async function salvarMovimento(e) {
    e.preventDefault();
    const qtd = Number(document.getElementById('quantidadeMovimento').value) || 0;
    if (qtd <= 0) {
      mostrarToast('Informe uma quantidade válida.', 'error');
      return;
    }
    const id = Number(idProdutoMovimento.value);
    try {
      await movimentar(id, qtd, tipoMovimentoAtual);
      mostrarToast(tipoMovimentoAtual === 'entrada' ? 'Entrada registrada!' : 'Saída registrada!');
      fecharModal();
      carregarProdutos();
    } catch (erro) {
      mostrarToast(erro.message || 'Erro na movimentação', 'error');
    }
  }

  // Demo banner
  function initDemoBanner() {
    const banner = document.getElementById('demoBanner');
    const btnFechar = document.getElementById('btnFecharDemo');
    if (!banner) return;
    const escondido = sessionStorage.getItem('estoqueDemoFechado');
    if (escondido) {
      banner.classList.add('hidden');
    }
    btnFechar?.addEventListener('click', () => {
      banner.classList.add('hidden');
      sessionStorage.setItem('estoqueDemoFechado', '1');
    });
  }

  // Event listeners
  form?.addEventListener('submit', salvarProduto);
  btnNovo?.addEventListener('click', () => toggleForm(true));
  btnCancelar?.addEventListener('click', () => toggleForm(false));
  inputBusca?.addEventListener('input', () => renderizarTabela(filtrarProdutos()));
  inputBusca?.addEventListener('keyup', () => renderizarTabela(filtrarProdutos()));
  selectCategoria?.addEventListener('change', () => renderizarTabela(filtrarProdutos()));
  btnFecharModal?.addEventListener('click', fecharModal);
  document.getElementById('tipoEntrada')?.addEventListener('change', () => trocarTipoMovimento('entrada'));
  document.getElementById('tipoSaida')?.addEventListener('change', () => trocarTipoMovimento('saida'));
  formMovimento?.addEventListener('submit', salvarMovimento);
  modalMovimento?.addEventListener('click', (e) => {
    if (e.target === modalMovimento) fecharModal();
  });

  // Init
  initDemoBanner();
  carregarProdutos();
  toggleForm(false);
})();
