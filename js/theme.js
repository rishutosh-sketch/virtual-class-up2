(function(){
  var key = 'vc_theme';
  function applyTheme(t){
    document.body.classList.remove('theme-light');
    document.body.classList.remove('theme-dark');
    if (t === 'light') document.body.classList.add('theme-light');
    else if (t === 'dark') document.body.classList.add('theme-dark');
  }
  var saved = localStorage.getItem(key) || 'light';
  applyTheme(saved);
  var btn = document.getElementById('themeToggle');
  if (btn){
    btn.textContent = saved === 'light' ? '🌞 Light' : '🌙 Dark';
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var current = localStorage.getItem(key) || 'light';
      var next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem(key, next);
      applyTheme(next);
      btn.textContent = next === 'light' ? '🌞 Light' : '🌙 Dark';
    });
  }
})();