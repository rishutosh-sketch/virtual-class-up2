var API_BASE = (function(){
  var v = localStorage.getItem('vc_api_base') || '';
  if (v) return v.replace(/\/+$/,'');
  var origin = window.location.origin;
  var isDevStatic = origin.indexOf('127.0.0.1:5500') !== -1 || origin.indexOf('localhost:5500') !== -1;
  if (isDevStatic) return 'http://localhost:3000';
  return '';
})();

function token() { return localStorage.getItem('vc_token') || ''; }
function currentUser(){ try { return JSON.parse(localStorage.getItem('vc_currentUser')||'null'); } catch(_) { return null; } }

function requireAdmin(){
  var u = currentUser();
  if (!u || u.role !== 'admin') { alert('Admin only'); window.location.href = 'login.html'; }
}

function renderTable(courses){
  var wrap = document.getElementById('adminTableWrap');
  var table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  var thead = document.createElement('thead');
  var hrow = document.createElement('tr');
  ['ID','Title','Category','Instructor','Level','Duration','Image URL','Actions'].forEach(function(h){ var th=document.createElement('th'); th.textContent=h; th.style.textAlign='left'; th.style.padding='8px'; th.style.borderBottom='1px solid var(--border)'; thead.appendChild(th); });
  table.appendChild(thead);
  var tbody = document.createElement('tbody');
  (courses||[]).forEach(function(c){
    var tr = document.createElement('tr');
    function td(v){ var t=document.createElement('td'); t.style.padding='8px'; t.style.borderBottom='1px solid var(--border)'; t.appendChild(v); return t; }
    tr.appendChild(td(document.createTextNode(String(c.id))));
    var ti=document.createElement('input'); ti.value=c.title||''; ti.style.width='100%'; tr.appendChild(td(ti));
    var ca=document.createElement('input'); ca.value=c.category||''; ca.style.width='100%'; tr.appendChild(td(ca));
    var ins=document.createElement('input'); ins.value=c.instructor||''; ins.style.width='100%'; tr.appendChild(td(ins));
    var lv=document.createElement('input'); lv.value=c.level||''; lv.style.width='100%'; tr.appendChild(td(lv));
    var du=document.createElement('input'); du.value=c.duration||''; du.style.width='100%'; tr.appendChild(td(du));
    var im=document.createElement('input'); im.value=c.image_url||''; im.style.width='100%'; tr.appendChild(td(im));
    var act=document.createElement('div');
    var save=document.createElement('button'); save.className='btn-primary'; save.style.width='auto'; save.textContent='Save';
    save.addEventListener('click', function(){
      var body={ title: ti.value, category: ca.value, instructor: ins.value, level: lv.value, duration: du.value, image_url: im.value };
      fetch(API_BASE + '/api/courses/' + c.id, { method:'PATCH', headers:{ 'Content-Type':'application/json','Authorization':'Bearer ' + token() }, body: JSON.stringify(body) })
        .then(function(r){ return r.json(); }).then(function(){ load(); });
    });
    act.appendChild(save);
    tr.appendChild(td(act));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.innerHTML='';
  wrap.appendChild(table);
}

function load(){
  requireAdmin();
  fetch(API_BASE + '/api/admin/courses', { headers:{ 'Authorization':'Bearer ' + token() }})
    .then(function(r){ return r.json(); })
    .then(function(j){ renderTable(j.courses || []); });
}

document.addEventListener('DOMContentLoaded', load);