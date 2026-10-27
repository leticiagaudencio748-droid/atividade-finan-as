const STORAGE_KEY = "meusaldo-transacoes-v1";

const form = document.querySelector("#transaction-form");
const descricaoInput = document.querySelector("#descricao");
const valorInput = document.querySelector("#valor");
const tipoInput = document.querySelector("#tipo");
const lista = document.querySelector("#transaction-list");
const emptyState = document.querySelector("#empty-state");
const feedback = document.querySelector("#form-feedback");
const totalEntradasEl = document.querySelector("#total-entradas");
const totalSaidasEl = document.querySelector("#total-saidas");
const saldoTotalEl = document.querySelector("#saldo-total");
const transactionCount = document.querySelector("#transaction-count");
const clearAllButton = document.querySelector("#clear-all");

let transacoes = carregarTransacoes();

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

function carregarTransacoes() {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);
    const parseado = dados ? JSON.parse(dados) : [];
    return Array.isArray(parseado) ? parseado.filter((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.descricao === "string" &&
      Number.isFinite(item.valor) &&
      item.valor > 0 &&
      ["entrada", "saida"].includes(item.tipo)
    ) : [];
  } catch (erro) {
    console.error("Não foi possível carregar as transações:", erro);
    return [];
  }
}

function salvarTransacoes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transacoes));
    return true;
  } catch (erro) {
    console.error("Não foi possível salvar as transações:", erro);
    feedback.textContent = "Não foi possível salvar. Verifique o armazenamento do navegador.";
    return false;
  }
}

function criarCelula(texto) {
  const celula = document.createElement("td");
  celula.textContent = texto;
  return celula;
}

function renderizarTransacoes() {
  lista.replaceChildren();

  const entradas = transacoes
    .filter((item) => item.tipo === "entrada")
    .reduce((soma, item) => soma + item.valor, 0);
  const saidas = transacoes
    .filter((item) => item.tipo === "saida")
    .reduce((soma, item) => soma + item.valor, 0);
  const saldo = entradas - saidas;

  totalEntradasEl.textContent = formatarMoeda(entradas);
  totalSaidasEl.textContent = formatarMoeda(saidas);
  saldoTotalEl.textContent = formatarMoeda(saldo);
  saldoTotalEl.style.color = saldo < 0 ? "#ffb6be" : "#ffffff";
  transactionCount.textContent = `${transacoes.length} ${transacoes.length === 1 ? "item" : "itens"}`;
  emptyState.hidden = transacoes.length > 0;
  clearAllButton.disabled = transacoes.length === 0;
  clearAllButton.style.opacity = transacoes.length === 0 ? ".45" : "1";

  [...transacoes].reverse().forEach((transacao) => {
    const linha = document.createElement("tr");
    linha.appendChild(criarCelula(transacao.descricao));

    const tipoCelula = document.createElement("td");
    const tipoPill = document.createElement("span");
    tipoPill.className = `type-pill ${transacao.tipo}`;
    tipoPill.textContent = transacao.tipo === "entrada" ? "Entrada" : "Saída";
    tipoCelula.appendChild(tipoPill);
    linha.appendChild(tipoCelula);

    const valorFormatado = `${transacao.tipo === "entrada" ? "+" : "−"} ${formatarMoeda(transacao.valor)}`;
    const valorCelula = criarCelula(valorFormatado);
    valorCelula.classList.add(transacao.tipo === "entrada" ? "green-text" : "red-text");
    linha.appendChild(valorCelula);

    const acoes = document.createElement("td");
    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "delete-button";
    excluir.textContent = "Excluir";
    excluir.setAttribute("aria-label", `Excluir transação ${transacao.descricao}`);
    excluir.addEventListener("click", () => excluirTransacao(transacao.id));
    acoes.appendChild(excluir);
    linha.appendChild(acoes);
    lista.appendChild(linha);
  });
}

function excluirTransacao(id) {
  transacoes = transacoes.filter((item) => item.id !== id);
  salvarTransacoes();
  renderizarTransacoes();
  feedback.textContent = "Transação excluída.";
}

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const descricao = descricaoInput.value.trim();
  const valor = Number(valorInput.value);
  const tipo = tipoInput.value;

  if (!descricao) {
    feedback.textContent = "Digite o nome da transação.";
    descricaoInput.focus();
    return;
  }
  if (!Number.isFinite(valor) || valor <= 0) {
    feedback.textContent = "Informe um valor maior que zero.";
    valorInput.focus();
    return;
  }

  const novaTransacao = {
    id: (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    descricao,
    valor: Math.round((valor + Number.EPSILON) * 100) / 100,
    tipo
  };

  transacoes.push(novaTransacao);
  const salvo = salvarTransacoes();
  renderizarTransacoes();
  form.reset();
  tipoInput.value = "entrada";
  descricaoInput.focus();
  feedback.textContent = salvo ? "Transação adicionada com sucesso!" : "Transação adicionada nesta sessão, mas não foi salva.";
});

clearAllButton.addEventListener("click", () => {
  if (transacoes.length === 0) return;
  const confirmar = window.confirm("Tem certeza de que deseja apagar todo o histórico?");
  if (!confirmar) return;
  transacoes = [];
  salvarTransacoes();
  renderizarTransacoes();
  feedback.textContent = "Histórico limpo.";
});

renderizarTransacoes();
