/**
 * Importa os dados da planilha antiga (aba "servidor", modelo de controle
 * manual de revenda IPTV) para o schema normalizado deste sistema.
 *
 * Chamada via action "migrarPlanilhaAntiga" com payload:
 *   { spreadsheetId: "1EVELon...", aba: "servidor", forcar: false }
 *
 * Requer que a conta que publicou o Web App tenha acesso de leitura à
 * planilha antiga. Por segurança, recusa rodar se já existirem dados nas
 * abas novas, a menos que "forcar: true" seja enviado (nesse caso limpa
 * Servidores/Clientes/Assinaturas/Pagamentos antes de reimportar).
 */

function migrarPlanilhaAntiga(spreadsheetId, aba) {
  if (!spreadsheetId) throw new Error('Informe spreadsheetId.');
  ensureSheets_();

  var jaTemDados =
    readAll_(SHEET_NAMES.ASSINATURAS).length > 0 || readAll_(SHEET_NAMES.CLIENTES).length > 0;
  if (jaTemDados) {
    throw new Error(
      'Já existem dados nas abas novas. Limpe Servidores/Clientes/Assinaturas/Pagamentos antes de migrar novamente.'
    );
  }

  var origem = SpreadsheetApp.openById(spreadsheetId);
  var sheet = origem.getSheetByName(aba || 'servidor');
  if (!sheet) throw new Error('Aba não encontrada na planilha antiga: ' + (aba || 'servidor'));

  var values = sheet.getDataRange().getValues();
  // values[0] é o cabeçalho da planilha antiga; dados começam na linha 1 (index 1).

  var servidorIdByNome = {};
  var clienteIdByChave = {};
  var criados = { servidores: 0, clientes: 0, assinaturas: 0 };
  var avisos = [];

  var emGratuitos = false;

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var nomeServidorRaw = row[1];

    if (!nomeServidorRaw || String(nomeServidorRaw).trim() === '') {
      if (row[5] && String(row[5]).trim().toLowerCase() === 'gratuitos') {
        emGratuitos = true;
      }
      continue;
    }

    var nomeServidor = String(nomeServidorRaw).trim();
    var isRevenda = nomeServidor.toLowerCase() === 'revenda';

    // --- Servidor ---
    var servidorId = servidorIdByNome[nomeServidor.toLowerCase()];
    if (!servidorId) {
      var servidor = insertRow_(SHEET_NAMES.SERVIDORES, { nome: nomeServidor, status: STATUS_SERVIDOR.ATIVO });
      servidorId = servidor.id;
      servidorIdByNome[nomeServidor.toLowerCase()] = servidorId;
      criados.servidores++;
    }

    // --- Cliente (dedup por telefone extraído, senão por nome) ---
    var contatoRaw = row[5] ? String(row[5]).trim() : '';
    var extraido = extrairNomeTelefone_(contatoRaw, row[4]);
    var chaveCliente = (extraido.telefone || extraido.nome || 'sem-contato-' + i).toLowerCase();
    var clienteId = clienteIdByChave[chaveCliente];
    if (!clienteId) {
      var cliente = insertRow_(SHEET_NAMES.CLIENTES, {
        nome: extraido.nome || '(sem nome)',
        telefone: extraido.telefone || '',
      });
      clienteId = cliente.id;
      clienteIdByChave[chaveCliente] = clienteId;
      criados.clientes++;
    }

    // --- Assinatura ---
    var login = row[3] !== undefined && row[3] !== null ? String(row[3]) : '';
    var valorCliente = Number(row[10]) || 0;
    var lucro = Number(row[11]) || 0;
    var custo = round2_(valorCliente - lucro);
    var diaPago = parseDataFlexivel_(row[6]);
    var vencimento = parseDataFlexivel_(row[8]);
    var prazoMatch = row[7] ? String(row[7]).match(/(\d+)/) : null;
    var prazoDias = prazoMatch ? Number(prazoMatch[1]) : 30;
    if (!vencimento && diaPago) vencimento = addDays_(diaPago, prazoDias);
    if (!diaPago) {
      avisos.push('Linha ' + (i + 1) + ' (' + login + '): data de pagamento inválida, revisar manualmente.');
      diaPago = todayStr_();
      if (!vencimento) vencimento = addDays_(diaPago, prazoDias);
    }

    var statusRaw = row[9] ? String(row[9]).trim().toLowerCase() : '';
    var statusManual = '';
    if (isRevenda) {
      statusManual = '';
    } else if (emGratuitos) {
      statusManual = 'gratuita';
    } else if (statusRaw === 'teste') {
      statusManual = 'teste';
    }

    var observacaoPartes = [];
    if (row[12]) observacaoPartes.push(String(row[12]).trim());
    if (statusRaw && statusRaw !== 'vencido' && statusRaw !== 'teste') observacaoPartes.push(statusRaw);
    if (isRevenda) observacaoPartes.push('revenda');

    insertRow_(SHEET_NAMES.ASSINATURAS, {
      clienteId: clienteId,
      servidorId: servidorId,
      login: login,
      valorCliente: valorCliente,
      custo: custo,
      diaPago: diaPago,
      prazoDias: prazoDias,
      vencimento: vencimento,
      statusManual: statusManual,
      observacao: observacaoPartes.join(' | '),
    });
    criados.assinaturas++;
  }

  return { criados: criados, avisos: avisos };
}

/** Extrai telefone e nome de um campo de contato livre tipo "95118 - 3236 enoch". */
function extrairNomeTelefone_(contato, nomeColuna) {
  var nome = nomeColuna ? String(nomeColuna).trim() : '';
  if (!contato) return { nome: nome, telefone: '' };

  var match = contato.match(/[\d][\d\s\-().]{6,}\d/);
  var telefone = match ? match[0].replace(/\s+/g, ' ').trim() : '';
  var resto = telefone ? contato.replace(telefone, '') : contato;
  resto = resto.replace(/^[\s\-]+|[\s\-]+$/g, '').trim();

  if (!nome) nome = resto || contato.trim();
  return { nome: nome, telefone: telefone };
}

/** Converte Date do Sheets ou string dd/mm/yyyy em 'yyyy-MM-dd'; retorna '' se inválida. */
function parseDataFlexivel_(value) {
  if (!value) return '';
  if (value instanceof Date) {
    if (value.getFullYear() < 1950) return '';
    return Utilities.formatDate(value, 'America/Sao_Paulo', 'yyyy-MM-dd');
  }
  var s = String(value).trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  var dia = Number(m[1]);
  var mes = Number(m[2]);
  var ano = Number(m[3]);
  if (ano < 1950) return '';
  var mm = mes < 10 ? '0' + mes : '' + mes;
  var dd = dia < 10 ? '0' + dia : '' + dia;
  return ano + '-' + mm + '-' + dd;
}
