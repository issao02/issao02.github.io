/**
 * Sistema de Gerenciamento de Permissões - Aplicação principal
 */
const ROTAS = {
  login: 'login',
  dashboard: 'dashboard',
  usuarios: 'usuarios',
  perfis: 'perfis',
  permissoes: 'permissoes',
  auditoria: 'auditoria'
};

let rotaAtual = ROTAS.login;

function getRota() {
  const hash = (location.hash || '').slice(1);
  if (ROTAS[hash]) return ROTAS[hash];
  return isLoggedIn() ? ROTAS.dashboard : ROTAS.login;
}

function navegar(rota) {
  rotaAtual = rota;
  location.hash = rota;
  render();
}

async function init() {
  await initDB();
  rotaAtual = getRota();
  if (!isLoggedIn() && rotaAtual !== ROTAS.login) {
    location.hash = '';
    rotaAtual = ROTAS.login;
  }
  render();
  document.getElementById('app')?.addEventListener('input', (e) => {
    if (e.target.closest('.filter-bar')) {
      if (rotaAtual === ROTAS.usuarios) bindUsuarios();
      else if (rotaAtual === ROTAS.perfis) bindPerfis();
      else if (rotaAtual === ROTAS.permissoes) bindPermissoes();
      else if (rotaAtual === ROTAS.auditoria) bindAuditoria();
    }
  });
  document.getElementById('app')?.addEventListener('change', (e) => {
    if (e.target.closest('.filter-bar')) {
      if (rotaAtual === ROTAS.usuarios) bindUsuarios();
      else if (rotaAtual === ROTAS.perfis) bindPerfis();
      else if (rotaAtual === ROTAS.permissoes) bindPermissoes();
      else if (rotaAtual === ROTAS.auditoria) bindAuditoria();
    }
  });
  window.addEventListener('hashchange', () => {
    rotaAtual = getRota();
    if (!isLoggedIn() && rotaAtual !== ROTAS.login) {
      location.hash = '';
      rotaAtual = ROTAS.login;
    }
    render();
  });
}

function render() {
  const main = document.getElementById('app');
  if (!main) return;

  if (!isLoggedIn() && rotaAtual !== ROTAS.login) {
    navegar(ROTAS.login);
    return;
  }

  if (rotaAtual === ROTAS.login) {
    main.innerHTML = telaLogin();
    bindLogin();
    return;
  }

  main.innerHTML = `
    <header class="header">
      <div class="logo">🔐 Gerenciamento de Permissões</div>
      <button type="button" class="menu-toggle" id="menuToggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <nav class="nav" id="navMenu">
        <a href="#dashboard" class="nav-link ${rotaAtual === ROTAS.dashboard ? 'active' : ''}">Dashboard</a>
        ${temPermissao('*') || temPermissao('usuarios.visualizar') || temPermissao('usuarios.criar') ? `<a href="#usuarios" class="nav-link ${rotaAtual === ROTAS.usuarios ? 'active' : ''}">Usuários</a>` : ''}
        ${temPermissao('*') || temPermissao('perfis.visualizar') || temPermissao('perfis.criar') ? `<a href="#perfis" class="nav-link ${rotaAtual === ROTAS.perfis ? 'active' : ''}">Perfis</a>` : ''}
        ${temPermissao('*') ? `<a href="#permissoes" class="nav-link ${rotaAtual === ROTAS.permissoes ? 'active' : ''}">Permissões</a>` : ''}
        ${temPermissao('*') || temPermissao('auditoria.visualizar') ? `<a href="#auditoria" class="nav-link ${rotaAtual === ROTAS.auditoria ? 'active' : ''}">Auditoria</a>` : ''}
        <div class="nav-user-mobile">
          <span>${getUsuarioLogado().nome}</span>
          <button type="button" class="btn btn-outline btn-sm" onclick="logout(); navegar('login');">Sair</button>
        </div>
      </nav>
      <div class="user-menu">
        <span>${getUsuarioLogado().nome}</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="logout(); navegar('login');">Sair</button>
      </div>
    </header>
    <div class="content">${getConteudoRota()}</div>
  `;

  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('navMenu')?.classList.toggle('nav-open');
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => document.getElementById('navMenu')?.classList.remove('nav-open'));
  });

  bindRota();
}

function getConteudoRota() {
  switch (rotaAtual) {
    case ROTAS.dashboard: return telaDashboard();
    case ROTAS.usuarios: return telaUsuarios();
    case ROTAS.perfis: return telaPerfis();
    case ROTAS.permissoes: return telaPermissoes();
    case ROTAS.auditoria: return telaAuditoria();
    default: return telaDashboard();
  }
}

function telaLogin() {
  return `
    <div class="login-box">
      <h1>🔐 Gerenciamento de Permissões</h1>
      <p class="login-sub">Demo - Estrutura pronta para migrar ao backend</p>
      <form id="formLogin" class="login-form">
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" name="email" required placeholder="admin@demo.com" autocomplete="username">
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input type="password" name="senha" required placeholder="admin123" autocomplete="current-password">
        </div>
        <div id="loginErro" class="erro" style="display:none;"></div>
        <button type="submit" class="btn btn-primary btn-block">Entrar</button>
      </form>
      <p class="login-hint">Credenciais: admin@demo.com / admin123</p>
    </div>
  `;
}

function bindLogin() {
  const form = document.getElementById('formLogin');
  const erro = document.getElementById('loginErro');
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    erro.style.display = 'none';
    const email = form.email.value.trim();
    const senha = form.senha.value;
    const res = await login(email, senha);
    if (res.ok) navegar(ROTAS.dashboard);
    else {
      erro.textContent = res.msg;
      erro.style.display = 'block';
    }
  };
}

function telaDashboard() {
  return `
    <div class="dashboard">
      <h2>Dashboard</h2>
      <div class="cards">
        <div class="card">
          <span class="card-num" id="totalUsuarios">-</span>
          <span class="card-label">Usuários</span>
        </div>
        <div class="card">
          <span class="card-num" id="totalPerfis">-</span>
          <span class="card-label">Perfis</span>
        </div>
        <div class="card">
          <span class="card-num" id="totalPermissoes">-</span>
          <span class="card-label">Permissões</span>
        </div>
      </div>
      <div class="welcome">
        <p>Bem-vindo, <strong>${getUsuarioLogado().nome}</strong>.</p>
        <p>Use o menu para gerenciar usuários, perfis e permissões.</p>
      </div>
    </div>
  `;
}

function telaUsuarios() {
  const podeCriar = temPermissao('*') || temPermissao('usuarios.criar');
  return `
    <div class="crud-screen">
      <div class="crud-header">
        <h2>Usuários</h2>
        ${podeCriar ? '<button type="button" class="btn btn-primary" data-action="novo">Novo usuário</button>' : ''}
      </div>
      <div class="filter-bar">
        <input type="text" id="filtroUsuarios" placeholder="Filtrar por nome, e-mail ou perfil..." class="filter-input">
        <select id="ordemUsuarios" class="filter-select">
          <option value="nome">Ordenar por nome</option>
          <option value="email">Ordenar por e-mail</option>
          <option value="perfil">Ordenar por perfil</option>
          <option value="status">Ordenar por status</option>
        </select>
        <select id="dirUsuarios" class="filter-select filter-select-sm">
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>
      <div class="crud-list" id="listaUsuarios"></div>
      <div id="modalUsuario" class="modal" style="display:none;"></div>
    </div>
  `;
}

function telaPerfis() {
  const podeCriar = temPermissao('*') || temPermissao('perfis.criar');
  return `
    <div class="crud-screen">
      <div class="crud-header">
        <h2>Perfis</h2>
        ${podeCriar ? '<button type="button" class="btn btn-primary" data-action="novo">Novo perfil</button>' : ''}
      </div>
      <div class="filter-bar">
        <input type="text" id="filtroPerfis" placeholder="Filtrar por nome ou descrição..." class="filter-input">
        <select id="ordemPerfis" class="filter-select">
          <option value="nome">Ordenar por nome</option>
          <option value="descricao">Ordenar por descrição</option>
        </select>
        <select id="dirPerfis" class="filter-select filter-select-sm">
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>
      <div class="crud-list" id="listaPerfis"></div>
      <div id="modalPerfil" class="modal" style="display:none;"></div>
    </div>
  `;
}

function telaPermissoes() {
  const podeCriar = temPermissao('*');
  return `
    <div class="crud-screen">
      <div class="crud-header">
        <h2>Catálogo de Permissões</h2>
        ${podeCriar ? '<button type="button" class="btn btn-primary" data-action="novo-permissao">Nova permissão</button>' : ''}
      </div>
      <div class="filter-bar">
        <input type="text" id="filtroPermissoes" placeholder="Filtrar por código, nome ou módulo..." class="filter-input">
        <select id="ordemPermissoes" class="filter-select">
          <option value="codigo">Ordenar por código</option>
          <option value="nome">Ordenar por nome</option>
          <option value="modulo">Ordenar por módulo</option>
        </select>
        <select id="dirPermissoes" class="filter-select filter-select-sm">
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>
      <div class="crud-list" id="listaPermissoes"></div>
      <div id="modalPermissao" class="modal" style="display:none;"></div>
    </div>
  `;
}

function telaAuditoria() {
  return `
    <div class="crud-screen auditoria-screen">
      <div class="crud-header">
        <h2>Auditoria</h2>
      </div>
      <div class="filter-bar">
        <input type="text" id="filtroAuditoria" placeholder="Filtrar por usuário ou recurso..." class="filter-input">
        <select id="filtroAcaoAuditoria" class="filter-select">
          <option value="">Todas as ações</option>
          <option value="criar">Criado</option>
          <option value="editar">Editado</option>
          <option value="excluir">Excluído</option>
        </select>
        <select id="filtroRecursoAuditoria" class="filter-select">
          <option value="">Todos os recursos</option>
          <option value="usuario">Usuário</option>
          <option value="perfil">Perfil</option>
          <option value="permissao">Permissão</option>
        </select>
      </div>
      <div class="auditoria-grid" id="listaAuditoria"></div>
    </div>
  `;
}

function bindRota() {
  switch (rotaAtual) {
    case ROTAS.dashboard: bindDashboard(); break;
    case ROTAS.usuarios: bindUsuarios(); break;
    case ROTAS.perfis: bindPerfis(); break;
    case ROTAS.permissoes: bindPermissoes(); break;
    case ROTAS.auditoria: bindAuditoria(); break;
  }
}

async function bindDashboard() {
  const [usuarios, perfis, permissoes] = await Promise.all([
    getUsuarios(),
    getPerfis(),
    getPermissoes()
  ]);
  const el = (id) => document.getElementById(id);
  if (el('totalUsuarios')) el('totalUsuarios').textContent = usuarios.length;
  if (el('totalPerfis')) el('totalPerfis').textContent = perfis.length;
  if (el('totalPermissoes')) el('totalPermissoes').textContent = permissoes.length;
}

function aplicarFiltroOrdenacao(lista, filtro, ordem, dir, tipo) {
  let itens = [...lista];
  if (filtro) {
    const f = filtro.toLowerCase().trim();
    if (tipo === 'usuarios') {
      itens = itens.filter(u => {
        const nome = (u.nome || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const perfil = (u._perfilNome || '').toLowerCase();
        return nome.includes(f) || email.includes(f) || perfil.includes(f);
      });
    } else if (tipo === 'perfis') {
      itens = itens.filter(p => {
        const nome = (p.nome || '').toLowerCase();
        const desc = (p.descricao || '').toLowerCase();
        return nome.includes(f) || desc.includes(f);
      });
    } else if (tipo === 'permissoes') {
      itens = itens.filter(p => {
        const cod = (p.codigo || '').toLowerCase();
        const nome = (p.nome || '').toLowerCase();
        const mod = (p.modulo || '').toLowerCase();
        return cod.includes(f) || nome.includes(f) || mod.includes(f);
      });
    }
  }
  const asc = dir === 'asc' ? 1 : -1;
  itens.sort((a, b) => {
    let va = a[ordem] ?? '';
    let vb = b[ordem] ?? '';
    if (ordem === 'perfil') { va = a._perfilNome ?? ''; vb = b._perfilNome ?? ''; }
    if (ordem === 'status') { va = a.ativo ? 'ativo' : 'inativo'; vb = b.ativo ? 'ativo' : 'inativo'; }
    va = String(va).toLowerCase();
    vb = String(vb).toLowerCase();
    return va.localeCompare(vb) * asc;
  });
  return itens;
}

async function bindUsuarios() {
  const lista = document.getElementById('listaUsuarios');
  if (!lista) return;
  const usuarios = await getUsuarios();
  const perfis = await getPerfis();
  const perfisMap = Object.fromEntries(perfis.map(p => [p.id, p.nome]));
  for (const u of usuarios) {
    const perfilIds = await getPerfilIdsDoUsuario(u.id);
    u._perfilNomes = perfilIds.map(pid => perfisMap[pid] || '').filter(Boolean).join(', ') || '-';
  }
  const podeEditar = temPermissao('*') || temPermissao('usuarios.editar');
  const podeExcluir = temPermissao('*') || temPermissao('usuarios.excluir');

  const filtro = (document.getElementById('filtroUsuarios')?.value || '').trim();
  const ordem = document.getElementById('ordemUsuarios')?.value || 'nome';
  const dir = document.getElementById('dirUsuarios')?.value || 'asc';
  usuarios.forEach(u => { u._perfilNome = u._perfilNomes; });
  const usuariosFiltrados = aplicarFiltroOrdenacao(usuarios, filtro, ordem, dir, 'usuarios');

  lista.innerHTML = usuariosFiltrados.map(u => `
    <div class="crud-item">
      <div class="crud-item-info">
        <strong>${u.nome}</strong>
        <span>${u.email}</span>
        <span class="badge">${u._perfilNomes}</span>
        <span class="badge ${u.ativo ? 'badge-ok' : 'badge-off'}">${u.ativo ? 'Ativo' : 'Inativo'}</span>
      </div>
      <div class="crud-item-actions">
        ${podeEditar ? `<button type="button" class="btn btn-sm btn-outline" data-edit="${u.id}">Editar</button>` : ''}
        ${podeExcluir && u.email !== 'admin@demo.com' ? `<button type="button" class="btn btn-sm btn-danger" data-del="${u.id}">Excluir</button>` : ''}
      </div>
    </div>
  `).join('') || '<p class="empty">Nenhum usuário cadastrado.</p>';

  lista.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => abrirModalUsuario(Number(btn.dataset.edit));
  });
  lista.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => excluirUsuario(Number(btn.dataset.del));
  });

  document.querySelector('[data-action="novo"]')?.addEventListener('click', () => abrirModalUsuario(null));
}

async function abrirModalUsuario(id) {
  const modal = document.getElementById('modalUsuario');
  if (!modal) return;
  const perfis = await getPerfis();
  let usuario = null;
  let perfilIds = [];
  if (id) {
    usuario = await getUsuarioById(id);
    perfilIds = await getPerfilIdsDoUsuario(id);
  }

  modal.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-box modal-wide">
      <h3>${usuario ? 'Editar usuário' : 'Novo usuário'}</h3>
      <form id="formUsuario">
        <input type="hidden" name="id" value="${usuario?.id || ''}">
        <div class="form-group">
          <label>Nome</label>
          <input type="text" name="nome" required value="${usuario?.nome || ''}">
        </div>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" name="email" required value="${usuario?.email || ''}" ${usuario ? 'readonly' : ''}>
        </div>
        <div class="form-group">
          <label>Senha ${usuario ? '(deixe em branco para manter)' : ''}</label>
          <input type="password" name="senha" ${usuario ? '' : 'required'} placeholder="••••••••">
        </div>
        <div class="form-group">
          <label>Perfis</label>
          <div class="perfis-checkboxes">
            ${perfis.map(p => `
              <label class="perfil-check-item">
                <input type="checkbox" name="perfil" value="${p.id}" ${perfilIds.includes(p.id) ? 'checked' : ''}>
                ${p.nome}
              </label>
            `).join('')}
          </div>
          <small class="form-hint">Selecione um ou mais perfis</small>
        </div>
        <div class="form-group">
          <label><input type="checkbox" name="ativo" ${(usuario?.ativo !== false) ? 'checked' : ''}> Ativo</label>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" data-close>Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;
  modal.style.display = 'flex';

  modal.querySelectorAll('[data-close]').forEach(el => {
    el.onclick = () => { modal.style.display = 'none'; };
  });

  modal.querySelector('#formUsuario').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const perfilIdsSel = [...form.querySelectorAll('input[name="perfil"]:checked')].map(c => Number(c.value));
    if (perfilIdsSel.length === 0) {
      alert('Selecione pelo menos um perfil.');
      return;
    }
    const dados = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      ativo: form.ativo.checked
    };
    if (form.id.value) dados.id = Number(form.id.value);
    if (form.senha.value) dados.senha = form.senha.value;

    try {
      if (dados.senha) dados.senha_hash = await hashPassword(dados.senha);
      delete dados.senha;
      let estadoAntes = null;
      let estadoDepois = { ...dados, perfil_ids: perfilIdsSel };
      if (dados.id) {
        const usuarioAntes = await getUsuarioById(dados.id);
        const perfilIdsAntes = await getPerfilIdsDoUsuario(dados.id);
        estadoAntes = { ...usuarioAntes, perfil_ids: perfilIdsAntes };
        delete estadoAntes.perfil_id;
      }
      const usuarioSalvo = await saveUsuario(dados);
      await setUsuarioPerfis(usuarioSalvo.id, perfilIdsSel);
      await addAuditoria(getUsuarioLogado().id, dados.id ? 'editar' : 'criar', 'usuario', estadoAntes, estadoDepois);
      modal.style.display = 'none';
      bindUsuarios();
    } catch (err) {
      alert(err.message || 'Erro ao salvar');
    }
  };
}

async function excluirUsuario(id) {
  if (!confirm('Excluir este usuário?')) return;
  try {
    const usuarioAntes = await getUsuarioById(id);
    const perfilIdsAntes = await getPerfilIdsDoUsuario(id);
    const estadoAntes = { ...usuarioAntes, perfil_ids: perfilIdsAntes };
    delete estadoAntes.perfil_id;
    await deleteUsuario(id);
    await addAuditoria(getUsuarioLogado().id, 'excluir', 'usuario', estadoAntes, null);
    bindUsuarios();
  } catch (err) {
    alert(err.message || 'Erro ao excluir');
  }
}

async function bindPerfis() {
  const lista = document.getElementById('listaPerfis');
  if (!lista) return;
  const perfis = await getPerfis();
  const podeEditar = temPermissao('*') || temPermissao('perfis.editar');
  const podeExcluir = temPermissao('*') || temPermissao('perfis.excluir');

  const filtro = (document.getElementById('filtroPerfis')?.value || '').trim();
  const ordem = document.getElementById('ordemPerfis')?.value || 'nome';
  const dir = document.getElementById('dirPerfis')?.value || 'asc';
  const perfisFiltrados = aplicarFiltroOrdenacao(perfis, filtro, ordem, dir, 'perfis');

  lista.innerHTML = perfisFiltrados.map(p => `
    <div class="crud-item">
      <div class="crud-item-info">
        <strong>${p.nome}</strong>
        <span>${p.descricao || '-'}</span>
      </div>
      <div class="crud-item-actions">
        ${podeEditar ? `<button type="button" class="btn btn-sm btn-outline" data-edit="${p.id}">Editar</button>` : ''}
        ${podeExcluir && p.nome !== 'Administrador' ? `<button type="button" class="btn btn-sm btn-danger" data-del="${p.id}">Excluir</button>` : ''}
      </div>
    </div>
  `).join('') || '<p class="empty">Nenhum perfil cadastrado.</p>';

  lista.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => abrirModalPerfil(Number(btn.dataset.edit));
  });
  lista.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => excluirPerfil(Number(btn.dataset.del));
  });

  document.querySelector('[data-action="novo"]')?.addEventListener('click', () => abrirModalPerfil(null));
}

async function abrirModalPerfil(id) {
  const modal = document.getElementById('modalPerfil');
  if (!modal) return;
  const permissoes = await getPermissoes();
  const porModulo = permissoes.reduce((acc, p) => {
    (acc[p.modulo] = acc[p.modulo] || []).push(p);
    return acc;
  }, {});
  let perfil = null;
  let permIds = [];
  if (id) {
    perfil = await getPerfilById(id);
    permIds = (await getPerfilPermissoes(id)).map(pp => pp.permissao_id);
  }

  modal.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-box modal-wide">
      <h3>${perfil ? 'Editar perfil' : 'Novo perfil'}</h3>
      <form id="formPerfil">
        <input type="hidden" name="id" value="${perfil?.id || ''}">
        <div class="form-group">
          <label>Nome</label>
          <input type="text" name="nome" required value="${perfil?.nome || ''}">
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <input type="text" name="descricao" value="${perfil?.descricao || ''}">
        </div>
        <div class="form-group">
          <label>Permissões</label>
          <div class="perm-grid">
            ${Object.entries(porModulo).map(([mod, perms]) => `
              <div class="perm-modulo perm-modulo-collapsed">
                <button type="button" class="perm-modulo-toggle" data-expand>
                  <span class="perm-modulo-nome">${mod}</span>
                  <span class="perm-modulo-chevron">▶ Expandir</span>
                </button>
                <div class="perm-modulo-list">
                  ${perms.map(perm => `
                    <label class="perm-item">
                      <input type="checkbox" name="perm" value="${perm.id}" ${permIds.includes(perm.id) ? 'checked' : ''}>
                      ${perm.nome}
                    </label>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" data-close>Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;
  modal.style.display = 'flex';

  modal.querySelectorAll('[data-close]').forEach(el => {
    el.onclick = () => { modal.style.display = 'none'; };
  });

  modal.querySelectorAll('[data-expand]').forEach(btn => {
    btn.onclick = () => {
      const modulo = btn.closest('.perm-modulo');
      modulo?.classList.toggle('perm-modulo-collapsed');
      const chevron = modulo?.querySelector('.perm-modulo-chevron');
      if (chevron) chevron.textContent = modulo?.classList.contains('perm-modulo-collapsed') ? '▶ Expandir' : '▼ Recolher';
    };
  });

  modal.querySelector('#formPerfil').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const dados = {
      nome: form.nome.value.trim(),
      descricao: form.descricao.value.trim()
    };
    if (form.id.value) dados.id = Number(form.id.value);
    const permIds = [...form.querySelectorAll('input[name="perm"]:checked')].map(c => Number(c.value));

    try {
      let estadoAntes = null;
      const estadoDepois = { ...dados, permissao_ids: permIds };
      if (dados.id) {
        const perfilAntes = await getPerfilById(dados.id);
        const permIdsAntes = (await getPerfilPermissoes(dados.id)).map(pp => pp.permissao_id);
        estadoAntes = { ...perfilAntes, permissao_ids: permIdsAntes };
      }
      const perfilSalvo = await savePerfil(dados);
      await setPerfilPermissoes(perfilSalvo.id, permIds);
      await addAuditoria(getUsuarioLogado().id, dados.id ? 'editar' : 'criar', 'perfil', estadoAntes, estadoDepois);
      modal.style.display = 'none';
      bindPerfis();
    } catch (err) {
      alert(err.message || 'Erro ao salvar');
    }
  };
}

async function excluirPerfil(id) {
  const usuarios = await getUsuarios();
  const usando = [];
  for (const u of usuarios) {
    const perfilIds = await getPerfilIdsDoUsuario(u.id);
    if (perfilIds.includes(Number(id))) usando.push(u);
  }
  if (usando.length > 0) {
    alert('Não é possível excluir: há usuários usando este perfil.');
    return;
  }
  if (!confirm('Excluir este perfil?')) return;
  try {
    const perfilAntes = await getPerfilById(id);
    const permIdsAntes = (await getPerfilPermissoes(id)).map(pp => pp.permissao_id);
    const estadoAntes = { ...perfilAntes, permissao_ids: permIdsAntes };
    await deletePerfil(id);
    await addAuditoria(getUsuarioLogado().id, 'excluir', 'perfil', estadoAntes, null);
    bindPerfis();
  } catch (err) {
    alert(err.message || 'Erro ao excluir');
  }
}

async function bindPermissoes() {
  const lista = document.getElementById('listaPermissoes');
  if (!lista) return;
  const permissoes = await getPermissoes();
  const podeEditar = temPermissao('*');
  const podeExcluir = temPermissao('*');

  const filtro = (document.getElementById('filtroPermissoes')?.value || '').trim();
  const ordem = document.getElementById('ordemPermissoes')?.value || 'codigo';
  const dir = document.getElementById('dirPermissoes')?.value || 'asc';
  const permissoesFiltradas = aplicarFiltroOrdenacao(permissoes, filtro, ordem, dir, 'permissoes');

  lista.innerHTML = permissoesFiltradas.map(p => `
    <div class="crud-item">
      <div class="crud-item-info">
        <strong><code>${p.codigo}</code></strong>
        <span>${p.nome}</span>
        <span class="badge">${p.modulo}</span>
        ${p.descricao ? `<span class="text-muted">${p.descricao}</span>` : ''}
      </div>
      <div class="crud-item-actions">
        ${podeEditar ? `<button type="button" class="btn btn-sm btn-outline" data-edit="${p.id}">Editar</button>` : ''}
        ${podeExcluir ? `<button type="button" class="btn btn-sm btn-danger" data-del="${p.id}">Excluir</button>` : ''}
      </div>
    </div>
  `).join('') || '<p class="empty">Nenhuma permissão cadastrada.</p>';

  lista.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => abrirModalPermissao(Number(btn.dataset.edit));
  });
  lista.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => excluirPermissao(Number(btn.dataset.del));
  });

  document.querySelector('[data-action="novo-permissao"]')?.addEventListener('click', () => abrirModalPermissao(null));
}

async function abrirModalPermissao(id) {
  const modal = document.getElementById('modalPermissao');
  if (!modal) return;
  let permissao = null;
  if (id) permissao = await getPermissaoById(id);

  modal.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-box">
      <h3>${permissao ? 'Editar permissão' : 'Nova permissão'}</h3>
      <form id="formPermissao">
        <input type="hidden" name="id" value="${permissao?.id || ''}">
        <div class="form-group">
          <label>Código</label>
          <input type="text" name="codigo" required placeholder="ex: vendas.criar" value="${permissao?.codigo || ''}" ${permissao ? 'readonly' : ''}>
          <small class="form-hint">Formato: modulo.acao (ex: usuarios.editar)</small>
        </div>
        <div class="form-group">
          <label>Nome</label>
          <input type="text" name="nome" required placeholder="Ex: Criar vendas" value="${permissao?.nome || ''}">
        </div>
        <div class="form-group">
          <label>Módulo</label>
          <input type="text" name="modulo" required placeholder="ex: vendas" value="${permissao?.modulo || ''}">
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <input type="text" name="descricao" placeholder="Descrição opcional" value="${permissao?.descricao || ''}">
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" data-close>Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;
  modal.style.display = 'flex';

  modal.querySelectorAll('[data-close]').forEach(el => {
    el.onclick = () => { modal.style.display = 'none'; };
  });

  modal.querySelector('#formPermissao').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const dados = {
      codigo: form.codigo.value.trim().toLowerCase(),
      nome: form.nome.value.trim(),
      modulo: form.modulo.value.trim().toLowerCase(),
      descricao: form.descricao.value.trim() || null
    };
    if (form.id.value) dados.id = Number(form.id.value);

    try {
      const permAntes = dados.id ? await getPermissaoById(dados.id) : null;
      await savePermissao(dados);
      await addAuditoria(getUsuarioLogado().id, dados.id ? 'editar' : 'criar', 'permissao', permAntes, dados);
      modal.style.display = 'none';
      bindPermissoes();
    } catch (err) {
      alert(err.message || 'Erro ao salvar');
    }
  };
}

async function excluirPermissao(id) {
  if (!confirm('Excluir esta permissão? Ela será removida de todos os perfis.')) return;
  try {
    const permAntes = await getPermissaoById(id);
    await deletePermissao(id);
    await addAuditoria(getUsuarioLogado().id, 'excluir', 'permissao', permAntes, null);
    bindPermissoes();
  } catch (err) {
    alert(err.message || 'Erro ao excluir');
  }
}

const LABEL_ACAO = { criar: 'Criado', editar: 'Editado', excluir: 'Excluído' };
const LABEL_RECURSO = { usuario: 'Usuário', perfil: 'Perfil', permissao: 'Permissão' };
const LABEL_CAMPO = {
  nome: 'Nome', email: 'E-mail', ativo: 'Ativo', descricao: 'Descrição',
  codigo: 'Código', modulo: 'Módulo', perfil_id: 'Perfil', perfil_ids: 'Perfis',
  permissao_ids: 'Permissões'
};

function parseDados(jsonStr) {
  if (!jsonStr) return null;
  try {
    return typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
  } catch (_) {
    return null;
  }
}

function formatarValor(v, k, perfisMap) {
  if (v === null || v === undefined || v === '') return '-';
  if (k === 'perfil_ids' && Array.isArray(v)) {
    return v.map(id => perfisMap[id] || id).join(', ') || '-';
  }
  if (k === 'perfil_id') {
    return perfisMap[v] || perfisMap[Number(v)] || v || '-';
  }
  if (k === 'ativo') return v ? 'Sim' : 'Não';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function formatarDadosAuditoria(jsonStr, perfisMap = {}, permissoesMap = {}) {
  const obj = parseDados(jsonStr);
  if (!obj) return null;
  const linhas = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'senha_hash' || k === 'senha' || k === 'id' || k === 'criado_em' || k === 'atualizado_em') continue;
    if (v !== null && v !== undefined && v !== '') {
      const val = formatarValor(v, k, perfisMap, permissoesMap);
      const esc = (s) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const label = LABEL_CAMPO[k] || k;
      linhas.push(`<strong>${esc(label)}:</strong> ${esc(val)}`);
    }
  }
  return linhas.join('<br>') || null;
}

function normalizarPerfis(obj) {
  if (!obj) return null;
  if (obj.perfil_ids) return obj.perfil_ids;
  if (obj.perfil_id != null) return [obj.perfil_id];
  return null;
}

function formatarDiffEdicao(antesStr, depoisStr, perfisMap, permissoesMap = {}) {
  const antes = parseDados(antesStr);
  const depois = parseDados(depoisStr);
  if (!antes && !depois) return null;
  const ignorar = ['senha_hash', 'senha', 'criado_em', 'atualizado_em', 'perfil_id', 'perfil_ids', 'permissao_ids'];
  const linhas = [];
  const esc = (s) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const perfisAntes = normalizarPerfis(antes);
  const perfisDepois = normalizarPerfis(depois);
  const txtPerfisAntes = perfisAntes?.map(id => perfisMap[id] || perfisMap[Number(id)] || id).join(', ') || '-';
  const txtPerfisDepois = perfisDepois?.map(id => perfisMap[id] || perfisMap[Number(id)] || id).join(', ') || '-';
  const perfisIguais = JSON.stringify([...(perfisAntes || [])].sort()) === JSON.stringify([...(perfisDepois || [])].sort());
  if (!perfisIguais) {
    linhas.push(`
      <div class="auditoria-diff-row">
        <span class="auditoria-diff-campo">Perfis</span>
        <span class="auditoria-diff-antigo">${esc(txtPerfisAntes)}</span>
        <span class="auditoria-diff-seta">→</span>
        <span class="auditoria-diff-novo">${esc(txtPerfisDepois)}</span>
      </div>
    `);
  }

  const permAntes = antes?.permissao_ids;
  const permDepois = depois?.permissao_ids;
  const txtPermAntes = permAntes?.map(id => permissoesMap[id] || permissoesMap[Number(id)] || id).join(', ') || '-';
  const txtPermDepois = permDepois?.map(id => permissoesMap[id] || permissoesMap[Number(id)] || id).join(', ') || '-';
  const permIguais = JSON.stringify([...(permAntes || [])].sort()) === JSON.stringify([...(permDepois || [])].sort());
  if (!permIguais && (permAntes || permDepois)) {
    linhas.push(`
      <div class="auditoria-diff-row">
        <span class="auditoria-diff-campo">Permissões</span>
        <span class="auditoria-diff-antigo">${esc(txtPermAntes)}</span>
        <span class="auditoria-diff-seta">→</span>
        <span class="auditoria-diff-novo">${esc(txtPermDepois)}</span>
      </div>
    `);
  }

  const outrosCampos = new Set([...(antes ? Object.keys(antes) : []), ...(depois ? Object.keys(depois) : [])]);
  for (const k of outrosCampos) {
    if (ignorar.includes(k)) continue;
    const vAntes = antes?.[k];
    const vDepois = depois?.[k];
    const strAntes = JSON.stringify(vAntes);
    const strDepois = JSON.stringify(vDepois);
    if (strAntes === strDepois) continue;
    const label = LABEL_CAMPO[k] || k;
    const txtAntes = esc(formatarValor(vAntes, k, perfisMap, permissoesMap));
    const txtDepois = esc(formatarValor(vDepois, k, perfisMap, permissoesMap));
    linhas.push(`
      <div class="auditoria-diff-row">
        <span class="auditoria-diff-campo">${label}</span>
        <span class="auditoria-diff-antigo">${txtAntes}</span>
        <span class="auditoria-diff-seta">→</span>
        <span class="auditoria-diff-novo">${txtDepois}</span>
      </div>
    `);
  }
  return linhas.length ? linhas.join('') : null;
}

async function bindAuditoria() {
  const lista = document.getElementById('listaAuditoria');
  if (!lista) return;
  let logs = await getAuditoria({ limit: 200 });
  const [usuarios, perfis, permissoes] = await Promise.all([getUsuarios(), getPerfis(), getPermissoes()]);
  const usersMap = Object.fromEntries(usuarios.map(u => [u.id, u.nome]));
  const perfisMap = Object.fromEntries(perfis.map(p => [p.id, p.nome]));
  const permissoesMap = Object.fromEntries(permissoes.map(p => [p.id, p.nome]));

  const filtroTexto = (document.getElementById('filtroAuditoria')?.value || '').toLowerCase().trim();
  const filtroAcao = document.getElementById('filtroAcaoAuditoria')?.value || '';
  const filtroRecurso = document.getElementById('filtroRecursoAuditoria')?.value || '';

  if (filtroTexto) {
    logs = logs.filter(l => {
      const user = (usersMap[l.usuario_id] || '').toLowerCase();
      const recurso = (LABEL_RECURSO[l.recurso] || l.recurso || '').toLowerCase();
      return user.includes(filtroTexto) || recurso.includes(filtroTexto);
    });
  }
  if (filtroAcao) logs = logs.filter(l => l.acao === filtroAcao);
  if (filtroRecurso) logs = logs.filter(l => l.recurso === filtroRecurso);

  lista.innerHTML = logs.length ? `
    <div class="auditoria-list">
      ${logs.map((l, i) => {
        let conteudoDetalhes = '';
        let temDetalhes = false;
        if (l.acao === 'editar') {
          const diff = formatarDiffEdicao(l.dados_antes, l.dados_depois, perfisMap, permissoesMap);
          if (diff) {
            temDetalhes = true;
            conteudoDetalhes = `<div class="auditoria-detail"><strong>O que mudou:</strong><div class="auditoria-diff-header"><span>Campo</span><span>Era</span><span></span><span>Ficou</span></div><div class="auditoria-diff">${diff}</div></div>`;
          }
        } else if (l.acao === 'excluir') {
          const antes = formatarDadosAuditoria(l.dados_antes, perfisMap, permissoesMap);
          if (antes) {
            temDetalhes = true;
            conteudoDetalhes = `<div class="auditoria-detail"><strong>Dados removidos:</strong><div class="auditoria-json">${antes}</div></div>`;
          }
        } else if (l.acao === 'criar') {
          const depois = formatarDadosAuditoria(l.dados_depois, perfisMap, permissoesMap);
          if (depois) {
            temDetalhes = true;
            conteudoDetalhes = `<div class="auditoria-detail"><strong>Dados criados:</strong><div class="auditoria-json">${depois}</div></div>`;
          }
        }
        return `
        <div class="auditoria-card" data-idx="${i}">
          <div class="auditoria-card-header ${temDetalhes ? 'auditoria-card-header-clickable' : ''}" ${temDetalhes ? `data-idx="${i}"` : ''}>
            <div class="auditoria-card-meta">
              <span class="auditoria-badge aud-${l.acao}">${LABEL_ACAO[l.acao] || l.acao}</span>
              <span class="auditoria-badge aud-recurso">${LABEL_RECURSO[l.recurso] || l.recurso}</span>
            </div>
            <div class="auditoria-card-info">
              <span class="auditoria-user">${(usersMap[l.usuario_id] || 'Usuário #' + l.usuario_id).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
              <span class="auditoria-date">${new Date(l.data).toLocaleString('pt-BR')}</span>
            </div>
            ${temDetalhes ? `<button type="button" class="auditoria-toggle" data-idx="${i}" title="Ver detalhes">▼</button>` : ''}
          </div>
          ${temDetalhes ? `
          <div class="auditoria-card-details" id="aud-details-${i}" style="display:none">
            ${conteudoDetalhes}
          </div>
          ` : ''}
        </div>
      `}).join('')}
    </div>
  ` : '<p class="empty">Nenhum registro de auditoria.</p>';

  const toggleAuditoria = (idx) => {
    const details = document.getElementById(`aud-details-${idx}`);
    const btn = lista.querySelector(`.auditoria-toggle[data-idx="${idx}"]`);
    if (details) {
      const isHidden = details.style.display === 'none';
      details.style.display = isHidden ? 'block' : 'none';
      if (btn) btn.textContent = isHidden ? '▲' : '▼';
    }
  };

  lista.querySelectorAll('.auditoria-card-header-clickable').forEach(header => {
    header.onclick = () => toggleAuditoria(header.dataset.idx);
  });
  lista.querySelectorAll('.auditoria-toggle').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      toggleAuditoria(btn.dataset.idx);
    };
  });
}

document.addEventListener('DOMContentLoaded', init);
