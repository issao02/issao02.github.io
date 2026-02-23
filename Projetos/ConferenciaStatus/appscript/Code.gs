/**
 * Conferência de Status - API Google Apps Script
 * VERSÃO: sem setHeader (corrigido)
 * 
 * INSTRUÇÕES DE CONFIGURAÇÃO:
 * 1. Crie ou abra uma planilha no Google Sheets com as colunas:
 *    - codigo_controle (ou codigo) | data | descricao_etapa (ou descricao) | data_conclusao | status
 * 2. Acesse script.google.com e crie um novo projeto
 * 3. Cole este código no arquivo Code.gs
 * 4. Altere SPREADSHEET_ID abaixo pelo ID da sua planilha (da URL: .../d/ID_AQUI/edit)
 * 5. Se usar outra aba, altere NOME_ABA ou deixe vazio para a primeira aba
 * 6. Implantar: Implantar > Nova implantação > Tipo: Aplicativo da Web
 *    - Execute como: Eu
 *    - Quem tem acesso: Qualquer pessoa
 * 7. Copie a URL da implantação e cole em APPS_SCRIPT_URL no index.html do site
 * 
 * SEGURANÇA: A planilha pode permanecer PRIVADA. O Apps Script acessa com suas credenciais.
 * O site só recebe os dados filtrados pelo código informado.
 */

// ========== CONFIGURAÇÃO - ALTERE AQUI ==========
const SPREADSHEET_ID = '1xTZbSEz2_Xudhxa2Pt-bn8uq9mZr70ngHrfqDtTJZEQ';
const NOME_ABA = '';        // Nome da aba (Página1) ou vazio para primeira aba

/**
 * Função chamada quando a API recebe uma requisição GET
 * Parâmetro: codigo (código de controle a buscar)
 */
function doGet(e) {
  const params = e?.parameter || {};
  const codigo = (params.codigo || '').toString().trim();
  const callback = (params.callback || '').toString().trim();
  const useJsonp = !!callback;

  let jsonData = {};
  try {
    if (!SPREADSHEET_ID) {
      jsonData = { sucesso: false, erro: 'SPREADSHEET_ID não configurado no Apps Script' };
    } else {
      const etapas = codigo ? buscarEtapas(codigo) : buscarTodasEtapas();
      jsonData = { sucesso: true, codigo: codigo || null, etapas: etapas };
    }
  } catch (err) {
    jsonData = { sucesso: false, erro: err.message || 'Erro interno' };
  }

  const output = ContentService.createTextOutput();
  if (useJsonp) {
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    output.setContent(callback + '(' + JSON.stringify(jsonData) + ')');
  } else {
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(jsonData));
  }
  return output;
}

function buscarEtapas(codigoBusca) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = NOME_ABA ? ss.getSheetByName(NOME_ABA) : ss.getSheets()[0];
  
  if (!sheet) {
    throw new Error('Aba não encontrada');
  }

  const dados = sheet.getDataRange().getValues();
  if (dados.length < 2) return [];

  const header = dados[0].map(h => normalizar(String(h || '')));
  const colCodigo = indexOf(header, ['codigo_controle', 'codigo', 'codigocontrole']) || 0;
  const colData = indexOf(header, ['data']) ?? 1;
  const colDescricao = indexOf(header, ['descricao_etapa', 'descricao', 'descricaoetapa']) ?? 2;
  const colDataConclusao = indexOf(header, ['data_conclusao', 'dataconclusao', 'conclusao']) ?? 3;
  const colStatus = indexOf(header, ['status']) ?? 4;

  const codigoNorm = normalizar(codigoBusca);
  const resultado = [];

  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    const codigo = String(row[colCodigo] || '').trim();
    if (!codigo || normalizar(codigo) !== codigoNorm) continue;

    let dataConclusao = String(row[colDataConclusao] ?? '').trim();
    let status = String(row[colStatus] ?? '').trim();
    if (!status && /^nao|não$/i.test(dataConclusao)) {
      status = 'nao';
      dataConclusao = '';
    }
    resultado.push({
      codigo: codigo,
      data: String(row[colData] ?? '').trim(),
      descricao: String(row[colDescricao] ?? '').trim(),
      dataConclusao: dataConclusao,
      status: status
    });
  }

  return resultado;
}

function buscarTodasEtapas() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = NOME_ABA ? ss.getSheetByName(NOME_ABA) : ss.getSheets()[0];
  if (!sheet) throw new Error('Aba não encontrada');
  const dados = sheet.getDataRange().getValues();
  if (dados.length < 2) return [];

  const header = dados[0].map(h => normalizar(String(h || '')));
  const colCodigo = indexOf(header, ['codigo_controle', 'codigo', 'codigocontrole']) || 0;
  const colData = indexOf(header, ['data']) ?? 1;
  const colDescricao = indexOf(header, ['descricao_etapa', 'descricao', 'descricaoetapa']) ?? 2;
  const colDataConclusao = indexOf(header, ['data_conclusao', 'dataconclusao', 'conclusao']) ?? 3;
  const colStatus = indexOf(header, ['status']) ?? 4;

  const resultado = [];
  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    const codigo = String(row[colCodigo] || '').trim();
    if (!codigo) continue;

    let dataConclusao = String(row[colDataConclusao] ?? '').trim();
    let status = String(row[colStatus] ?? '').trim();
    if (!status && /^nao|não$/i.test(dataConclusao)) {
      status = 'nao';
      dataConclusao = '';
    }
    resultado.push({
      codigo: codigo,
      data: String(row[colData] ?? '').trim(),
      descricao: String(row[colDescricao] ?? '').trim(),
      dataConclusao: dataConclusao,
      status: status
    });
  }
  return resultado;
}

function normalizar(s) {
  if (!s || typeof s !== 'string') return '';
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function indexOf(arr, keys) {
  for (const k of keys) {
    const i = arr.indexOf(k);
    if (i >= 0) return i;
  }
  return null;
}
