/**
 * Ponto de entrada do Web App. Todas as chamadas são POST com corpo JSON:
 *   { "token": "...", "action": "listAssinaturas", "payload": { ... } }
 *
 * O token é comparado com a Script Property API_TOKEN (Project Settings >
 * Script Properties). Configure-o antes de publicar o deploy.
 */

var ACTIONS = {
  ping: function () {
    return { pong: true, agora: new Date().toISOString() };
  },

  listServidores: function () {
    return listServidores();
  },
  upsertServidor: function (p) {
    return upsertServidor(p);
  },
  deleteServidor: function (p) {
    return { ok: deleteServidor(p.id) };
  },

  listClientes: function () {
    return listClientes();
  },
  upsertCliente: function (p) {
    return upsertCliente(p);
  },
  deleteCliente: function (p) {
    return { ok: deleteCliente(p.id) };
  },

  listAssinaturas: function (p) {
    return listAssinaturas(p);
  },
  getAssinatura: function (p) {
    return getAssinatura(p.id);
  },
  upsertAssinatura: function (p) {
    return upsertAssinatura(p);
  },
  cancelarAssinatura: function (p) {
    return cancelarAssinatura(p.id);
  },
  excluirAssinatura: function (p) {
    return { ok: excluirAssinatura(p.id) };
  },
  registrarPagamento: function (p) {
    return registrarPagamento(p);
  },
  listPagamentos: function (p) {
    return listPagamentos(p && p.assinaturaId);
  },
  listPagamentosCliente: function (p) {
    return listPagamentosCliente(p.clienteId);
  },

  getDashboard: function () {
    return getDashboard();
  },
  getVencimentos: function () {
    return getVencimentos();
  },

  migrarPlanilhaAntiga: function (p) {
    return migrarPlanilhaAntiga(p.spreadsheetId, p.aba);
  },
};

function doGet(e) {
  return jsonOutput_({ ok: true, service: 'clientmanager-api', metodo: 'use POST' });
}

function doPost(e) {
  ensureSheets_();
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    checkToken_(body.token);

    var action = body.action;
    var handler = ACTIONS[action];
    if (!handler) {
      return jsonOutput_({ ok: false, error: 'Ação desconhecida: ' + action }, 400);
    }

    var result = handler(body.payload || {});
    return jsonOutput_({ ok: true, data: result });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err && err.message ? err.message : err) }, 400);
  }
}

function checkToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if (!expected) {
    throw new Error('API_TOKEN não configurado nas Script Properties do projeto.');
  }
  if (token !== expected) {
    throw new Error('Token inválido.');
  }
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
