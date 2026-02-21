/**
 * Agenda Consultório - API IndexedDB
 */
const DB_NAME = 'AgendaConsultorioDB';
const DB_VERSION = 1;
const STORE_MEDICOS = 'medicos';
const STORE_PACIENTES = 'pacientes';
const STORE_PARAMETROS = 'parametros';
const STORE_CONSULTAS = 'consultas';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_MEDICOS)) {
        const store = db.createObjectStore(STORE_MEDICOS, { keyPath: 'id', autoIncrement: true });
        store.createIndex('ativo', 'ativo', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PACIENTES)) {
        const store = db.createObjectStore(STORE_PACIENTES, { keyPath: 'id', autoIncrement: true });
        store.createIndex('cpf', 'cpf', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PARAMETROS)) {
        db.createObjectStore(STORE_PARAMETROS, { keyPath: 'chave' });
      }
      if (!db.objectStoreNames.contains(STORE_CONSULTAS)) {
        const store = db.createObjectStore(STORE_CONSULTAS, { keyPath: 'id', autoIncrement: true });
        store.createIndex('medico_data', ['idMedico', 'data'], { unique: false });
        store.createIndex('data', 'data', { unique: false });
      }
    };
  });
}

// === MÉDICOS ===
async function addMedico(medico) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDICOS, 'readwrite');
    const store = tx.objectStore(STORE_MEDICOS);
    const obj = { ...medico, ativo: true, criadoEm: new Date().toISOString() };
    const request = store.add(obj);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getMedicos(apenasAtivos = false) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDICOS, 'readonly');
    const store = tx.objectStore(STORE_MEDICOS);
    const request = store.getAll();
    request.onsuccess = () => {
      let result = request.result;
      if (apenasAtivos) result = result.filter(m => m.ativo !== false);
      resolve(result);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getMedicoById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDICOS, 'readonly');
    const store = tx.objectStore(STORE_MEDICOS);
    const request = store.get(Number(id));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function updateMedico(id, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDICOS, 'readwrite');
    const store = tx.objectStore(STORE_MEDICOS);
    const getReq = store.get(Number(id));
    getReq.onsuccess = () => {
      const medico = getReq.result;
      if (!medico) {
        db.close();
        reject(new Error('Médico não encontrado'));
        return;
      }
      const atualizado = { ...medico, ...updates };
      store.put(atualizado);
      resolve(atualizado);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => db.close();
  });
}

// === PACIENTES ===
async function addPaciente(paciente) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PACIENTES, 'readwrite');
    const store = tx.objectStore(STORE_PACIENTES);
    const request = store.add(paciente);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getPacientes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PACIENTES, 'readonly');
    const store = tx.objectStore(STORE_PACIENTES);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getPacienteById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PACIENTES, 'readonly');
    const store = tx.objectStore(STORE_PACIENTES);
    const request = store.get(Number(id));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function updatePaciente(id, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PACIENTES, 'readwrite');
    const store = tx.objectStore(STORE_PACIENTES);
    const getReq = store.get(Number(id));
    getReq.onsuccess = () => {
      const paciente = getReq.result;
      if (!paciente) {
        db.close();
        reject(new Error('Paciente não encontrado'));
        return;
      }
      const atualizado = { ...paciente, ...updates };
      store.put(atualizado);
      resolve(atualizado);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => db.close();
  });
}

async function deletePaciente(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PACIENTES, 'readwrite');
    const store = tx.objectStore(STORE_PACIENTES);
    const request = store.delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// === PARÂMETROS ===
async function getParametro(chave) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PARAMETROS, 'readonly');
    const store = tx.objectStore(STORE_PARAMETROS);
    const request = store.get(chave);
    request.onsuccess = () => resolve(request.result?.valor ?? null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function setParametro(chave, valor) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PARAMETROS, 'readwrite');
    const store = tx.objectStore(STORE_PARAMETROS);
    const request = store.put({ chave, valor });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// === CONSULTAS ===
async function addConsulta(consulta) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONSULTAS, 'readwrite');
    const store = tx.objectStore(STORE_CONSULTAS);
    const request = store.add(consulta);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getConsultas() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONSULTAS, 'readonly');
    const store = tx.objectStore(STORE_CONSULTAS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

function normalizarData(d) {
  if (!d) return '';
  if (typeof d === 'string' && d.length >= 10) return d.substring(0, 10);
  const dt = new Date(d);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}

async function getConsultasPorMedicoEData(idMedico, dataStr) {
  const todas = await getConsultas();
  const dataNorm = normalizarData(dataStr);
  return todas.filter(c => {
    const matchMedico = Number(c.idMedico) === Number(idMedico);
    const matchData = normalizarData(c.data) === dataNorm;
    return matchMedico && matchData;
  });
}

async function getConsultaById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONSULTAS, 'readonly');
    const store = tx.objectStore(STORE_CONSULTAS);
    const request = store.get(Number(id));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function updateConsulta(id, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONSULTAS, 'readwrite');
    const store = tx.objectStore(STORE_CONSULTAS);
    const getReq = store.get(Number(id));
    getReq.onsuccess = () => {
      const consulta = getReq.result;
      if (!consulta) {
        db.close();
        reject(new Error('Consulta não encontrada'));
        return;
      }
      const atualizado = { ...consulta, ...updates };
      store.put(atualizado);
      resolve(atualizado);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => db.close();
  });
}

async function deleteConsulta(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONSULTAS, 'readwrite');
    const store = tx.objectStore(STORE_CONSULTAS);
    const request = store.delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}
