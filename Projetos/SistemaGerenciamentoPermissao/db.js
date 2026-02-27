/**
 * Sistema de Gerenciamento de Permissões - API IndexedDB
 * Estrutura preparada para migração: troque implementação por fetch() à API
 */
const DB_NAME = 'PermissaoDB';
const DB_VERSION = 2;
const STORES = {
  usuarios: 'usuarios',
  perfis: 'perfis',
  permissoes: 'permissoes',
  perfilPermissoes: 'perfil_permissoes',
  usuarioPerfis: 'usuario_perfis',
  auditoria: 'auditoria'
};

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.usuarios)) {
        const us = db.createObjectStore(STORES.usuarios, { keyPath: 'id', autoIncrement: true });
        us.createIndex('email', 'email', { unique: true });
        us.createIndex('perfil_id', 'perfil_id', { unique: false });
        us.createIndex('ativo', 'ativo', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.perfis)) {
        db.createObjectStore(STORES.perfis, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.permissoes)) {
        const perm = db.createObjectStore(STORES.permissoes, { keyPath: 'id', autoIncrement: true });
        perm.createIndex('modulo', 'modulo', { unique: false });
        perm.createIndex('codigo', 'codigo', { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.perfilPermissoes)) {
        const pp = db.createObjectStore(STORES.perfilPermissoes, { keyPath: ['perfil_id', 'permissao_id'] });
        pp.createIndex('perfil_id', 'perfil_id', { unique: false });
        pp.createIndex('permissao_id', 'permissao_id', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.usuarioPerfis)) {
        const up = db.createObjectStore(STORES.usuarioPerfis, { keyPath: ['usuario_id', 'perfil_id'] });
        up.createIndex('usuario_id', 'usuario_id', { unique: false });
        up.createIndex('perfil_id', 'perfil_id', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.auditoria)) {
        const aud = db.createObjectStore(STORES.auditoria, { keyPath: 'id', autoIncrement: true });
        aud.createIndex('usuario_id', 'usuario_id', { unique: false });
        aud.createIndex('data', 'data', { unique: false });
      }
    };
  });
}

async function _getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function _get(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function _add(storeName, obj) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(obj);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function _put(storeName, obj) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(obj);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function _delete(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// --- Usuários ---
async function getUsuarios() {
  return _getAll(STORES.usuarios);
}

async function getUsuarioById(id) {
  return _get(STORES.usuarios, Number(id));
}

async function getUsuarioByEmail(email) {
  const todos = await getUsuarios();
  return todos.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

async function saveUsuario(usuario) {
  const agora = new Date().toISOString();
  if (usuario.id) {
    const existente = await getUsuarioById(usuario.id);
    if (!existente) throw new Error('Usuário não encontrado');
    const atualizado = { ...existente, ...usuario, atualizado_em: agora };
    await _put(STORES.usuarios, atualizado);
    return atualizado;
  } else {
    const novo = { ...usuario, criado_em: agora, atualizado_em: agora };
    novo.id = await _add(STORES.usuarios, novo);
    return novo;
  }
}

async function deleteUsuario(id) {
  const idNum = Number(id);
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.usuarios, STORES.usuarioPerfis], 'readwrite');
      const storeUp = tx.objectStore(STORES.usuarioPerfis);
      const idx = storeUp.index('usuario_id');
      const req = idx.getAll(idNum);
      req.onsuccess = () => {
        req.result.forEach(r => storeUp.delete([r.usuario_id, r.perfil_id]));
        tx.objectStore(STORES.usuarios).delete(idNum);
        resolve();
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (_) {
    await _delete(STORES.usuarios, idNum);
  }
}

// --- Perfis ---
async function getPerfis() {
  return _getAll(STORES.perfis);
}

async function getPerfilById(id) {
  return _get(STORES.perfis, Number(id));
}

async function savePerfil(perfil) {
  const agora = new Date().toISOString();
  if (perfil.id) {
    const existente = await getPerfilById(perfil.id);
    if (!existente) throw new Error('Perfil não encontrado');
    const atualizado = { ...existente, ...perfil, atualizado_em: agora };
    await _put(STORES.perfis, atualizado);
    return atualizado;
  } else {
    const novo = { ...perfil, criado_em: agora, atualizado_em: agora };
    novo.id = await _add(STORES.perfis, novo);
    return novo;
  }
}

async function deletePerfil(id) {
  return _delete(STORES.perfis, Number(id));
}

// --- Permissões ---
async function getPermissoes() {
  return _getAll(STORES.permissoes);
}

async function getPermissaoById(id) {
  return _get(STORES.permissoes, Number(id));
}

async function savePermissao(permissao) {
  if (permissao.id) {
    const existente = await getPermissaoById(permissao.id);
    if (!existente) throw new Error('Permissão não encontrada');
    const atualizado = { ...existente, ...permissao };
    await _put(STORES.permissoes, atualizado);
    return atualizado;
  } else {
    const novo = { ...permissao };
    novo.id = await _add(STORES.permissoes, novo);
    return novo;
  }
}

async function deletePermissao(id) {
  const db = await openDB();
  const idNum = Number(id);
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.permissoes, STORES.perfilPermissoes], 'readwrite');
    const storePerm = tx.objectStore(STORES.permissoes);
    const storePP = tx.objectStore(STORES.perfilPermissoes);
    const idx = storePP.index('permissao_id');
    const req = idx.getAll(idNum);
    req.onsuccess = () => {
      req.result.forEach(r => storePP.delete([r.perfil_id, r.permissao_id]));
      storePerm.delete(idNum);
      resolve();
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

// --- Perfil-Permissões (N:N) ---
async function getPerfilPermissoes(perfilId) {
  const todos = await _getAll(STORES.perfilPermissoes);
  return todos.filter(pp => pp.perfil_id === Number(perfilId));
}

async function setPerfilPermissoes(perfilId, permissaoIds) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.perfilPermissoes, 'readwrite');
    const store = tx.objectStore(STORES.perfilPermissoes);
    const idx = store.index('perfil_id');
    const req = idx.getAll(Number(perfilId));
    req.onsuccess = () => {
      req.result.forEach(r => store.delete([r.perfil_id, r.permissao_id]));
      permissaoIds.forEach(pid => {
        store.add({ perfil_id: Number(perfilId), permissao_id: Number(pid) });
      });
      resolve();
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function getPermissoesDoPerfil(perfilId) {
  const pp = await getPerfilPermissoes(perfilId);
  const permissoes = await getPermissoes();
  const ids = pp.map(p => p.permissao_id);
  return permissoes.filter(perm => ids.includes(perm.id));
}

// --- Usuário-Perfis (N:N) ---
async function getUsuarioPerfis(usuarioId) {
  const todos = await _getAll(STORES.usuarioPerfis);
  return todos.filter(up => up.usuario_id === Number(usuarioId));
}

async function setUsuarioPerfis(usuarioId, perfilIds) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.usuarioPerfis, 'readwrite');
    const store = tx.objectStore(STORES.usuarioPerfis);
    const idx = store.index('usuario_id');
    const req = idx.getAll(Number(usuarioId));
    req.onsuccess = () => {
      req.result.forEach(r => store.delete([r.usuario_id, r.perfil_id]));
      perfilIds.forEach(pid => {
        store.add({ usuario_id: Number(usuarioId), perfil_id: Number(pid) });
      });
      resolve();
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function getPerfisDoUsuario(usuarioId) {
  const up = await getUsuarioPerfis(usuarioId);
  const perfis = await getPerfis();
  const ids = up.map(u => u.perfil_id);
  return perfis.filter(p => ids.includes(p.id));
}

async function getPerfilIdsDoUsuario(usuarioId) {
  const up = await getUsuarioPerfis(usuarioId);
  if (up.length > 0) return up.map(u => u.perfil_id);
  const usuario = await getUsuarioById(usuarioId);
  if (usuario?.perfil_id) return [usuario.perfil_id];
  return [];
}

async function getPermissoesDoUsuario(usuarioId) {
  const perfilIds = await getPerfilIdsDoUsuario(usuarioId);
  if (perfilIds.length === 0) return [];
  const todasPermissoes = await getPermissoes();
  const codigosSet = new Set();
  for (const perfilId of perfilIds) {
    const perfil = await getPerfilById(perfilId);
    if (perfil?.nome === 'Administrador') return todasPermissoes;
    const perms = await getPermissoesDoPerfil(perfilId);
    perms.forEach(p => codigosSet.add(p.codigo));
  }
  return todasPermissoes.filter(p => codigosSet.has(p.codigo));
}

// --- Auditoria ---
async function addAuditoria(usuarioId, acao, recurso, dadosAntes, dadosDepois) {
  const log = {
    usuario_id: usuarioId,
    acao,
    recurso,
    dados_antes: dadosAntes ? JSON.stringify(dadosAntes) : null,
    dados_depois: dadosDepois ? JSON.stringify(dadosDepois) : null,
    data: new Date().toISOString()
  };
  return _add(STORES.auditoria, log);
}

async function getAuditoria(filtros = {}) {
  let logs = await _getAll(STORES.auditoria);
  if (filtros.usuario_id) logs = logs.filter(l => l.usuario_id === Number(filtros.usuario_id));
  if (filtros.recurso) logs = logs.filter(l => l.recurso === filtros.recurso);
  logs.sort((a, b) => new Date(b.data) - new Date(a.data));
  return filtros.limit ? logs.slice(0, filtros.limit) : logs;
}

// --- Inicialização e migração ---
async function migrateUsuariosToMultiPerfil() {
  try {
    const usuarios = await getUsuarios();
    for (const u of usuarios) {
      const up = await getUsuarioPerfis(u.id);
      if (up.length === 0 && u.perfil_id) {
        await setUsuarioPerfis(u.id, [u.perfil_id]);
      }
    }
  } catch (_) {}
}

async function initDB() {
  await migrateUsuariosToMultiPerfil();
  const perfis = await getPerfis();
  if (perfis.length > 0) return; // já inicializado

  const adminId = await _add(STORES.perfis, {
    nome: 'Administrador',
    descricao: 'Acesso total ao sistema',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  });

  const operadorId = await _add(STORES.perfis, {
    nome: 'Operador',
    descricao: 'Acesso a operações básicas',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  });

  const permissoesPadrao = [
    { codigo: 'usuarios.visualizar', nome: 'Visualizar usuários', modulo: 'usuarios', descricao: 'Ver lista e detalhes' },
    { codigo: 'usuarios.criar', nome: 'Criar usuários', modulo: 'usuarios', descricao: 'Cadastrar novos' },
    { codigo: 'usuarios.editar', nome: 'Editar usuários', modulo: 'usuarios', descricao: 'Alterar dados' },
    { codigo: 'usuarios.excluir', nome: 'Excluir usuários', modulo: 'usuarios', descricao: 'Remover usuários' },
    { codigo: 'perfis.visualizar', nome: 'Visualizar perfis', modulo: 'perfis', descricao: 'Ver perfis' },
    { codigo: 'perfis.criar', nome: 'Criar perfis', modulo: 'perfis', descricao: 'Cadastrar perfis' },
    { codigo: 'perfis.editar', nome: 'Editar perfis', modulo: 'perfis', descricao: 'Alterar perfis e permissões' },
    { codigo: 'perfis.excluir', nome: 'Excluir perfis', modulo: 'perfis', descricao: 'Remover perfis' },
    { codigo: 'auditoria.visualizar', nome: 'Ver auditoria', modulo: 'auditoria', descricao: 'Consultar logs' }
  ];

  for (const p of permissoesPadrao) {
    await _add(STORES.permissoes, p);
  }

  const todasPermissoes = await getPermissoes();
  for (const perm of todasPermissoes) {
    await _add(STORES.perfilPermissoes, { perfil_id: adminId, permissao_id: perm.id });
  }

  const permOperador = todasPermissoes.filter(p =>
    ['usuarios.visualizar', 'perfis.visualizar'].includes(p.codigo)
  );
  for (const perm of permOperador) {
    await _add(STORES.perfilPermissoes, { perfil_id: operadorId, permissao_id: perm.id });
  }

  const senhaHash = await hashPassword('admin123');
  const adminUserId = await _add(STORES.usuarios, {
    nome: 'Administrador',
    email: 'admin@demo.com',
    senha_hash: senhaHash,
    perfil_id: adminId,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  });
  await setUsuarioPerfis(adminUserId, [adminId]);
}

async function hashPassword(senha) {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verificarSenha(senha, hashArmazenado) {
  const hash = await hashPassword(senha);
  return hash === hashArmazenado;
}
