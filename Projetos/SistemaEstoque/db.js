/**
 * Sistema de Estoque - API IndexedDB
 */
const DB_NAME = 'EstoqueDB';
const DB_VERSION = 1;
const STORE_NAME = 'produtos';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('codigo', 'codigo', { unique: true });
        store.createIndex('categoria', 'categoria', { unique: false });
        store.createIndex('nome', 'nome', { unique: false });
      }
    };
  });
}

async function addProduto(produto) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const obj = {
      ...produto,
      dataCadastro: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    const request = store.add(obj);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getProdutos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getProdutoById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(Number(id));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function updateProduto(id, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(Number(id));
    getReq.onsuccess = () => {
      const produto = getReq.result;
      if (!produto) {
        reject(new Error('Produto não encontrado'));
        return;
      }
      const atualizado = { ...produto, ...updates, atualizadoEm: new Date().toISOString() };
      const putReq = store.put(atualizado);
      putReq.onsuccess = () => resolve(atualizado);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => db.close();
  });
}

async function deleteProduto(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function movimentar(id, quantidade, tipo) {
  const produto = await getProdutoById(id);
  if (!produto) throw new Error('Produto não encontrado');

  const novoQtd =
    tipo === 'entrada' ? produto.quantidade + quantidade : produto.quantidade - quantidade;
  if (novoQtd < 0) throw new Error('Quantidade insuficiente em estoque');

  return updateProduto(id, { quantidade: novoQtd });
}
