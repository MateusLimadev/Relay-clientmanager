/**
 * Camada de acesso à planilha. Cada aba tem uma primeira linha de cabeçalho
 * cujos nomes viram as chaves dos objetos retornados/gravados.
 */

var SHEET_NAMES = {
  SERVIDORES: 'Servidores',
  CLIENTES: 'Clientes',
  ASSINATURAS: 'Assinaturas',
  PAGAMENTOS: 'Pagamentos',
};

var SCHEMAS = {
  Servidores: ['id', 'nome', 'status', 'criadoEm'],
  Clientes: ['id', 'nome', 'telefone', 'criadoEm'],
  Assinaturas: [
    'id',
    'clienteId',
    'servidorId',
    'login',
    'valorCliente',
    'custo',
    'diaPago',
    'prazoDias',
    'vencimento',
    'statusManual',
    'observacao',
    'criadoEm',
    'atualizadoEm',
  ],
  Pagamentos: ['id', 'assinaturaId', 'data', 'valor', 'criadoEm'],
};

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Garante que todas as abas do schema existam, com cabeçalho correto. */
function ensureSheets_() {
  var ss = getSpreadsheet_();
  Object.keys(SCHEMAS).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    var headers = SCHEMAS[name];
    var range = sheet.getRange(1, 1, 1, headers.length);
    var current = range.getValues()[0];
    var needsHeader = headers.some(function (h, i) {
      return current[i] !== h;
    });
    if (needsHeader) {
      range.setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1');
  if (defaultSheet && ss.getSheets().length > Object.keys(SCHEMAS).length) {
    // Deixa a aba padrão do Sheets vazia intacta; não é removida automaticamente
    // para evitar apagar algo que o usuário possa ter colocado lá.
  }
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) {
    throw new Error('Aba não encontrada: ' + name);
  }
  return sheet;
}

/** Lê todas as linhas de uma aba como lista de objetos {campo: valor}. */
function readAll_(name) {
  var sheet = getSheet_(name);
  var lastRow = sheet.getLastRow();
  var headers = SCHEMAS[name];
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue; // linha sem id é considerada vazia
    var obj = { _row: i + 2 };
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = normalizeCell_(row[j]);
    }
    rows.push(obj);
  }
  return rows;
}

function normalizeCell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, 'America/Sao_Paulo', 'yyyy-MM-dd');
  }
  return value;
}

/** Insere um novo objeto na aba, preenchendo id/criadoEm automaticamente. */
function insertRow_(name, obj) {
  var sheet = getSheet_(name);
  var headers = SCHEMAS[name];
  var now = new Date().toISOString();
  obj.id = obj.id || Utilities.getUuid();
  if (headers.indexOf('criadoEm') !== -1 && !obj.criadoEm) obj.criadoEm = now;
  if (headers.indexOf('atualizadoEm') !== -1) obj.atualizadoEm = now;
  var row = headers.map(function (h) {
    return obj[h] !== undefined && obj[h] !== null ? obj[h] : '';
  });
  sheet.appendRow(row);
  return obj;
}

/** Atualiza os campos informados de um objeto existente, casando pelo id. */
function updateRow_(name, id, patch) {
  var sheet = getSheet_(name);
  var headers = SCHEMAS[name];
  var idCol = headers.indexOf('id') + 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Registro não encontrado: ' + id);
  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  var rowIndex = -1;
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      rowIndex = i + 2;
      break;
    }
  }
  if (rowIndex === -1) throw new Error('Registro não encontrado: ' + id);
  if (headers.indexOf('atualizadoEm') !== -1) patch.atualizadoEm = new Date().toISOString();
  var current = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var updated = headers.map(function (h, i) {
    return patch[h] !== undefined ? patch[h] : current[i];
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updated]);
  var result = {};
  headers.forEach(function (h, i) {
    result[h] = normalizeCell_(updated[i]);
  });
  return result;
}

/** Remove definitivamente a linha com o id informado. */
function deleteRow_(name, id) {
  var sheet = getSheet_(name);
  var headers = SCHEMAS[name];
  var idCol = headers.indexOf('id') + 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

function findById_(name, id) {
  var rows = readAll_(name);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === id) return rows[i];
  }
  return null;
}
