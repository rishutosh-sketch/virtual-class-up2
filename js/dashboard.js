function ensureAuth() {
  const token = localStorage.getItem('vc_token');
  if (!token) window.location.href = 'login.html';
}

function renderHeader() {
  const token = localStorage.getItem('vc_token');
  const subtitle = document.getElementById('dashSubtitle');
  if (!token) return;
  var API_BASE = (function(){
    var v = localStorage.getItem('vc_api_base') || '';
    if (v) return v.replace(/\/+$/,'');
    var origin = window.location.origin;
    var isDevStatic = origin.indexOf('127.0.0.1:5500') !== -1 || origin.indexOf('localhost:5500') !== -1;
    if (isDevStatic) return 'http://localhost:3000';
    return '';
  })();
  fetch(API_BASE + '/api/me', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      const u = j.user;
      if (u) subtitle.textContent = (u.name || u.email) + ' • ' + (u.role || 'learner');
    });
}

function renderEnrollments() {
  const grid = document.getElementById('enrollGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = '';
  (function(){
    for (var i=0;i<3;i++){
      var card = document.createElement('div'); card.className = 'skeleton-card';
      var img = document.createElement('div'); img.className = 'skeleton-img skeleton-shimmer'; card.appendChild(img);
      var l1 = document.createElement('div'); l1.className = 'skeleton-line skeleton-shimmer'; card.appendChild(l1);
      var l2 = document.createElement('div'); l2.className = 'skeleton-line skeleton-shimmer'; card.appendChild(l2);
      grid.appendChild(card);
    }
  })();
  Promise.resolve(getEnrollments()).then(function (items) {
    if (!items.length) {
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';
  items.forEach(function (course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    const imgWrap = document.createElement('div');
    imgWrap.className = 'course-image';
    function imageForCategory(cat){
      var u = {
        'Web Dev': 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
        'Programming': 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=80',
        'Coding': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
        'Data Science': 'https://images.unsplash.com/photo-1529101091764-c3526daf38fe?auto=format&fit=crop&w=1200&q=80',
        'Design': 'https://images.unsplash.com/photo-1554995207-46ebb1e3f9c7?auto=format&fit=crop&w=1200&q=80',
        'Database': 'https://images.unsplash.com/photo-1558494949-ef5c343b51b7?auto=format&fit=crop&w=1200&q=80',
        'Backend': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        'Cloud': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80',
        'DevOps': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
      };
      return u[cat] || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80';
    }
    const img = document.createElement('img');
    img.src = course.image_url || imageForCategory(course.category || '');
    img.alt = course.title;
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    imgWrap.appendChild(img);
    imgWrap.appendChild(overlay);
      const content = document.createElement('div');
      content.className = 'course-content';
      const h = document.createElement('h3');
      h.className = 'course-title';
      h.textContent = course.title;
      const inst = document.createElement('p');
      inst.className = 'course-instructor';
      inst.textContent = course.instructor || '';
      const cat = document.createElement('span');
      cat.className = 'course-category';
      cat.textContent = course.category || '';
      const actions = document.createElement('div');
      actions.style.display = 'grid';
      actions.style.gridTemplateColumns = '1fr 1fr';
      actions.style.gap = '12px';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-secondary';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', function () {
        removeEnrollment(course.id).then(function () { renderEnrollments(); });
      });

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn-primary';
      viewBtn.textContent = '🔎 View Details';
      viewBtn.addEventListener('click', function () {
        if (course.course_id) {
          window.location.href = 'course.html?id=' + encodeURIComponent(course.course_id);
        } else {
          fetch(API_BASE + '/api/courses').then(function (r) { return r.json(); }).then(function (j) {
            const list = j.courses || [];
            const match = list.find(function (c) { return (c.title || '').trim() === (course.title || '').trim(); });
            if (match && match.id) {
              window.location.href = 'course.html?id=' + encodeURIComponent(match.id);
            } else {
              alert('Course details not found.');
            }
          });
        }
      });

      const contBtn = document.createElement('button');
      contBtn.className = 'btn-primary';
      contBtn.textContent = '⏩ Continue';
      contBtn.addEventListener('click', function(){
        const token = localStorage.getItem('vc_token');
        const cid = course.course_id;
        if (!cid) { viewBtn.click(); return; }
        fetch(API_BASE + '/api/courses/' + cid + '/next-incomplete', { headers: { 'Authorization': 'Bearer ' + token }})
          .then(function(r){ return r.json(); })
          .then(function(j){
            const idx = j.order_index || 1;
            window.location.href = 'course.html?id=' + encodeURIComponent(cid) + '#lesson=' + encodeURIComponent(idx);
          });
      });

      actions.appendChild(viewBtn);
      actions.appendChild(contBtn);
      actions.appendChild(removeBtn);
      content.appendChild(h);
      content.appendChild(inst);
      content.appendChild(cat);
      content.appendChild(actions);
      card.appendChild(imgWrap);
      card.appendChild(content);
      grid.appendChild(card);
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  ensureAuth();
  renderHeader();
  const logout = document.getElementById('logoutLink');
  if (logout) {
    logout.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('vc_currentUser');
      window.location.href = 'index.html';
    });
  }
  renderEnrollments();
});