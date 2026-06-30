/**
 * Единый прогресс курса (localStorage).
 * Не содержит данных пользователя — только флаги завершения модулей.
 */
var CourseProgress = (function() {
  var KEY = 'course_progress';

  function readRaw() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
  }

  /** Синхронизация со старыми ключами nc_mod*_status */
  function syncFromLegacy() {
    var p = readRaw();
    var changed = false;

    if (localStorage.getItem('nc_mod1_status') === 'complete' && !p.module1Completed) {
      p.module1Completed = true;
      changed = true;
    }
    if (localStorage.getItem('nc_mod2_status') === 'complete' && !p.module2Completed) {
      p.module2Completed = true;
      changed = true;
    }
    if (localStorage.getItem('nc_mod3_status') === 'complete' && !p.module3Completed) {
      p.module3Completed = true;
      changed = true;
    }
    if (p.module2Completed && !p.module3Unlocked) {
      p.module3Unlocked = true;
      changed = true;
    }
    if (changed) write(p);
    return p;
  }

  function get() {
    return syncFromLegacy();
  }

  function isModule1Complete() {
    return get().module1Completed === true;
  }

  function isModule2Complete() {
    return get().module2Completed === true;
  }

  function isModule3Complete() {
    return get().module3Completed === true;
  }

  function isModule2Unlocked() {
    return isModule1Complete();
  }

  function isModule3Unlocked() {
    var p = get();
    return p.module3Unlocked === true || p.module3Completed === true || isModule2Complete();
  }

  function markModule1Complete() {
    var p = get();
    p.module1Completed = true;
    write(p);
    try { localStorage.setItem('nc_mod1_status', 'complete'); } catch (e) {}
  }

  function markModule2Complete() {
    var p = get();
    p.module2Completed = true;
    p.module3Unlocked = true;
    write(p);
    try { localStorage.setItem('nc_mod2_status', 'complete'); } catch (e) {}
  }

  function markModule3Complete() {
    var p = get();
    p.module3Completed = true;
    write(p);
    try { localStorage.setItem('nc_mod3_status', 'complete'); } catch (e) {}
  }

  function gateModule(n) {
    if (n === 1) return { ok: true };
    if (n === 2 && !isModule2Unlocked()) {
      return { ok: false, message: 'Сначала пройди модуль 1!' };
    }
    if (n === 3 && !isModule3Unlocked()) {
      return { ok: false, message: 'Сначала пройди модуль 2!' };
    }
    return { ok: true };
  }

  /** Переход внутри пакета — SCORM не завершает сессию (см. scorm-api.js). */
  function navigate(url) {
    window.__courseInternalNav = true;
    window.location.href = url;
  }

  function bindInternalLinks() {
    var targets = ['map.html', 'index.html', 'module1.html', 'module2.html', 'module3.html'];
    document.querySelectorAll('a[href]').forEach(function(a) {
      var href = a.getAttribute('href');
      if (!href || targets.indexOf(href) === -1) return;
      if (a.dataset.courseNavBound === '1') return;
      a.dataset.courseNavBound = '1';
      a.addEventListener('click', function(e) {
        var n = href === 'module1.html' ? 1 : href === 'module2.html' ? 2 : href === 'module3.html' ? 3 : 0;
        if (n) {
          var gate = gateModule(n);
          if (!gate.ok) {
            e.preventDefault();
            alert(gate.message);
            return;
          }
        }
        e.preventDefault();
        navigate(href);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindInternalLinks);
  } else {
    bindInternalLinks();
  }

  return {
    get: get,
    isModule1Complete: isModule1Complete,
    isModule2Complete: isModule2Complete,
    isModule3Complete: isModule3Complete,
    isModule2Unlocked: isModule2Unlocked,
    isModule3Unlocked: isModule3Unlocked,
    markModule1Complete: markModule1Complete,
    markModule2Complete: markModule2Complete,
    markModule3Complete: markModule3Complete,
    gateModule: gateModule,
    navigate: navigate,
  };
})();
