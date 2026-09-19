/* ==========================================================================
   从零开始电控开发 Lecture 1 —— 交互组件
   两种用法：
     1. index.html —— 加载 slides/*.html 全部片段，组装成完整课件
     2. one.html   —— 只加载其中一页，便于逐页预览与调整
   依赖：reveal.js 4.x（UMD）
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---------------------------------------------------------------- 选项卡 */
  function initTabs(root) {
    $$('[data-tabs]', root).forEach(function (box) {
      var buttons = $$('.tab-btn, .loop-node', box);
      var panels = $$('.tab-panel, .loop-panel', box);
      if (!buttons.length || !panels.length) { return; }

      var activate = function (key) {
        buttons.forEach(function (btn) {
          var on = btn.dataset.tab === key;
          btn.classList.toggle('is-active', on);
          btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach(function (p) {
          p.classList.toggle('is-active', p.dataset.panel === key);
        });
      };

      buttons.forEach(function (btn) {
        btn.setAttribute('role', 'tab');
        btn.addEventListener('click', function () { activate(btn.dataset.tab); });
      });
      activate(buttons[0].dataset.tab);
    });
  }

  /* ---------------------------------------------------------------- 折叠面板 */
  function initAccordion(root) {
    $$('[data-accordion]', root).forEach(function (box) {
      $$('.acc-item', box).forEach(function (item) {
        var head = $('.acc-head', item);
        if (!head) { return; }
        head.addEventListener('click', function () { item.classList.toggle('is-open'); });
      });
    });
  }

  /* -------------------------------------------------------------- 步骤播放器 */
  function initSteppers(root) {
    $$('[data-stepper]', root).forEach(function (box) {
      var items = $$('.step-item', box);
      var panels = $$('.step-panel', box);
      var total = Math.max(items.length, panels.length);
      if (!total) { return; }

      var graphNodes = $$('.graph-node', box);
      var views = $$('[data-step-view]', box);
      var counter = $('.step-current', box);
      var index = 0;

      var render = function () {
        items.forEach(function (it, i) { it.classList.toggle('is-active', i === index); });
        panels.forEach(function (p, i) { p.classList.toggle('is-active', i === index); });
        graphNodes.forEach(function (n) {
          n.classList.toggle('is-active', Number(n.dataset.nodeIndex) === index);
        });
        views.forEach(function (v) {
          v.classList.toggle('is-active', Number(v.dataset.stepView) === index);
        });
        if (counter) { counter.textContent = ('0' + (index + 1)).slice(-2); }
      };

      items.forEach(function (it, i) {
        it.addEventListener('click', function () { index = i; render(); });
      });

      var prev = $('[data-step="prev"]', box);
      var next = $('[data-step="next"]', box);
      if (prev) {
        prev.addEventListener('click', function () {
          index = (index - 1 + total) % total;
          render();
        });
      }
      if (next) {
        next.addEventListener('click', function () {
          index = (index + 1) % total;
          render();
        });
      }
      render();
    });
  }

  /* ---------------------------------------------------------- 工程目录浏览器 */
  function initExplorer(root) {
    $$('[data-explorer]', root).forEach(function (box) {
      var items = $$('.ex-item', box);
      var panels = $$('.ex-panel', box);
      if (!items.length || !panels.length) { return; }

      var show = function (key) {
        items.forEach(function (i) { i.classList.toggle('is-active', i.dataset.key === key); });
        panels.forEach(function (p) { p.classList.toggle('is-active', p.dataset.panel === key); });
      };

      items.forEach(function (item) {
        item.addEventListener('click', function () { show(item.dataset.key); });
      });
      show(items[0].dataset.key);
    });
  }

  /* ---------------------------------------------------------------- 勾选清单 */
  function initChecklist(root) {
    $$('.checklist', root).forEach(function (list) {
      var inputs = $$('input[type="checkbox"]', list);
      if (!inputs.length) { return; }
      /* 进度条/计数与清单项可能不在同一容器内，统一在所属 section 里查找 */
      var scope = list.closest('section') || list;
      var bar = $('.cl-bar-fill', scope);
      var count = $('.cl-count', scope);

      var update = function () {
        var done = inputs.filter(function (i) { return i.checked; }).length;
        if (bar) { bar.style.width = (done / inputs.length * 100).toFixed(1) + '%'; }
        if (count) { count.textContent = done + ' / ' + inputs.length; }
      };

      inputs.forEach(function (i) { i.addEventListener('change', update); });
      update();
    });
  }

  /* ------------------------------------------------------------ 目录跳转链接 */
  function initGoto(root) {
    $$('[data-goto]', root).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var i = Number(el.dataset.goto);
        if (window.Reveal && !isNaN(i)) { window.Reveal.slide(i); }
      });
    });
  }

  /* ------------------------------------------------------ 片段加载与初始化 */
  /* 页面清单用 fetch(no-cache) 读：静态站会给 .js 加长缓存，
     <script src> 会一直读到旧页序（删页后就会 404 打不开整份课件）。 */
  function loadManifest(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) { throw new Error(path + ' → HTTP ' + r.status); }
      return r.text();
    }).then(function (txt) {
      window.DECK_SLIDES = new Function(txt + '\nreturn window.DECK_SLIDES;')();
      return window.DECK_SLIDES;
    });
  }

  function loadFragments(files, container, base) {
    var dir = base || 'slides/';
    return Promise.all(files.map(function (f) {
      return fetch(dir + f, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) { throw new Error(f + ' → HTTP ' + r.status); }
        return r.text();
      }).catch(function (err) {
        /* 单页缺失（例如浏览器缓存了旧页序）不能让整份课件打不开 */
        return '<section><h2>这一页暂时载入失败</h2>' +
          '<p class="mono">' + err.message + '</p>' +
          '<p>刷新页面（Ctrl+F5）通常就好了。</p></section>';
      });
    })).then(function (parts) {
      container.innerHTML = parts.join('\n');
      return parts.length;
    });
  }

  function initAll(root) {
    initTabs(root);
    initAccordion(root);
    initSteppers(root);
    initExplorer(root);
    initChecklist(root);
    initGoto(root);
  }

  var BASE_CONFIG = {
    hash: true,
    history: false,
    controls: true,
    controlsTutorial: false,
    progress: true,
    slideNumber: 'c/t',
    keyboard: true,
    overview: true,
    touch: true,
    center: true,
    loop: false,
    width: 1280,
    height: 800,
    margin: 0.025,
    minScale: 0.2,
    maxScale: 1.6,
    transition: 'fade',
    transitionSpeed: 'fast',
    backgroundTransition: 'none'
  };

  function initReveal(extra) {
    if (!window.Reveal) { return; }
    var cfg = Object.assign({}, BASE_CONFIG, extra || {});
    if (window.self !== window.top) { document.body.classList.add('is-embed'); }
    window.Reveal.initialize(cfg);
    /* PPT 对齐页自带母版背景（含 logo/角标），进入这些页时隐藏全局品牌装饰 */
    var syncPptPage = function () {
      var cur = window.Reveal.getCurrentSlide ? window.Reveal.getCurrentSlide() : null;
      var on = !!(cur && cur.classList && cur.classList.contains('ppt-page'));
      document.body.classList.toggle('on-ppt-page', on);
    };
    window.Reveal.on('ready', syncPptPage);
    window.Reveal.on('slidechanged', syncPptPage);
  }

  window.DeckKit = {
    loadManifest: loadManifest,
    loadFragments: loadFragments,
    initAll: initAll,
    initReveal: initReveal,
    $: $,
    $$: $$
  };
})();
