function getCurrentUser() {
  const raw = localStorage.getItem('vc_currentUser');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function setupNavAuth() {
  const user = getCurrentUser();
  const links = document.querySelectorAll('.nav-links .nav-link');
  const loginLink = Array.from(links).find(a => a.textContent.includes('Login'));
  if (user && loginLink) {
    loginLink.textContent = '🔓 Logout';
    loginLink.href = '#';
    loginLink.classList.remove('btn-glow');
    loginLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (typeof logout === 'function') logout();
      window.location.reload();
    });

    const navList = document.querySelector('.nav-links');
    const exists = Array.from(navList.querySelectorAll('a')).some(a => a.textContent.includes('Dashboard'));
    if (!exists) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = 'dashboard.html';
      a.className = 'nav-link btn-glow';
      a.textContent = '📚 Dashboard';
      li.appendChild(a);
      navList.insertBefore(li, loginLink.parentElement);
    }
    if (user.role === 'admin') {
      const hasAdmin = Array.from(navList.querySelectorAll('a')).some(a => a.textContent.includes('Admin'));
      if (!hasAdmin) {
        const li2 = document.createElement('li');
        const a2 = document.createElement('a');
        a2.href = 'admin.html';
        a2.className = 'nav-link';
        a2.textContent = '🛠 Admin';
        li2.appendChild(a2);
        navList.insertBefore(li2, loginLink.parentElement);
      }
    }
  }
}

function filterCourses(query) {
  const q = query.trim().toLowerCase();
  const cards = document.querySelectorAll('#coursesGrid .course-card');
  cards.forEach(card => {
    const text = [
      card.querySelector('.course-title')?.textContent || '',
      card.querySelector('.course-instructor')?.textContent || '',
      card.querySelector('.course-category')?.textContent || ''
    ].join(' ').toLowerCase();
    card.style.display = q === '' || text.includes(q) ? '' : 'none';
  });
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  const saved = localStorage.getItem('vc_lastSearch') || '';
  input.value = saved;
  filterCourses(saved);
  input.addEventListener('input', function() {
    localStorage.setItem('vc_lastSearch', this.value);
    filterCourses(this.value);
  });
}

function renderCourses(courses) {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  function iconFor(cat){
    var m = { 'Web Dev':'🌐', 'Programming':'💻', 'Coding':'💻', 'Data Science':'📊', 'Design':'🎨', 'Database':'🗂', 'Backend':'⚙️', 'Cloud':'☁️', 'DevOps':'🔧' };
    return m[cat] || '📘';
  }
  function imageForCourse(c){
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
    return u[c.category] || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80';
  }
  courses.forEach(c => {
    const card = document.createElement('div');
    card.className = 'course-card';
    const imgWrap = document.createElement('div');
    imgWrap.className = 'course-image';
    const img = document.createElement('img');
    img.src = c.image_url || imageForCourse(c);
    img.alt = c.title;
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    imgWrap.appendChild(img);
    imgWrap.appendChild(overlay);
    const content = document.createElement('div');
    content.className = 'course-content';
    const title = document.createElement('h3');
    title.className = 'course-title';
    title.textContent = c.title;
    const instructor = document.createElement('p');
    instructor.className = 'course-instructor';
    instructor.textContent = 'By ' + c.instructor;
    const meta = document.createElement('p');
    meta.className = 'course-desc';
    meta.textContent = c.level + ' • ' + c.duration;
    const category = document.createElement('span');
    category.className = 'course-category';
    category.textContent = iconFor(c.category) + ' ' + c.category;
    const actions = document.createElement('div');
    const learnBtn = document.createElement('button');
    learnBtn.className = 'btn-primary';
    learnBtn.textContent = '🔎 View Details';
    learnBtn.addEventListener('click', function(){ window.location.href = 'course.html?id=' + encodeURIComponent(c.id); });
    const enrollBtn = document.createElement('button');
    enrollBtn.className = 'btn-primary';
    enrollBtn.textContent = '✅ Enroll';
    enrollBtn.addEventListener('click', function(e){
      if (!getCurrentUser()) { window.location.href = 'login.html'; return; }
      addEnrollment({ title: c.title, instructor: 'By ' + c.instructor, category: c.category, course_id: c.id });
      window.location.href = 'dashboard.html';
    });
    actions.appendChild(learnBtn);
    actions.appendChild(enrollBtn);
    actions.style.display = 'grid';
    actions.style.gridTemplateColumns = '1fr 1fr';
    actions.style.gap = '12px';
    content.appendChild(title);
    content.appendChild(instructor);
    content.appendChild(meta);
    content.appendChild(category);
    content.appendChild(actions);
    card.appendChild(imgWrap);
    card.appendChild(content);
    grid.appendChild(card);
  });
}

function openModal(c) {
  const m = document.getElementById('courseModal');
  if (!m) return;
  m.querySelector('#mTitle').textContent = c.title;
  m.querySelector('#mInstructor').textContent = 'By ' + c.instructor;
  m.querySelector('#mMeta').textContent = c.level + ' • ' + c.duration + ' • ' + c.category;
  m.querySelector('#mDesc').textContent = c.description;
  m.style.display = 'block';
}

function closeModal() {
  const m = document.getElementById('courseModal');
  if (m) m.style.display = 'none';
}

function setupFilters(courses) {
  const container = document.getElementById('filterChips');
  if (!container) return;
  const cats = Array.from(new Set(courses.map(c => c.category)));
  container.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'btn-primary';
  all.textContent = 'All';
  all.addEventListener('click', function(){ renderCourses(courses); filterCourses(document.getElementById('searchInput').value); });
  container.appendChild(all);
  cats.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'btn-primary';
    b.textContent = cat;
    b.addEventListener('click', function(){ renderCourses(courses.filter(c => c.category === cat)); filterCourses(document.getElementById('searchInput').value); });
    container.appendChild(b);
  });
}

function setupCourseButtons() {
  const buttons = document.querySelectorAll('.courses-grid .btn-primary');
  buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      if (!getCurrentUser()) {
        e.preventDefault();
        window.location.href = 'login.html';
        return;
      }
      const card = this.closest('.course-card');
      const title = card.querySelector('.course-title')?.textContent || 'Course';
      const instructor = card.querySelector('.course-instructor')?.textContent || '';
      const category = card.querySelector('.course-category')?.textContent || '';
      const course = { title: title.trim(), instructor: instructor.trim(), category: category.trim() };
      if (typeof addEnrollment === 'function') addEnrollment(course);
      window.location.href = 'dashboard.html';
    });
  });
}

var API_BASE = (function(){
  var v = localStorage.getItem('vc_api_base') || '';
  if (v) return v.replace(/\/+$/,'');
  var origin = window.location.origin;
  var isDevStatic = origin.indexOf('127.0.0.1:5500') !== -1 || origin.indexOf('localhost:5500') !== -1;
  if (isDevStatic) return 'http://localhost:3000';
  return '';
})();

document.addEventListener('DOMContentLoaded', function() {
  setupNavAuth();
  setupSearch();
  (function(){
    var grid = document.getElementById('coursesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i=0;i<6;i++){
      var card = document.createElement('div');
      card.className = 'skeleton-card';
      var img = document.createElement('div'); img.className = 'skeleton-img skeleton-shimmer'; card.appendChild(img);
      var l1 = document.createElement('div'); l1.className = 'skeleton-line skeleton-shimmer'; card.appendChild(l1);
      var l2 = document.createElement('div'); l2.className = 'skeleton-line skeleton-shimmer'; card.appendChild(l2);
      var l3 = document.createElement('div'); l3.className = 'skeleton-line skeleton-shimmer'; card.appendChild(l3);
      grid.appendChild(card);
    }
  })();
  fetch(API_BASE + '/api/courses').then(function(r){ return r.json(); }).then(function(j){
    const courses = j.courses || [];
    renderCourses(courses);
    setupFilters(courses);
  });
  const modal = document.getElementById('courseModal');
  if (modal) {
    modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
    var closeBtn = document.getElementById('mClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
  }
});