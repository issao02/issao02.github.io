# Sistema de Gerenciamento de Permissões

## Estrutura do banco (IndexedDB → migração futura)

| Tabela | Campos |
|--------|--------|
| **usuarios** | id, nome, email, senha_hash, perfil_id, ativo, criado_em, atualizado_em |
| **perfis** | id, nome, descricao, criado_em, atualizado_em |
| **permissoes** | id, codigo, nome, modulo, descricao |
| **perfil_permissoes** | perfil_id, permissao_id (N:N) |
| **auditoria** | id, usuario_id, acao, recurso, dados_antes, dados_depois, data |

## Credenciais demo

- **E-mail:** admin@demo.com  
- **Senha:** admin123  

## Migração para backend

1. Trocar implementação em `db.js` por chamadas `fetch()` à API
2. Manter mesma interface: `getUsuarios()`, `saveUsuario()`, etc.
3. Adicionar token JWT no header: `Authorization: Bearer <token>`
4. Backend deve validar permissões em cada endpoint
