function ensureAuth() {
  const token = localStorage.getItem('vc_token');
  if (!token) window.location.href = 'login.html';
}

function renderHeader() {
  const token = localStorage.getItem('vc_token');
  const subtitle = document.getElementById('dashSubtitle');
  if (!token) return;
  fetch('/api/me', { headers: { 'Authorization': 'Bearer ' + token } })
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
      const img = document.createElement('img');
      img.src = 'https://via.placeholder.com/300x200/e0f2fe/0f172a?text=Enrolled';
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
      removeBtn.className = 'btn-primary';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', function () {
        removeEnrollment(course.id).then(function () { renderEnrollments(); });
      });

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn-primary';
      viewBtn.textContent = 'View Details';
      viewBtn.addEventListener('click', function () {
        if (course.course_id) {
          window.location.href = 'course.html?id=' + encodeURIComponent(course.course_id);
        } else {
          fetch('/api/courses').then(function (r) { return r.json(); }).then(function (j) {
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
      contBtn.textContent = 'Continue';
      contBtn.addEventListener('click', function(){
        const token = localStorage.getItem('vc_token');
        const cid = course.course_id;
        if (!cid) { viewBtn.click(); return; }
        fetch('/api/courses/' + cid + '/next-incomplete', { headers: { 'Authorization': 'Bearer ' + token }})
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