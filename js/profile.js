function ensureAuth() {
  var t = localStorage.getItem('vc_token');
  if (!t) window.location.href = 'login.html';
}

function loadProfile() {
  var t = localStorage.getItem('vc_token');
  var API_BASE = (function(){
    var v = localStorage.getItem('vc_api_base') || '';
    if (v) return v.replace(/\/+$/,'');
    var origin = window.location.origin;
    var isDevStatic = origin.indexOf('127.0.0.1:5500') !== -1 || origin.indexOf('localhost:5500') !== -1;
    if (isDevStatic) return 'http://localhost:3000';
    return '';
  })();
  fetch(API_BASE + '/api/me', { headers: { 'Authorization': 'Bearer ' + t } })
    .then(function(r){ return r.json(); })
    .then(function(j){
      var u = j.user;
      var c = document.getElementById('profileContainer');
      c.innerHTML = '';
      var card = document.createElement('div');
      card.className = 'course-card';
      var content = document.createElement('div');
      content.className = 'course-content';
      var name = document.createElement('h3');
      name.className = 'course-title';
      name.textContent = u.name;
      var email = document.createElement('p');
      email.className = 'course-instructor';
      email.textContent = u.email + ' • ' + u.role;
      var input = document.createElement('input');
      input.className = 'search-input';
      input.value = u.name;
      input.style.marginTop = '8px';
      var btn = document.createElement('button');
      btn.className = 'btn-primary';
      btn.textContent = 'Update Name';
      btn.style.marginTop = '12px';
      btn.addEventListener('click', function(){ updateName(input.value); });
      content.appendChild(name);
      content.appendChild(email);
      content.appendChild(input);
      content.appendChild(btn);
      card.appendChild(content);
      c.appendChild(card);
    });
}

function updateName(name) {
  var t = localStorage.getItem('vc_token');
  fetch(API_BASE + '/api/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
    body: JSON.stringify({ name: name })
  }).then(function(r){ return r.json(); }).then(function(){ loadProfile(); });
}

document.addEventListener('DOMContentLoaded', function(){
  ensureAuth();
  var logout = document.getElementById('logoutLink');
  if (logout) logout.addEventListener('click', function(e){ e.preventDefault(); logout(); window.location.href = 'index.html'; });
  loadProfile();
});