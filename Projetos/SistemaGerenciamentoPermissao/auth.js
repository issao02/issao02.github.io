/**
 * Sistema de Gerenciamento de Permissões - Autenticação
 * Checagem de permissões no cliente (para UI). Backend deve validar sempre.
 */
const SESSION_KEY = 'perm_sessao';

function getSession() {
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setSession(usuario, permissoes) {
  const codigos = permissoes.map(p => (typeof p === 'string' ? p : p.codigo));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    usuario,
    permissoes: codigos,
    login_em: new Date().toISOString()
  }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
  return !!getSession();
}

function getUsuarioLogado() {
  const s = getSession();
  return s ? s.usuario : null;
}

function getPermissoesLogado() {
  const s = getSession();
  return s ? (s.permissoes || []) : [];
}

/**
 * Verifica se o usuário tem a permissão (por código)
 * @param {string} codigo - Ex: 'usuarios.editar', 'perfis.visualizar'
 * @returns {boolean}
 */
function temPermissao(codigo) {
  const permissoes = getPermissoesLogado();
  if (permissoes.includes('*')) return true; // admin total
  return permissoes.includes(codigo);
}

/**
 * Verifica se tem alguma das permissões
 */
function temAlgumaPermissao(...codigos) {
  return codigos.some(c => temPermissao(c));
}

/**
 * Verifica se tem todas as permissões
 */
function temTodasPermissoes(...codigos) {
  return codigos.every(c => temPermissao(c));
}

async function login(email, senha) {
  const usuario = await getUsuarioByEmail(email);
  if (!usuario) return { ok: false, msg: 'E-mail ou senha inválidos' };
  if (!usuario.ativo) return { ok: false, msg: 'Usuário inativo' };

  const senhaOk = await verificarSenha(senha, usuario.senha_hash);
  if (!senhaOk) return { ok: false, msg: 'E-mail ou senha inválidos' };

  const perfis = await getPerfisDoUsuario(usuario.id);
  let codigos;
  if (perfis.some(p => p.nome === 'Administrador')) {
    codigos = ['*'];
  } else {
    const permissoes = await getPermissoesDoUsuario(usuario.id);
    codigos = permissoes.map(p => p.codigo);
  }
  setSession(usuario, codigos);

  return { ok: true, usuario };
}

function logout() {
  clearSession();
}
