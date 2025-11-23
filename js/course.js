document.addEventListener('DOMContentLoaded', function() {
  if (typeof setupNavAuth === 'function') setupNavAuth();
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  if (!id) {
    document.getElementById('cdTitle').textContent = 'Course not found';
    return;
  }
  var API_BASE = (function(){
    var v = localStorage.getItem('vc_api_base') || '';
    if (v) return v.replace(/\/+$/,'');
    var origin = window.location.origin;
    var isDevStatic = origin.indexOf('127.0.0.1:5500') !== -1 || origin.indexOf('localhost:5500') !== -1;
    if (isDevStatic) return 'http://localhost:3000';
    return '';
  })();

  fetch(API_BASE + '/api/courses/' + id)
    .then(r => r.json())
    .then(j => {
      const c = j.course;
      document.getElementById('cdTitle').textContent = c.title;
      document.getElementById('cdMeta').textContent = (c.level || '') + ' • ' + (c.duration || '') + ' • ' + (c.category || '') + ' • ' + (c.instructor ? ('By ' + c.instructor) : '');
      document.getElementById('cdDesc').textContent = c.description || '';
    });

  fetch(API_BASE + '/api/courses/' + id + '/lessons')
    .then(r => r.json())
    .then(j => {
      const lessons = j.lessons || [];
      const list = document.getElementById('lessonList');
      list.innerHTML = '';
      lessons.forEach(ls => {
        const row = document.createElement('div');
        row.className = 'lesson-item';
        row.id = 'lesson-' + (ls.order_index || 0);
        const title = document.createElement('div');
        title.className = 'lesson-title';
        title.textContent = (ls.order_index || 0) + '. ' + ls.title;
        const actions = document.createElement('div');
        actions.className = 'lesson-actions';
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = 'Mark Complete';
        btn.dataset.lessonId = ls.id;
        btn.addEventListener('click', function(){ updateProgress(parseInt(this.dataset.lessonId, 10), true); });
        actions.appendChild(btn);
        row.appendChild(title);
        row.appendChild(actions);
        list.appendChild(row);
      });
      refreshProgress(id);
      refreshLessonStates(id);
      scrollToHash();
    });
  (function(){
    var list = document.getElementById('lessonList');
    if (!list) return;
    list.innerHTML = '';
    for (var i=0;i<3;i++){
      var s = document.createElement('div'); s.className = 'skeleton-line skeleton-shimmer'; s.style.height = '48px'; list.appendChild(s);
    }
  })();

  function refreshProgress(courseId) {
    const token = getToken();
    if (!token) { document.getElementById('cdProgress').style.width = '0%'; document.getElementById('cdProgressText').textContent = 'Login to track progress'; return; }
    fetch(API_BASE + '/api/courses/' + courseId + '/progress', { headers: { 'Authorization': 'Bearer ' + token }})
      .then(r => r.json())
      .then(j => {
        const pct = j.percent || 0;
        document.getElementById('cdProgress').style.width = pct + '%';
        document.getElementById('cdProgressText').textContent = (j.completed || 0) + ' of ' + (j.total || 0) + ' complete';
      });
  }

  function refreshLessonStates(courseId) {
    const token = getToken();
    if (!token) return;
    fetch(API_BASE + '/api/courses/' + courseId + '/lesson-progress', { headers: { 'Authorization': 'Bearer ' + token }})
      .then(r => r.json())
      .then(j => {
        (j.items || []).forEach(item => {
          const btn = document.querySelector('button[data-lesson-id="' + item.id + '"]');
          if (btn) {
            if (item.completed === 1) {
              btn.textContent = 'Completed';
              btn.disabled = true;
            } else {
              btn.textContent = 'Mark Complete';
              btn.disabled = false;
            }
          }
        });
      });
  }

  function updateProgress(lessonId, completed) {
    const token = getToken();
    if (!token) { window.location.href = 'login.html'; return; }
    fetch(API_BASE + '/api/lessons/' + lessonId + '/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ completed: completed })
    }).then(r => r.json()).then(_ => {
      refreshProgress(id);
      refreshLessonStates(id);
    });
  }

  fetch(API_BASE + '/api/courses/' + id + '/quizzes')
    .then(r => r.json())
    .then(j => {
      const quizzes = j.quizzes || [];
      if (!quizzes.length) return;
      const q = quizzes[0];
      fetch(API_BASE + '/api/quizzes/' + q.id)
        .then(r => r.json())
        .then(d => {
          const wrap = document.getElementById('quizContainer');
          const quiz = d.quiz;
          const form = document.createElement('div');
          form.setAttribute('data-quiz-id', quiz.id);
          quiz.questions.forEach(function(qi){
            const block = document.createElement('div');
            const p = document.createElement('p');
            p.textContent = qi.prompt;
            block.appendChild(p);
            qi.options.forEach(function(opt, idx){
              const label = document.createElement('label');
              const input = document.createElement('input');
              input.type = 'radio';
              input.name = 'q-' + qi.id;
              input.value = String(idx);
              label.appendChild(input);
              label.appendChild(document.createTextNode(' ' + opt));
              block.appendChild(label);
            });
            form.appendChild(block);
          });
          const submit = document.createElement('button');
          submit.className = 'btn-primary';
          submit.textContent = 'Submit Quiz';
          submit.addEventListener('click', function(){ submitQuiz(quiz.id, form); });
          form.appendChild(submit);
          wrap.appendChild(form);
        });
    });

  function submitQuiz(quizId, container) {
    const token = getToken();
    if (!token) { window.location.href = 'login.html'; return; }
    const answers = {};
    const inputs = container.querySelectorAll('input[type="radio"]');
    inputs.forEach(function(inp){ if (inp.checked) { const qid = parseInt(inp.name.replace('q-',''), 10); answers[qid] = parseInt(inp.value, 10); } });
    fetch(API_BASE + '/api/quizzes/' + quizId + '/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ answers: answers })
    }).then(function(r){ return r.json(); }).then(function(res){
      const wrap = document.getElementById('quizContainer');
      const result = document.createElement('div');
      result.textContent = 'Score: ' + (res.score || 0) + ' / ' + (res.total || 0);
      wrap.appendChild(result);
    });
  }

  fetch(API_BASE + '/api/courses/' + id + '/assignments')
    .then(r => r.json())
    .then(j => {
      const items = j.assignments || [];
      if (!items.length) return;
      const a = items[0];
      const wrap = document.getElementById('assignmentContainer');
      const title = document.createElement('h3');
      title.className = 'course-title';
      title.textContent = a.title;
      const desc = document.createElement('p');
      desc.className = 'course-desc';
      desc.textContent = a.description;
      const area = document.createElement('textarea');
      area.className = 'search-input';
      area.rows = 4;
      area.placeholder = 'Paste your answer here';
      const submit = document.createElement('button');
      submit.className = 'btn-primary';
      submit.textContent = 'Submit Assignment';
      submit.addEventListener('click', function(){ submitAssignment(a.id, area.value); });
      wrap.appendChild(title);
      wrap.appendChild(desc);
      wrap.appendChild(area);
      wrap.appendChild(submit);
      refreshSubmission(a.id);
    });

  function submitAssignment(assignmentId, content) {
    const token = getToken();
    if (!token) { window.location.href = 'login.html'; return; }
    fetch(API_BASE + '/api/assignments/' + assignmentId + '/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ content: content })
    }).then(function(r){ return r.json(); }).then(function(_){ refreshSubmission(assignmentId); });
  }

  function refreshSubmission(assignmentId) {
    const token = getToken();
    if (!token) return;
    fetch(API_BASE + '/api/assignments/' + assignmentId + '/submission', { headers: { 'Authorization': 'Bearer ' + token }})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if (j.submission) {
          const wrap = document.getElementById('assignmentContainer');
          const status = document.createElement('div');
          status.textContent = 'Submitted';
          wrap.appendChild(status);
          if (j.submission.feedback) {
            const fb = document.createElement('div');
            fb.textContent = 'Feedback: ' + j.submission.feedback;
            wrap.appendChild(fb);
          }
        }
      });
  }

  function scrollToHash() {
    const h = new URLSearchParams(window.location.hash.replace('#','')).get('lesson');
    const idx = parseInt(h || '0', 10);
    if (idx) {
      const el = document.getElementById('lesson-' + idx);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});