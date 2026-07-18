fetch('data.json')
  .then(r => r.json())
  .then(RAW => {

const rows = RAW.rows.map(r => ({
  ies: RAW.ies[r[0]],
  sigla: RAW.sigla[r[0]],
  uf: RAW.uf[r[1]],
  cidade: RAW.cidade[r[2]],
  campus: RAW.campus[r[3]],
  curso: RAW.curso[r[4]],
  grau: RAW.grau[r[5]],
  turno: RAW.turno[r[6]],
  categoria: RAW.categoria[r[7]],
  nota: r[8],
  vagas: r[9]
}));

// populate stats
const nIes = new Set(rows.map(r=>r.ies)).size;
const nCursos = new Set(rows.map(r=>r.curso)).size;
const nUf = new Set(rows.map(r=>r.uf)).size;
document.getElementById('statsRow').innerHTML = `
  <div class="stat"><b>${rows.length.toLocaleString('pt-BR')}</b><span>Notas de corte</span></div>
  <div class="stat"><b>${nIes}</b><span>Instituições</span></div>
  <div class="stat"><b>${nCursos}</b><span>Cursos distintos</span></div>
  <div class="stat"><b>${nUf}</b><span>Estados</span></div>
`;

function fillSelect(id, values, labelFn){
  const el = document.getElementById(id);
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = labelFn ? labelFn(v) : v;
    el.appendChild(opt);
  });
}

const ufOrder = [...new Set(rows.map(r=>r.uf))].sort();
fillSelect('fUf', ufOrder);

const iesOrder = [...new Set(rows.map(r=>r.ies))].sort();
const siglaByIes = {};
rows.forEach(r=>siglaByIes[r.ies]=r.sigla);
fillSelect('fIes', iesOrder, v => `${siglaByIes[v]} — ${v.length>42? v.slice(0,42)+'…': v}`);

const turnoOrder = [...new Set(rows.map(r=>r.turno))].sort();
fillSelect('fTurno', turnoOrder);

const catOrder = [...new Set(rows.map(r=>r.categoria))].sort();
fillSelect('fCat', catOrder);

const els = {
  curso: document.getElementById('fCurso'),
  uf: document.getElementById('fUf'),
  ies: document.getElementById('fIes'),
  turno: document.getElementById('fTurno'),
  cat: document.getElementById('fCat'),
  nota: document.getElementById('fNota'),
  soElegivel: document.getElementById('fSoElegivel'),
  sort: document.getElementById('sortSelect'),
  body: document.getElementById('resultsBody'),
  count: document.getElementById('resultCount'),
  empty: document.getElementById('emptyState'),
  pagination: document.getElementById('pagination')
};

let page = 1;
const PAGE_SIZE = 40;

function getFiltered(){
  const cursoQ = els.curso.value.trim().toLowerCase();
  const uf = els.uf.value;
  const ies = els.ies.value;
  const turno = els.turno.value;
  const cat = els.cat.value;
  const notaEnem = els.nota.value === '' ? null : parseFloat(els.nota.value);
  const soElegivel = els.soElegivel.checked;

  let f = rows.filter(r => {
    if (cursoQ && !r.curso.toLowerCase().includes(cursoQ)) return false;
    if (uf && r.uf !== uf) return false;
    if (ies && r.ies !== ies) return false;
    if (turno && r.turno !== turno) return false;
    if (cat && r.categoria !== cat) return false;
    if (soElegivel && notaEnem !== null && r.nota > notaEnem) return false;
    return true;
  });

  const sortVal = els.sort.value;
  if (sortVal === 'nota_asc') f.sort((a,b)=>a.nota-b.nota);
  else if (sortVal === 'nota_desc') f.sort((a,b)=>b.nota-a.nota);
  else if (sortVal === 'curso_az') f.sort((a,b)=>a.curso.localeCompare(b.curso));
  else if (sortVal === 'ies_az') f.sort((a,b)=>a.ies.localeCompare(b.ies));

  return {f, notaEnem};
}

function render(){
  const {f, notaEnem} = getFiltered();
  els.count.textContent = f.length.toLocaleString('pt-BR');
  els.empty.style.display = f.length === 0 ? 'block' : 'none';

  const totalPages = Math.max(1, Math.ceil(f.length / PAGE_SIZE));
  if (page > totalPages) page = totalPages;
  const start = (page-1)*PAGE_SIZE;
  const pageRows = f.slice(start, start+PAGE_SIZE);

  els.body.innerHTML = pageRows.map(r => {
    let notaClass = '';
    if (notaEnem !== null) notaClass = r.nota <= notaEnem ? 'eligivel' : 'inelegivel';
    return `
      <tr>
        <td class="ies-cell"><b>${r.sigla}</b><span>${r.campus} · ${r.cidade}/${r.uf}</span></td>
        <td class="curso-cell"><b>${r.curso}</b><span>${r.grau}</span></td>
        <td>${r.turno}</td>
        <td><span class="cat-pill">${r.categoria}</span></td>
        <td class="nota-cell ${notaClass}">${r.nota.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  els.pagination.innerHTML = `
    <button id="prevBtn" ${page<=1?'disabled':''}>← anterior</button>
    <span>página ${page} de ${totalPages}</span>
    <button id="nextBtn" ${page>=totalPages?'disabled':''}>próxima →</button>
  `;
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  if (prev) prev.onclick = () => { page--; render(); window.scrollTo({top:document.querySelector('.console').offsetTop-10, behavior:'smooth'}); };
  if (next) next.onclick = () => { page++; render(); window.scrollTo({top:document.querySelector('.console').offsetTop-10, behavior:'smooth'}); };
}

['input','change'].forEach(evt => {
  els.curso.addEventListener(evt, () => { page=1; render(); });
  els.uf.addEventListener(evt, () => { page=1; render(); });
  els.ies.addEventListener(evt, () => { page=1; render(); });
  els.turno.addEventListener(evt, () => { page=1; render(); });
  els.cat.addEventListener(evt, () => { page=1; render(); });
  els.nota.addEventListener(evt, () => { page=1; render(); });
  els.soElegivel.addEventListener(evt, () => { page=1; render(); });
  els.sort.addEventListener(evt, () => { page=1; render(); });
});

render();

  });
