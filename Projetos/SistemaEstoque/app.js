/**
 * Sistema de Estoque - Aplicação
 */
(function () {
  const form = document.getElementById('formProduto');
  const tabela = document.getElementById('tabelaProdutos');
  const tbody = document.getElementById('tbodyProdutos');
  const paginas = { vender: 'paginaVender', estoque: 'paginaEstoque', relatorios: 'paginaRelatorios' };
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

  function isoParaInputDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toISOString().slice(0, 10);
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
    document.getElementById('dataEntrada').value = isoParaInputDate(p.dataEntrada);
    document.getElementById('dataSaida').value = isoParaInputDate(p.dataSaida);
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
        '<tr><td colspan="10" class="empty">Nenhum produto cadastrado.</td></tr>';
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
        <td>${formatarData(p.dataEntrada)}</td>
        <td>${formatarData(p.dataSaida)}</td>
        <td class="acoes">
          <button type="button" class="btn-icon btn-movimento" data-id="${p.id}" data-nome="${escapeAttr(
          p.nome
        )}" data-qtd="${p.quantidade ?? 0}" title="Movimentar">📦</button>
          <button type="button" class="btn-icon btn-zerar" data-id="${p.id}" title="Zerar estoque">↓0</button>
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
      btn.addEventListener('click', () => toggleForm(true, parseInt(btn.dataset.id, 10)));
    });
    tbody.querySelectorAll('.btn-excluir').forEach((btn) => {
      btn.addEventListener('click', () => excluirProduto(parseInt(btn.dataset.id, 10)));
    });
    tbody.querySelectorAll('.btn-zerar').forEach((btn) => {
      btn.addEventListener('click', () => zerarEstoque(parseInt(btn.dataset.id, 10)));
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
    const dataEntradaVal = document.getElementById('dataEntrada').value;
    const dataSaidaVal = document.getElementById('dataSaida').value;
    const quantidade = Number(document.getElementById('quantidade').value) || 0;
    const dados = {
      nome: document.getElementById('nome').value.trim(),
      codigo: document.getElementById('codigo').value.trim(),
      quantidade,
      quantidadeMinima: Number(document.getElementById('quantidadeMinima').value) || 0,
      precoCusto: document.getElementById('precoCusto').value ? Number(document.getElementById('precoCusto').value) : null,
      precoVenda: document.getElementById('precoVenda').value ? Number(document.getElementById('precoVenda').value) : null,
      categoria: document.getElementById('categoria').value.trim(),
      dataEntrada: dataEntradaVal ? new Date(dataEntradaVal).toISOString() : (quantidade > 0 && !id ? new Date().toISOString() : null),
      dataSaida: dataSaidaVal ? new Date(dataSaidaVal).toISOString() : null
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
      mostrarToast('Erro ao salvar: ' + (erro.message || erro), 'error');
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

  async function zerarEstoque(id) {
    if (!id || isNaN(id)) {
      mostrarToast('ID do produto inválido.', 'error');
      return;
    }
    if (!confirm('Zerar o estoque deste produto? A quantidade será definida como 0 e você poderá cadastrar novamente pela movimentação de entrada.')) return;
    try {
      await updateProduto(id, { quantidade: 0 });
      mostrarToast('Estoque zerado. Use "Movimentar" para dar entrada novamente.');
      await carregarProdutos();
    } catch (e) {
      mostrarToast('Erro ao zerar estoque: ' + (e && e.message ? e.message : String(e)), 'error');
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

  // Navegação
  function irPara(pagina) {
    Object.keys(paginas).forEach((k) => {
      const el = document.getElementById(paginas[k]);
      el?.classList.toggle('ativa', k === pagina);
    });
    document.querySelectorAll('.nav-menu a').forEach((a) => {
      a.classList.toggle('active', a.dataset.pagina === pagina);
    });
    if (pagina === 'relatorios') carregarRelatorios();
    if (pagina === 'vender') renderizarProdutosVenda();
  }

  // Vender - PDV
  let carrinho = [];

  function renderizarProdutosVenda() {
    const lista = document.getElementById('listaProdutosVenda');
    const busca = (document.getElementById('buscaVenda')?.value || '').toLowerCase().trim();
    const filtrados = produtos.filter((p) => {
      if (!(p.quantidade > 0)) return false;
      if (!busca) return true;
      return (p.nome || '').toLowerCase().includes(busca) || (p.codigo || '').toLowerCase().includes(busca);
    });
    if (!lista) return;
    if (!filtrados.length) {
      lista.innerHTML = '<div class="carrinho-vazio" style="grid-column: 1/-1;">Nenhum produto com estoque ou nenhum produto cadastrado.</div>';
      return;
    }
    lista.innerHTML = filtrados
      .map(
        (p) => `
      <div class="produto-card-venda" data-id="${p.id}" data-nome="${escapeAttr(p.nome || '')}" data-preco="${p.precoVenda ?? 0}">
        <div class="nome">${escapeHtml(p.nome || '-')}</div>
        <div class="preco">${formatarMoeda(p.precoVenda)}</div>
        <div class="qtd">Est: ${p.quantidade}</div>
      </div>
    `
      )
      .join('');
    lista.querySelectorAll('.produto-card-venda').forEach((el) => {
      el.addEventListener('click', () => adicionarAoCarrinho(Number(el.dataset.id)));
    });
  }

  function adicionarAoCarrinho(produtoId) {
    const p = produtos.find((x) => x.id === produtoId);
    if (!p || (p.quantidade ?? 0) < 1) return;
    const existente = carrinho.find((c) => c.id === produtoId);
    if (existente) {
      if (existente.qtd >= (p.quantidade ?? 0)) return;
      existente.qtd += 1;
    } else {
      carrinho.push({ id: p.id, nome: p.nome, preco: p.precoVenda ?? 0, qtd: 1, estoque: p.quantidade ?? 0 });
    }
    atualizarCarrinhoUI();
  }

  function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter((c) => c.id !== produtoId);
    atualizarCarrinhoUI();
  }

  function alterarQtdCarrinho(produtoId, delta) {
    const item = carrinho.find((c) => c.id === produtoId);
    if (!item) return;
    const p = produtos.find((x) => x.id === produtoId);
    const max = p?.quantidade ?? 0;
    item.qtd = Math.max(0, Math.min(max, item.qtd + delta));
    if (item.qtd === 0) carrinho = carrinho.filter((c) => c.id !== produtoId);
    atualizarCarrinhoUI();
  }

  function atualizarCarrinhoUI() {
    const container = document.getElementById('carrinhoItens');
    const totalEl = document.getElementById('carrinhoTotal');
    const btnFinalizar = document.getElementById('btnFinalizarVenda');
    if (!container) return;
    if (!carrinho.length) {
      container.innerHTML = '<div class="carrinho-vazio">Nenhum item no carrinho</div>';
      totalEl.style.display = 'none';
      btnFinalizar.disabled = true;
      return;
    }
    const total = carrinho.reduce((s, c) => s + c.preco * c.qtd, 0);
    container.innerHTML = carrinho
      .map(
        (c) => `
      <div class="carrinho-item">
        <span class="nome">${escapeHtml(c.nome)} × ${c.qtd}</span>
        <span>${formatarMoeda(c.preco * c.qtd)}</span>
        <div class="controles">
          <button type="button" data-id="${c.id}" data-delta="-1">−</button>
          <span>${c.qtd}</span>
          <button type="button" data-id="${c.id}" data-delta="1">+</button>
          <button type="button" data-id="${c.id}" data-remover title="Remover">×</button>
        </div>
      </div>
    `
      )
      .join('');
    totalEl.textContent = 'Total: ' + formatarMoeda(total);
    totalEl.style.display = 'block';
    btnFinalizar.disabled = false;
    container.querySelectorAll('button[data-delta]').forEach((b) => {
      b.addEventListener('click', () => alterarQtdCarrinho(Number(b.dataset.id), Number(b.dataset.delta)));
    });
    container.querySelectorAll('button[data-remover]').forEach((b) => {
      b.addEventListener('click', () => removerDoCarrinho(Number(b.dataset.id)));
    });
  }

  async function finalizarVenda() {
    if (!carrinho.length) return;
    for (const c of carrinho) {
      const p = produtos.find((x) => x.id === c.id);
      if (!p || (p.quantidade ?? 0) < c.qtd) {
        mostrarToast(`Estoque insuficiente para "${c.nome}". Atualize a página.`, 'error');
        return;
      }
    }
    const itens = carrinho.map((c) => ({
      produtoId: c.id,
      nome: c.nome,
      qtd: c.qtd,
      precoUnit: c.preco
    }));
    const total = itens.reduce((s, i) => s + i.precoUnit * i.qtd, 0);
    try {
      await addVenda({ itens, total });
      for (const item of itens) {
        await movimentar(item.produtoId, item.qtd, 'saida');
      }
      carrinho = [];
      atualizarCarrinhoUI();
      carregarProdutos();
      mostrarToast('Venda finalizada com sucesso!');
    } catch (e) {
      mostrarToast('Erro: ' + (e.message || e), 'error');
    }
  }

  // Relatórios
  async function carregarRelatorios() {
    const container = document.getElementById('relatoriosConteudo');
    if (!container) return;
    const vendas = await getVendas();
    const totalProdutos = produtos.length;
    const totalVendas = vendas.length;
    const valorTotalVendas = vendas.reduce((s, v) => s + (v.total ?? 0), 0);
    const baixoEstoque = produtos.filter(
      (p) => (p.quantidade ?? 0) <= (p.quantidadeMinima ?? 0) && (p.quantidadeMinima ?? 0) > 0
    ).length;
    container.innerHTML = `
      <div class="relatorio-card">
        <div class="label">Total de Produtos</div>
        <div class="valor">${totalProdutos}</div>
      </div>
      <div class="relatorio-card">
        <div class="label">Vendas Realizadas</div>
        <div class="valor">${totalVendas}</div>
      </div>
      <div class="relatorio-card">
        <div class="label">Valor Total em Vendas</div>
        <div class="valor">${formatarMoeda(valorTotalVendas)}</div>
      </div>
      <div class="relatorio-card">
        <div class="label">Produtos com Estoque Baixo</div>
        <div class="valor">${baixoEstoque}</div>
      </div>
    `;
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

  document.querySelectorAll('.nav-menu a').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      irPara(a.dataset.pagina);
    });
  });
  document.getElementById('buscaVenda')?.addEventListener('input', () => renderizarProdutosVenda());
  document.getElementById('buscaVenda')?.addEventListener('keyup', () => renderizarProdutosVenda());
  document.getElementById('btnFinalizarVenda')?.addEventListener('click', finalizarVenda);

  // Init
  initDemoBanner();
  toggleForm(false);
  carregarProdutos().then(() => {
    irPara('vender');
  });
})();
