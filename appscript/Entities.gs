/**
 * Regras de negócio por entidade. Nada aqui fala HTTP; Code.gs cuida disso.
 */

// ---------- Servidores ----------

var STATUS_SERVIDOR = {
  ATIVO: 'ativo',
  MANUTENCAO: 'manutencao',
  OFFLINE: 'offline',
};

// Migração suave: planilhas criadas antes deste campo tinham uma coluna
// booleana "ativo". Convertemos automaticamente na leitura; ao salvar de
// novo pelo painel, a linha já fica com o valor string correto.
function normalizarStatusServidor_(value) {
  if (value === true) return STATUS_SERVIDOR.ATIVO;
  if (value === false) return STATUS_SERVIDOR.OFFLINE;
  if (value === STATUS_SERVIDOR.ATIVO || value === STATUS_SERVIDOR.MANUTENCAO || value === STATUS_SERVIDOR.OFFLINE) {
    return value;
  }
  return STATUS_SERVIDOR.ATIVO;
}

function listServidores() {
  return readAll_(SHEET_NAMES.SERVIDORES)
    .map(stripRow_)
    .map(function (s) {
      s.status = normalizarStatusServidor_(s.status);
      return s;
    });
}

function upsertServidor(input) {
  requireFields_(input, ['nome']);
  var status = normalizarStatusServidor_(input.status);
  if (input.id) {
    return updateRow_(SHEET_NAMES.SERVIDORES, input.id, {
      nome: String(input.nome).trim(),
      status: status,
    });
  }
  return insertRow_(SHEET_NAMES.SERVIDORES, {
    nome: String(input.nome).trim(),
    status: status,
  });
}

function deleteServidor(id) {
  var emUso = readAll_(SHEET_NAMES.ASSINATURAS).some(function (a) {
    return a.servidorId === id;
  });
  if (emUso) {
    throw new Error('Servidor possui assinaturas vinculadas; desative-o em vez de excluir.');
  }
  return deleteRow_(SHEET_NAMES.SERVIDORES, id);
}

// ---------- Clientes ----------

function listClientes() {
  var assinaturas = readAll_(SHEET_NAMES.ASSINATURAS);
  return readAll_(SHEET_NAMES.CLIENTES)
    .map(stripRow_)
    .map(function (c) {
      c.totalAssinaturas = assinaturas.filter(function (a) {
        return a.clienteId === c.id;
      }).length;
      return c;
    });
}

function upsertCliente(input) {
  requireFields_(input, ['nome']);
  var data = {
    nome: String(input.nome).trim(),
    telefone: input.telefone ? String(input.telefone).trim() : '',
  };
  if (input.id) return updateRow_(SHEET_NAMES.CLIENTES, input.id, data);
  return insertRow_(SHEET_NAMES.CLIENTES, data);
}

function deleteCliente(id) {
  var emUso = readAll_(SHEET_NAMES.ASSINATURAS).some(function (a) {
    return a.clienteId === id;
  });
  if (emUso) {
    throw new Error('Cliente possui assinaturas vinculadas; remova-as primeiro.');
  }
  return deleteRow_(SHEET_NAMES.CLIENTES, id);
}

// ---------- Assinaturas ----------

var STATUS = {
  ATIVA: 'ativa',
  VENCIDA: 'vencida',
  CANCELADA: 'cancelada',
  TESTE: 'teste',
  GRATUITA: 'gratuita',
};

function computeStatus_(assinatura, hoje) {
  if (assinatura.statusManual === STATUS.CANCELADA) return STATUS.CANCELADA;
  if (assinatura.statusManual === STATUS.TESTE) return STATUS.TESTE;
  if (assinatura.statusManual === STATUS.GRATUITA) return STATUS.GRATUITA;
  if (!assinatura.vencimento) return STATUS.ATIVA;
  return assinatura.vencimento < hoje ? STATUS.VENCIDA : STATUS.ATIVA;
}

function enrichAssinatura_(a, clientesById, servidoresById, hoje) {
  a.clienteNome = (clientesById[a.clienteId] || {}).nome || '(sem cliente)';
  a.servidorNome = (servidoresById[a.servidorId] || {}).nome || '(sem servidor)';
  a.lucro = round2_((Number(a.valorCliente) || 0) - (Number(a.custo) || 0));
  a.status = computeStatus_(a, hoje);
  return a;
}

function listAssinaturas(filtro) {
  filtro = filtro || {};
  var hoje = todayStr_();
  var clientesById = indexBy_(readAll_(SHEET_NAMES.CLIENTES), 'id');
  var servidoresById = indexBy_(readAll_(SHEET_NAMES.SERVIDORES), 'id');
  var rows = readAll_(SHEET_NAMES.ASSINATURAS)
    .map(stripRow_)
    .map(function (a) {
      return enrichAssinatura_(a, clientesById, servidoresById, hoje);
    });

  if (filtro.status) {
    rows = rows.filter(function (a) {
      return a.status === filtro.status;
    });
  }
  if (filtro.servidorId) {
    rows = rows.filter(function (a) {
      return a.servidorId === filtro.servidorId;
    });
  }
  if (filtro.clienteId) {
    rows = rows.filter(function (a) {
      return a.clienteId === filtro.clienteId;
    });
  }
  if (filtro.busca) {
    var termo = String(filtro.busca).toLowerCase();
    rows = rows.filter(function (a) {
      return (
        (a.clienteNome && a.clienteNome.toLowerCase().indexOf(termo) !== -1) ||
        (a.login && String(a.login).toLowerCase().indexOf(termo) !== -1) ||
        (a.servidorNome && a.servidorNome.toLowerCase().indexOf(termo) !== -1)
      );
    });
  }
  rows.sort(function (x, y) {
    return (x.vencimento || '').localeCompare(y.vencimento || '');
  });
  return rows;
}

function getAssinatura(id) {
  var clientesById = indexBy_(readAll_(SHEET_NAMES.CLIENTES), 'id');
  var servidoresById = indexBy_(readAll_(SHEET_NAMES.SERVIDORES), 'id');
  var a = findById_(SHEET_NAMES.ASSINATURAS, id);
  if (!a) throw new Error('Assinatura não encontrada: ' + id);
  return enrichAssinatura_(a, clientesById, servidoresById, todayStr_());
}

function upsertAssinatura(input) {
  requireFields_(input, ['clienteId', 'servidorId', 'login', 'valorCliente', 'prazoDias']);
  var diaPago = input.diaPago || todayStr_();
  var prazoDias = Number(input.prazoDias);
  var data = {
    clienteId: input.clienteId,
    servidorId: input.servidorId,
    login: String(input.login).trim(),
    valorCliente: Number(input.valorCliente) || 0,
    custo: Number(input.custo) || 0,
    diaPago: diaPago,
    prazoDias: prazoDias,
    vencimento: input.vencimento || addDays_(diaPago, prazoDias),
    statusManual: input.statusManual || '',
    observacao: input.observacao || '',
  };
  if (input.id) return updateRow_(SHEET_NAMES.ASSINATURAS, input.id, data);
  return insertRow_(SHEET_NAMES.ASSINATURAS, data);
}

function cancelarAssinatura(id) {
  return updateRow_(SHEET_NAMES.ASSINATURAS, id, { statusManual: STATUS.CANCELADA });
}

function excluirAssinatura(id) {
  var pagamentos = readAll_(SHEET_NAMES.PAGAMENTOS).filter(function (p) {
    return p.assinaturaId === id;
  });
  pagamentos.forEach(function (p) {
    deleteRow_(SHEET_NAMES.PAGAMENTOS, p.id);
  });
  return deleteRow_(SHEET_NAMES.ASSINATURAS, id);
}

/** Registra um pagamento: empurra o vencimento pelo prazo da assinatura. */
function registrarPagamento(input) {
  requireFields_(input, ['assinaturaId']);
  var assinatura = findById_(SHEET_NAMES.ASSINATURAS, input.assinaturaId);
  if (!assinatura) throw new Error('Assinatura não encontrada: ' + input.assinaturaId);

  var dataPagamento = input.data || todayStr_();
  var baseParaVencimento = assinatura.vencimento && assinatura.vencimento > dataPagamento
    ? assinatura.vencimento
    : dataPagamento;
  var novoVencimento = addDays_(baseParaVencimento, Number(assinatura.prazoDias) || 30);
  var valor = input.valor !== undefined ? Number(input.valor) : Number(assinatura.valorCliente) || 0;

  insertRow_(SHEET_NAMES.PAGAMENTOS, {
    assinaturaId: assinatura.id,
    data: dataPagamento,
    valor: valor,
  });

  return updateRow_(SHEET_NAMES.ASSINATURAS, assinatura.id, {
    diaPago: dataPagamento,
    vencimento: novoVencimento,
  });
}

function listPagamentos(assinaturaId) {
  var rows = readAll_(SHEET_NAMES.PAGAMENTOS).map(stripRow_);
  if (assinaturaId) {
    rows = rows.filter(function (p) {
      return p.assinaturaId === assinaturaId;
    });
  }
  rows.sort(function (x, y) {
    return (y.data || '').localeCompare(x.data || '');
  });
  return rows;
}

/** Histórico de pagamentos de um cliente, juntando todas as assinaturas dele. */
function listPagamentosCliente(clienteId) {
  var assinaturaIds = readAll_(SHEET_NAMES.ASSINATURAS)
    .filter(function (a) {
      return a.clienteId === clienteId;
    })
    .map(function (a) {
      return a.id;
    });
  var assinaturasById = indexBy_(readAll_(SHEET_NAMES.ASSINATURAS), 'id');
  var servidoresById = indexBy_(readAll_(SHEET_NAMES.SERVIDORES), 'id');

  return readAll_(SHEET_NAMES.PAGAMENTOS)
    .filter(function (p) {
      return assinaturaIds.indexOf(p.assinaturaId) !== -1;
    })
    .map(function (p) {
      var assinatura = assinaturasById[p.assinaturaId] || {};
      var servidor = servidoresById[assinatura.servidorId] || {};
      return {
        id: p.id,
        data: p.data,
        valor: round2_(Number(p.valor) || 0),
        servidorNome: servidor.nome || '',
        login: assinatura.login || '',
      };
    })
    .sort(function (x, y) {
      return (y.data || '').localeCompare(x.data || '');
    });
}

// ---------- Vencimentos ----------

function getVencimentos() {
  var hoje = todayStr_();
  var em7dias = addDays_(hoje, 7);
  var todas = listAssinaturas().filter(function (a) {
    return a.status === STATUS.ATIVA || a.status === STATUS.VENCIDA;
  });
  return {
    vencidas: todas.filter(function (a) {
      return a.status === STATUS.VENCIDA;
    }),
    hoje: todas.filter(function (a) {
      return a.status === STATUS.ATIVA && a.vencimento === hoje;
    }),
    proximos7dias: todas.filter(function (a) {
      return a.status === STATUS.ATIVA && a.vencimento > hoje && a.vencimento <= em7dias;
    }),
  };
}

// ---------- Dashboard ----------

function getDashboard() {
  var assinaturas = listAssinaturas();
  var ativasOuVencidas = assinaturas.filter(function (a) {
    return a.status === STATUS.ATIVA || a.status === STATUS.VENCIDA;
  });

  var porServidor = {};
  ativasOuVencidas.forEach(function (a) {
    var key = a.servidorNome;
    if (!porServidor[key]) {
      porServidor[key] = { servidor: key, assinaturas: 0, receita: 0, custo: 0, lucro: 0 };
    }
    porServidor[key].assinaturas += 1;
    porServidor[key].receita += Number(a.valorCliente) || 0;
    porServidor[key].custo += Number(a.custo) || 0;
    porServidor[key].lucro += a.lucro;
  });
  Object.keys(porServidor).forEach(function (k) {
    var s = porServidor[k];
    s.receita = round2_(s.receita);
    s.custo = round2_(s.custo);
    s.lucro = round2_(s.lucro);
    s.margem = s.receita > 0 ? round2_((s.lucro / s.receita) * 100) : 0;
  });

  var totais = ativasOuVencidas.reduce(
    function (acc, a) {
      acc.receita += Number(a.valorCliente) || 0;
      acc.custo += Number(a.custo) || 0;
      acc.lucro += a.lucro;
      return acc;
    },
    { receita: 0, custo: 0, lucro: 0 }
  );

  var gratuitos = assinaturas.filter(function (a) {
    return a.status === STATUS.GRATUITA;
  });
  var gratuitosCusto = gratuitos.reduce(function (sum, a) {
    return sum + (Number(a.custo) || 0);
  }, 0);

  var venc = getVencimentos();
  var inadimplencia = venc.vencidas.reduce(function (sum, a) {
    return sum + (Number(a.valorCliente) || 0);
  }, 0);

  return {
    totais: {
      receita: round2_(totais.receita),
      custo: round2_(totais.custo),
      lucro: round2_(totais.lucro),
      margem: totais.receita > 0 ? round2_((totais.lucro / totais.receita) * 100) : 0,
      assinaturasAtivas: ativasOuVencidas.length,
      clientesUnicos: uniqueCount_(ativasOuVencidas, 'clienteId'),
      inadimplencia: round2_(inadimplencia),
      inadimplentesCount: venc.vencidas.length,
    },
    gratuitos: {
      quantidade: gratuitos.length,
      custo: round2_(gratuitosCusto),
    },
    porServidor: Object.keys(porServidor)
      .map(function (k) {
        return porServidor[k];
      })
      .sort(function (a, b) {
        return b.receita - a.receita;
      }),
    vencimentos: {
      vencidas: venc.vencidas.length,
      hoje: venc.hoje.length,
      proximos7dias: venc.proximos7dias.length,
    },
  };
}

// ---------- Helpers ----------

function stripRow_(obj) {
  var copy = {};
  Object.keys(obj).forEach(function (k) {
    if (k !== '_row') copy[k] = obj[k];
  });
  return copy;
}

function indexBy_(rows, key) {
  var out = {};
  rows.forEach(function (r) {
    out[r[key]] = r;
  });
  return out;
}

function uniqueCount_(rows, key) {
  var set = {};
  rows.forEach(function (r) {
    set[r[key]] = true;
  });
  return Object.keys(set).length;
}

function round2_(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function todayStr_() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
}

function addDays_(dateStr, days) {
  var d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + (Number(days) || 0));
  return Utilities.formatDate(d, 'America/Sao_Paulo', 'yyyy-MM-dd');
}

function requireFields_(obj, fields) {
  var faltando = fields.filter(function (f) {
    return obj[f] === undefined || obj[f] === null || obj[f] === '';
  });
  if (faltando.length) {
    throw new Error('Campos obrigatórios ausentes: ' + faltando.join(', '));
  }
}
