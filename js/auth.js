function setCurrentUser(user) {
  localStorage.setItem('vc_currentUser', JSON.stringify({ name: user.name, email: user.email, role: user.role }));
}

function getCurrentUser() {
  const raw = localStorage.getItem('vc_currentUser');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function getToken() {
  return localStorage.getItem('vc_token') || '';
}

function setToken(token) {
  localStorage.setItem('vc_token', token);
}

function showMessage(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
}

function clearMessages() {
  const err = document.getElementById('errorMessage');
  const ok = document.getElementById('successMessage');
  if (err) err.style.display = 'none';
  if (ok) ok.style.display = 'none';
}

function register(name, email, password, role) {
  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  }).then(function(r) { return r.json().then(function(j) { return { ok: r.ok, data: j }; }); })
    .then(function(res) {
      if (!res.ok) {
        if (res.data && res.data.error === 'email_exists') {
          showMessage('errorMessage', '❌ Email already registered. Please login.');
        } else {
          showMessage('errorMessage', '❌ Registration failed.');
        }
        return;
      }
      showMessage('successMessage', '✅ Account created successfully. Redirecting to login...');
      setTimeout(function() { window.location.href = 'login.html'; }, 1200);
    })
}

function login(email, password) {
  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(function(r) { return r.json().then(function(j) { return { ok: r.ok, data: j }; }); })
    .then(function(res) {
      if (!res.ok) {
        showMessage('errorMessage', '❌ Invalid email or password.');
        return;
      }
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      showMessage('successMessage', '✅ Login successful. Redirecting...');
      setTimeout(function() { window.location.href = 'dashboard.html'; }, 1000);
    })
}

function logout() {
  localStorage.removeItem('vc_currentUser');
  localStorage.removeItem('vc_token');
}

function addEnrollment(course) {
  const token = getToken();
  if (!token) return false;
  return fetch('/api/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(course)
  }).then(function(r) { return r.ok; });
}

function getEnrollments() {
  const token = getToken();
  if (!token) return [];
  return fetch('/api/enrollments', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function(r) { return r.json(); })
    .then(function(j) { return j.enrollments || []; });
}

function removeEnrollment(id) {
  const token = getToken();
  if (!token) return false;
  return fetch('/api/enrollments/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function(r) { return r.ok; });
}