import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const syncEl = document.getElementById('sync-indicator');

let dados = { clientes: [], producoes: [], vendas: [] };
let carregados = { clientes: false, producoes: false, vendas: false };

function fmtBRL(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function fmtData(d){ const [y,m,day]=d.split('-'); return day+'/'+m+'/'+y; }

function marcarSync(status){
  syncEl.className = 'sync-indicator ' + status;
  syncEl.textContent = status==='online' ? 'sincronizado' : status==='error' ? 'erro de conexão' : 'conectando...';
}
function checarCarregado(){
  if(Object.values(carregados).every(Boolean)) marcarSync('online');
}

// ---- listeners em tempo real (qualquer aparelho que editar, todos veem na hora) ----
onSnapshot(collection(db, 'clientes'), snap=>{
  dados.clientes = snap.docs.map(d=>({ id: d.id, ...d.data() }));
  carregados.clientes = true; checarCarregado(); render();
}, () => marcarSync('error'));

onSnapshot(collection(db, 'producoes'), snap=>{
  dados.producoes = snap.docs.map(d=>({ id: d.id, ...d.data() }));
  carregados.producoes = true; checarCarregado(); render();
}, () => marcarSync('error'));

onSnapshot(collection(db, 'vendas'), snap=>{
  dados.vendas = snap.docs.map(d=>({ id: d.id, ...d.data() }));
  carregados.vendas = true; checarCarregado(); render();
}, () => marcarSync('error'));

// ---- navegação ----
document.querySelectorAll('nav.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('section.view').forEach(v=>v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-'+btn.dataset.view).classList.add('active');
  });
});

// ---- render geral ----
function render(){
  renderDatalists();
  renderPainel();
  renderProducao();
  renderVendas();
  renderClientes();
}

// modelos do catálogo Big Pets — lista fechada, aparece como seleção nos formulários.
// Para adicionar/remover um modelo, basta editar esta lista.
const CATALOGO_MODELOS = [
  'Casinha Chalé',
  'Casinha Cabana',
  'Casinha Celeiro',
  'Casinha Dois Andares',
  'Arranhador Pequeno',
  'Arranhador Roda',
  'Arranhador Rampa',
  'Arranhador Dois Andares',
  'Arranhador com Casinha',
  'Arranhador Toca',
  'Arranhador com Descanso',
  'Arranhador Túnel'
];
// cores continuam de preenchimento livre (variam bastante), mas com sugestão do que já foi usado
const CATALOGO_CORES = ['Rose', 'Caramelo', 'Campo', 'Montanha', 'Marrom', 'Bege', 'Verde', 'Creme', 'Verde-musgo', 'Pink', 'Azul-marinho', 'Cinza'];

function renderModeloSelects(){
  const options = '<option value="">Selecione...</option>' + CATALOGO_MODELOS.map(m=>`<option value="${m}">${m}</option>`).join('');
  document.querySelector('#form-producao select[name=modelo]').innerHTML = options;
  document.querySelector('#form-venda select[name=modelo]').innerHTML = options;
}
renderModeloSelects();

function renderDatalists(){
  const cores = new Set(CATALOGO_CORES);
  [...dados.producoes, ...dados.vendas].forEach(x=>{ cores.add(x.cor); });
  document.getElementById('lista-cores').innerHTML = [...cores].map(c=>`<option value="${c}">`).join('');
}

// ---- painel ----
function renderPainel(){
  const totalProduzido = dados.producoes.reduce((s,p)=>s+p.quantidade,0);
  const totalVendido = dados.vendas.reduce((s,v)=>s+v.quantidade,0);
  const receitaTotal = dados.vendas.reduce((s,v)=>s+v.valorTotal,0);
  const estoqueAtual = totalProduzido - totalVendido;

  document.getElementById('stat-grid').innerHTML = `
    <div class="stat"><div class="num">${estoqueAtual}</div><div class="label">peças em estoque</div></div>
    <div class="stat"><div class="num">${totalVendido}</div><div class="label">peças vendidas</div></div>
    <div class="stat"><div class="num">${fmtBRL(receitaTotal)}</div><div class="label">receita total</div></div>
    <div class="stat"><div class="num">${dados.clientes.length}</div><div class="label">clientes cadastrados</div></div>
  `;

  const mapa = {};
  dados.producoes.forEach(p=>{ const k=p.modelo+'|'+p.cor; mapa[k]=(mapa[k]||0)+p.quantidade; });
  dados.vendas.forEach(v=>{ const k=v.modelo+'|'+v.cor; mapa[k]=(mapa[k]||0)-v.quantidade; });
  const linhasEstoque = Object.entries(mapa)
    .filter(([k,q])=>q!==0)
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([k,q])=>{
      const [modelo,cor] = k.split('|');
      const tag = q<=2 ? `<span class="tag alert">${q}</span>` : `<span class="tag">${q}</span>`;
      return `<tr><td>${modelo}</td><td>${cor}</td><td>${tag}</td></tr>`;
    }).join('');
  document.querySelector('#tbl-estoque tbody').innerHTML = linhasEstoque || `<tr><td colspan="3" class="empty">Nenhuma produção registrada ainda.</td></tr>`;

  const hoje = new Date();
  const ultimaCompra = {};
  dados.vendas.forEach(v=>{
    if(!ultimaCompra[v.clienteId] || v.data > ultimaCompra[v.clienteId]) ultimaCompra[v.clienteId] = v.data;
  });
  const linhasRetorno = dados.clientes
    .map(c=>{
      const ult = ultimaCompra[c.id];
      const dias = ult ? Math.floor((hoje - new Date(ult+'T00:00:00'))/86400000) : null;
      return {c, ult, dias};
    })
    .filter(x=>x.ult)
    .sort((a,b)=>b.dias-a.dias)
    .map(x=>{
      const tag = x.dias>60 ? `<span class="tag alert">${x.dias} dias</span>` : `<span class="tag">${x.dias} dias</span>`;
      return `<tr><td>${x.c.nome}</td><td>${x.c.cidade}</td><td>${fmtData(x.ult)}</td><td>${tag}</td></tr>`;
    }).join('');
  document.querySelector('#tbl-retorno tbody').innerHTML = linhasRetorno || `<tr><td colspan="4" class="empty">Nenhuma venda registrada ainda.</td></tr>`;
}

// ---- produção ----
document.getElementById('form-producao').addEventListener('submit', async e=>{
  e.preventDefault();
  const f = new FormData(e.target);
  const statusEl = document.getElementById('status-producao');
  try{
    await addDoc(collection(db,'producoes'), {
      data: f.get('data'),
      modelo: f.get('modelo').trim(),
      cor: f.get('cor').trim(),
      quantidade: parseInt(f.get('quantidade'))
    });
    e.target.reset();
    statusEl.textContent = 'Produção registrada.'; statusEl.className = 'status ok';
  }catch(err){
    statusEl.textContent = 'Erro ao salvar. Verifique a conexão.'; statusEl.className = 'status err';
  }
});

function renderProducao(){
  const rows = [...dados.producoes].sort((a,b)=>b.data.localeCompare(a.data))
    .map(p=>`<tr><td>${fmtData(p.data)}</td><td>${p.modelo}</td><td>${p.cor}</td><td>${p.quantidade}</td>
      <td><button class="btn ghost" data-remover-producao="${p.id}">remover</button></td></tr>`).join('');
  document.querySelector('#tbl-producao tbody').innerHTML = rows || `<tr><td colspan="5" class="empty">Nada registrado ainda.</td></tr>`;
}
document.querySelector('#tbl-producao tbody').addEventListener('click', async e=>{
  const id = e.target.dataset.removerProducao;
  if(id) await deleteDoc(doc(db,'producoes',id));
});

// ---- clientes ----
let editandoClienteId = null;

function iniciarEdicaoCliente(id){
  const c = dados.clientes.find(c=>c.id===id);
  if(!c) return;
  const form = document.getElementById('form-cliente');
  form.nome.value = c.nome || '';
  form.cidade.value = c.cidade || '';
  form.endereco.value = c.endereco || '';
  form.telefone.value = c.telefone || '';
  form.cnpj.value = c.cnpj || '';
  form.precisaNF.checked = !!c.precisaNF;
  editandoClienteId = id;
  document.getElementById('btn-submit-cliente').textContent = 'Salvar alterações';
  document.getElementById('btn-cancelar-cliente').style.display = 'inline-block';
  form.scrollIntoView({behavior:'smooth', block:'start'});
}

function cancelarEdicaoCliente(){
  editandoClienteId = null;
  document.getElementById('form-cliente').reset();
  document.getElementById('btn-submit-cliente').textContent = 'Adicionar cliente';
  document.getElementById('btn-cancelar-cliente').style.display = 'none';
}
document.getElementById('btn-cancelar-cliente').addEventListener('click', cancelarEdicaoCliente);

document.getElementById('form-cliente').addEventListener('submit', async e=>{
  e.preventDefault();
  const f = new FormData(e.target);
  const statusEl = document.getElementById('status-cliente');
  const dadosCliente = {
    nome: f.get('nome').trim(),
    cidade: f.get('cidade').trim(),
    endereco: f.get('endereco').trim(),
    telefone: f.get('telefone').trim(),
    cnpj: f.get('cnpj').trim(),
    precisaNF: f.get('precisaNF') === 'on'
  };
  try{
    if(editandoClienteId){
      await updateDoc(doc(db,'clientes',editandoClienteId), dadosCliente);
      statusEl.textContent = 'Cliente atualizado.'; statusEl.className = 'status ok';
      cancelarEdicaoCliente();
    }else{
      await addDoc(collection(db,'clientes'), dadosCliente);
      e.target.reset();
      statusEl.textContent = 'Cliente adicionado.'; statusEl.className = 'status ok';
    }
  }catch(err){
    statusEl.textContent = 'Erro ao salvar. Verifique a conexão.'; statusEl.className = 'status err';
  }
});

function renderClientes(){
  const rows = dados.clientes.map(c=>
    `<tr><td><span class="client-link" data-ver-historico="${c.id}">${c.nome}</span>${c.precisaNF ? ' <span class="tag nf">NF</span>' : ''}</td><td>${c.cidade}</td><td>${c.cnpj||'—'}</td><td>${c.telefone||'—'}</td>
      <td><button class="btn ghost" data-editar-cliente="${c.id}">editar</button></td>
      <td><button class="btn ghost" data-remover-cliente="${c.id}">remover</button></td></tr>`
  ).join('');
  document.querySelector('#tbl-clientes tbody').innerHTML = rows || `<tr><td colspan="6" class="empty">Nenhum cliente cadastrado.</td></tr>`;

  const sel = document.querySelector('#form-venda select[name=clienteId]');
  const atual = sel.value;
  sel.innerHTML = '<option value="">Selecione...</option>' +
    dados.clientes.map(c=>`<option value="${c.id}">${c.nome} — ${c.cidade}</option>`).join('');
  sel.value = atual;
}
document.querySelector('#tbl-clientes tbody').addEventListener('click', async e=>{
  const remId = e.target.dataset.removerCliente;
  const histId = e.target.dataset.verHistorico;
  const editId = e.target.dataset.editarCliente;
  if(remId) await deleteDoc(doc(db,'clientes',remId));
  if(histId) verHistorico(histId);
  if(editId) iniciarEdicaoCliente(editId);
});

function verHistorico(id){
  const c = dados.clientes.find(c=>c.id===id);
  const vendas = dados.vendas.filter(v=>v.clienteId===id).sort((a,b)=>b.data.localeCompare(a.data));
  const linhas = vendas.map(v=>`<div class="hrow"><span>${fmtData(v.data)} — ${v.modelo} ${v.cor} (${v.quantidade}un)</span><span>${fmtBRL(v.valorTotal)}</span></div>`).join('')
    || '<div class="hrow"><span>Nenhuma compra registrada.</span></div>';
  const existente = document.getElementById('hist-temp');
  if(existente) existente.remove();
  const box = document.createElement('div');
  box.className = 'hist-box';
  box.id = 'hist-temp';
  box.innerHTML = `
    <div class="hist-top">
      <strong>${c.nome}</strong>${c.precisaNF ? ' <span class="tag nf">NF</span>' : ''}
      <button class="btn ghost" type="button" id="hist-fechar">fechar</button>
    </div>
    <div class="hist-dados">
      <div><span class="hist-label">Cidade</span>${c.cidade || 'não informado'}</div>
      <div><span class="hist-label">Endereço</span>${c.endereco || 'não informado'}</div>
      <div><span class="hist-label">Telefone</span>${c.telefone || 'não informado'}</div>
      <div><span class="hist-label">CNPJ</span>${c.cnpj || 'não informado'}</div>
    </div>
    <div class="hist-label" style="margin-top:10px">Histórico de compras</div>
    ${linhas}
  `;
  document.querySelector('#view-clientes .card:last-child').appendChild(box);
  document.getElementById('hist-fechar').addEventListener('click', ()=>box.remove());
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}

// ---- vendas ----
document.getElementById('form-venda').addEventListener('submit', async e=>{
  e.preventDefault();
  const f = new FormData(e.target);
  const qtd = parseInt(f.get('quantidade'));
  const valorUnit = parseFloat(f.get('valorUnitario'));
  const statusEl = document.getElementById('status-venda');
  try{
    await addDoc(collection(db,'vendas'), {
      data: f.get('data'),
      clienteId: f.get('clienteId'),
      modelo: f.get('modelo').trim(),
      cor: f.get('cor').trim(),
      quantidade: qtd,
      valorUnitario: valorUnit,
      valorTotal: qtd*valorUnit
    });
    e.target.reset();
    statusEl.textContent = 'Venda registrada.'; statusEl.className = 'status ok';
  }catch(err){
    statusEl.textContent = 'Erro ao salvar. Verifique a conexão.'; statusEl.className = 'status err';
  }
});

function renderVendas(){
  const rows = [...dados.vendas].sort((a,b)=>b.data.localeCompare(a.data))
    .map(v=>{
      const cliente = dados.clientes.find(c=>c.id===v.clienteId);
      return `<tr><td>${fmtData(v.data)}</td><td>${cliente ? cliente.nome : '—'}</td><td>${v.modelo} ${v.cor}</td><td>${v.quantidade}</td><td>${fmtBRL(v.valorTotal)}</td>
        <td><button class="btn ghost" data-remover-venda="${v.id}">remover</button></td></tr>`;
    }).join('');
  document.querySelector('#tbl-vendas tbody').innerHTML = rows || `<tr><td colspan="6" class="empty">Nenhuma venda registrada.</td></tr>`;
}
document.querySelector('#tbl-vendas tbody').addEventListener('click', async e=>{
  const id = e.target.dataset.removerVenda;
  if(id) await deleteDoc(doc(db,'vendas',id));
});
