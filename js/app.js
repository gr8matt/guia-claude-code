/* =========================================================
   Guía Claude Code — comportamiento
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var lang = function () { return root.lang === 'en' ? 'en' : 'es'; };

  var UI = {
    es: { copy: 'Copiar', copied: '¡Copiado!', copiedToast: 'Copiado. Pégalo en Claude Code con ⌘V', langToast: 'Español', menu: 'Contenido' },
    en: { copy: 'Copy', copied: 'Copied!', copiedToast: 'Copied. Paste it into Claude Code with ⌘V', langToast: 'English', menu: 'Contents' }
  };

  /* ---------- Language ---------- */
  function applyLang(l, opts) {
    root.lang = l;
    try { localStorage.setItem('lang', l); } catch (e) {}
    $$('[data-ph-es]').forEach(function (el) { el.placeholder = el.getAttribute('data-ph-' + l); });
    $$('.copy').forEach(function (b) { if (!b.classList.contains('done')) b.textContent = UI[l].copy; });
    document.title = l === 'es' ? 'Guía Claude Code · Dan Rivas' : 'Claude Code Guide · Dan Rivas';
    // El creador de prompts sigue el idioma de la página / builder follows page language
    var pl = $('input[name="promptlang"][value="' + l + '"]');
    if (pl) pl.checked = true;
    if (activeExample) loadExample(activeExample); else renderPrompt();
    if (!opts || !opts.silent) { startTerminal(); toast(UI[l].langToast); }
  }
  $('#lang-toggle').addEventListener('click', function () {
    applyLang(lang() === 'es' ? 'en' : 'es');
  });

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  /* ---------- Copy buttons ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy');
    if (!btn) return;
    var text;
    if (btn.dataset.target) {
      text = $('#' + btn.dataset.target).textContent;
    } else {
      // Copia solo el texto visible (del idioma actual) / copy only the visible-language text
      var codes = $$('code', btn.parentElement).filter(function (c) {
        return !c.classList.contains(lang() === 'es' ? 'en' : 'es');
      });
      text = codes.map(function (c) { return c.textContent; }).join('\n');
    }
    copyText(text.trim()).then(function () {
      btn.textContent = UI[lang()].copied; btn.classList.add('done');
      toast(UI[lang()].copiedToast);
      setTimeout(function () { btn.classList.remove('done'); btn.textContent = UI[lang()].copy; }, 1600);
    });
  });

  /* ---------- Menu ---------- */
  var menuBtn = $('#menu-btn'), toc = $('#toc');
  function setMenu(open) { toc.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); }
  menuBtn.addEventListener('click', function (e) { e.stopPropagation(); setMenu(!toc.classList.contains('open')); });
  toc.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', function (e) { if (!e.target.closest('#toc')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Progress + active section ---------- */
  var bar = $('#progress-bar');
  var sections = $$('main section[id]');
  var tocLinks = $$('#toc a');
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    var current = '';
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < 140) current = s.id; });
    tocLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + current); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.section-head, .card, .steps > li, .builder, .story, .demo-app, .rules li, .ladder > li, .ref-card, .timeline, .devices, .callout').forEach(function (el) {
      el.classList.add('reveal'); io.observe(el);
    });
  }

  /* ---------- Hero terminal animation ---------- */
  var SCRIPT = {
    es: [
      ['user', 'Hazme una página de bienvenida para los visitantes de la iglesia. Horarios: domingo 8:30, 10 y 11:30. En español e inglés, con un botón para cambiar de idioma. Que se vea bien en el teléfono.'],
      ['claude', '¡Con gusto! Antes de empezar, una pregunta: ¿quieres incluir un mapa con la dirección?'],
      ['user', 'Sí, 125 N. C St., Lompoc.'],
      ['claude', 'Perfecto. Este es mi plan: 1) página con horarios y mapa, 2) botón ES/EN, 3) diseño para teléfono y computadora.'],
      ['ok', '✓ Creé index.html'],
      ['ok', '✓ Creé estilos.css'],
      ['ok', '✓ Creé idiomas.js  (español / inglés)'],
      ['claude', 'Listo. La abrí en tu navegador. Prueba el botón ES/EN arriba a la derecha. ¿Qué quieres cambiar?']
    ],
    en: [
      ['user', 'Make me a welcome page for church visitors. Service times: Sunday 8:30, 10 and 11:30. In Spanish and English, with a button to switch languages. It should look good on phones.'],
      ['claude', 'Happy to! Before I start, one question: do you want a map with the address?'],
      ['user', 'Yes, 125 N. C St., Lompoc.'],
      ['claude', 'Great. Here\'s my plan: 1) page with service times and map, 2) ES/EN button, 3) layout for phone and computer.'],
      ['ok', '✓ Created index.html'],
      ['ok', '✓ Created styles.css'],
      ['ok', '✓ Created languages.js  (Spanish / English)'],
      ['claude', 'Done. I opened it in your browser. Try the ES/EN button in the top right. What would you like to change?']
    ]
  };
  var termEl = $('#hero-terminal');
  var termRun = 0;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function startTerminal() {
    var run = ++termRun;
    var lines = SCRIPT[lang()];
    termEl.innerHTML = '';
    if (reduce) {
      lines.forEach(function (l) { addLine(l[0], l[1]); });
      return;
    }
    (async function () {
      await wait(500);
      for (var i = 0; i < lines.length; i++) {
        if (run !== termRun) return;
        var kind = lines[i][0], text = lines[i][1];
        var p = addLine(kind, '');
        if (kind === 'user') {
          var cur = document.createElement('span'); cur.className = 'cursor';
          for (var c = 0; c < text.length; c++) {
            if (run !== termRun) return;
            p.textContent = text.slice(0, c + 1); p.appendChild(cur);
            await wait(18 + Math.random() * 22);
          }
          cur.remove();
          await wait(450);
        } else {
          if (kind === 'claude') { p.textContent = '…'; p.classList.add('t-dim'); await wait(900); p.classList.remove('t-dim'); }
          if (run !== termRun) return;
          p.textContent = text;
          await wait(kind === 'ok' ? 380 : 900);
        }
      }
    })();
  }
  function addLine(kind, text) {
    var p = document.createElement('p');
    p.className = 't-line ' + (kind === 'user' ? 't-user' : kind === 'ok' ? 't-ok' : 't-claude');
    p.textContent = text;
    termEl.appendChild(p);
    return p;
  }

  /* ---------- Demo app (its own language toggle) ---------- */
  var demo = $('#demo-app');
  function renderDemo() {
    var dl = demo.getAttribute('data-demo-lang');
    $$('[data-dt-es]', demo).forEach(function (el) { el.textContent = el.getAttribute('data-dt-' + dl); });
  }
  $('#demo-toggle').addEventListener('click', function () {
    var body = $('.demo-body', demo);
    body.classList.add('fade');
    setTimeout(function () {
      demo.setAttribute('data-demo-lang', demo.getAttribute('data-demo-lang') === 'es' ? 'en' : 'es');
      renderDemo();
      body.classList.remove('fade');
    }, 180);
  });
  renderDemo();

  /* ---------- Prompt builder ---------- */
  var activeExample = null;
  var F = {
    name: $('#f-name'), who: $('#f-who'), problem: $('#f-problem'), screens: $('#f-screens'),
    data: $('#f-data'), v1: $('#f-v1'), later: $('#f-later'),
    responsive: $('#f-responsive'), install: $('#f-install')
  };
  var EXAMPLES = {
    hispano: {
      es: {
        name: 'Servicio Hispano LFC',
        who: 'Familias hispanas de Lompoc Foursquare y personas que buscan un servicio en español',
        problem: 'La gente no sabe cuándo es el próximo Servicio Hispano y es difícil invitar a un amigo.',
        screens: 'Próximas fechas\nDetalles de cada servicio (hora, lugar, mapa)\nInvitar a un amigo (WhatsApp o mensaje)\nConoce a los pastores',
        data: 'Fechas, horas, lugar y una descripción corta de cada servicio. Yo las actualizo una vez al mes.',
        v1: 'Lista de próximas fechas\nBotón para compartir por WhatsApp\nBotón ES/EN',
        later: 'Recordatorios\nFotos de cada servicio\nPedidos de oración'
      },
      en: {
        name: 'LFC Servicio Hispano',
        who: 'Hispanic families at Lompoc Foursquare and people looking for a Spanish-language service',
        problem: 'People don\'t know when the next Servicio Hispano is, and it\'s hard to invite a friend.',
        screens: 'Upcoming dates\nDetails for each service (time, place, map)\nInvite a friend (WhatsApp or text)\nMeet the pastors',
        data: 'Dates, times, location and a short description of each service. I update them once a month.',
        v1: 'List of upcoming dates\nShare button for WhatsApp\nES/EN button',
        later: 'Reminders\nPhotos from each service\nPrayer requests'
      }
    },
    voluntarios: {
      es: {
        name: 'Voluntarios LFC',
        who: 'Voluntarios de la iglesia (ujieres, alabanza, ministerio de niños)',
        problem: 'Los voluntarios no saben cuándo les toca servir y me escriben para preguntar.',
        screens: 'Buscar mi nombre\nMis próximas fechas\nVista por ministerio',
        data: 'El horario está en una hoja de cálculo: @voluntarios.csv (nombre, ministerio, fecha, servicio).',
        v1: 'Buscar por nombre\nVer mis próximas fechas\nFiltrar por ministerio',
        later: 'Recordatorios por mensaje\nPedir un cambio de fecha'
      },
      en: {
        name: 'LFC Volunteers',
        who: 'Church volunteers (ushers, worship team, kids\' ministry)',
        problem: 'Volunteers don\'t know when they\'re serving, so they message me to ask.',
        screens: 'Search my name\nMy upcoming dates\nView by ministry',
        data: 'The schedule is in a spreadsheet: @voluntarios.csv (name, ministry, date, service).',
        v1: 'Search by name\nSee my upcoming dates\nFilter by ministry',
        later: 'Text reminders\nRequest a date swap'
      }
    },
    oracion: {
      es: {
        name: 'Muro de Oración',
        who: 'Miembros de la iglesia y el equipo pastoral',
        problem: 'Los pedidos de oración llegan por muchos lados y algunos se pierden.',
        screens: 'Enviar un pedido\nMuro de pedidos aprobados\nPanel del equipo pastoral para revisar',
        data: 'Pedidos de oración (nombre opcional, pedido, si es privado). Es información delicada.',
        v1: 'Formulario para enviar\nEl equipo aprueba antes de publicar\nOpción de pedido privado',
        later: 'Botón “Estoy orando por ti”\nAvisos cuando hay respuesta'
      },
      en: {
        name: 'Prayer Wall',
        who: 'Church members and the pastoral team',
        problem: 'Prayer requests come in from everywhere and some get lost.',
        screens: 'Submit a request\nWall of approved requests\nPastoral team review panel',
        data: 'Prayer requests (optional name, request, whether it\'s private). This is sensitive information.',
        v1: 'Form to submit\nTeam approves before anything is shown\nPrivate-request option',
        later: '“I\'m praying for you” button\nNotifications for answered prayers'
      }
    }
  };

  function lines(v) { return v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }
  function bullets(v) { return lines(v).map(function (s) { return '- ' + s; }).join('\n'); }

  function renderPrompt() {
    var out = $('#prompt-out');
    if (!out) return;
    var pl = ($('input[name="promptlang"]:checked') || {}).value || lang();
    var al = ($('input[name="applang"]:checked') || {}).value || 'both';
    var v = {};
    Object.keys(F).forEach(function (k) { v[k] = F[k].type === 'checkbox' ? F[k].checked : F[k].value.trim(); });

    var T = pl === 'es' ? {
      intro: function (n) { return n ? 'Quiero construir una app web llamada "' + n + '".' : 'Quiero construir una app web.'; },
      who: 'Para quién es: ', problem: 'Qué problema resuelve: ', screens: 'Pantallas principales:', data: 'Información que muestra o guarda: ',
      v1: 'Versión 1 (solo esto por ahora):', later: 'Para más adelante (no lo construyas todavía):',
      lang: {
        es: 'Idioma: toda la app en español.',
        en: 'Idioma: toda la app en inglés.',
        both: 'Idioma: español e inglés, con un botón ES/EN visible arriba. Español por defecto, y que recuerde el idioma que eligió cada persona. Organiza los textos para que sea fácil corregir o agregar traducciones.'
      },
      responsive: 'Dispositivos: debe verse y funcionar bien en teléfono y computadora (diseño responsivo).',
      install: 'Que se pueda agregar a la pantalla de inicio del iPhone como una app.',
      style: 'Estilo: basa los colores y la letra en lompocfoursquare.com.',
      closing: 'Soy principiante: explícame tus decisiones en palabras sencillas y en español.\nAntes de escribir código, hazme las preguntas que necesites y muéstrame un plan para aprobarlo.',
      empty: '(Llena las casillas de la izquierda, o toca un ejemplo, y aquí aparecerá tu prompt.)'
    } : {
      intro: function (n) { return n ? 'I want to build a web app called "' + n + '".' : 'I want to build a web app.'; },
      who: 'Who it\'s for: ', problem: 'The problem it solves: ', screens: 'Main screens:', data: 'Information it shows or stores: ',
      v1: 'Version 1 (only this for now):', later: 'For later (don\'t build these yet):',
      lang: {
        es: 'Language: the whole app in Spanish.',
        en: 'Language: the whole app in English.',
        both: 'Language: Spanish and English, with a visible ES/EN button at the top. Spanish by default, and remember the language each person chose. Organize the text so translations are easy to fix or add.'
      },
      responsive: 'Devices: it must look and work great on both phone and computer (responsive design).',
      install: 'It should be installable to the iPhone home screen like an app.',
      style: 'Style: base the colors and font on lompocfoursquare.com.',
      closing: 'I\'m a beginner: explain your decisions in simple words.\nBefore writing any code, ask me any questions you need and show me a plan to approve.',
      empty: '(Fill in the boxes on the left, or tap an example, and your prompt will appear here.)'
    };

    var hasAny = v.name || v.who || v.problem || v.screens || v.data || v.v1 || v.later;
    if (!hasAny) { out.innerHTML = ''; var s = document.createElement('span'); s.className = 'ph'; s.textContent = T.empty; out.appendChild(s); return; }

    var parts = [T.intro(v.name)];
    var block = [];
    if (v.who) block.push(T.who + v.who);
    if (v.problem) block.push(T.problem + v.problem);
    if (block.length) parts.push(block.join('\n'));
    if (lines(v.screens).length) parts.push(T.screens + '\n' + bullets(v.screens));
    if (v.data) parts.push(T.data + v.data);
    if (lines(v.v1).length) parts.push(T.v1 + '\n' + bullets(v.v1));
    if (lines(v.later).length) parts.push(T.later + '\n' + bullets(v.later));
    var tech = [T.lang[al]];
    if (v.responsive) tech.push(T.responsive);
    if (v.install) tech.push(T.install);
    tech.push(T.style);
    parts.push(tech.join('\n'));
    parts.push(T.closing);
    out.textContent = parts.join('\n\n');
  }

  function loadExample(key) {
    activeExample = key === 'clear' ? null : key;
    $$('.chip[data-example]').forEach(function (c) { c.classList.toggle('active', c.dataset.example === key); });
    if (key === 'clear') {
      Object.keys(F).forEach(function (k) { if (F[k].type !== 'checkbox') F[k].value = ''; });
      $$('.chip').forEach(function (c) { c.classList.remove('active'); });
    } else {
      var ex = EXAMPLES[key][lang()];
      Object.keys(ex).forEach(function (k) { F[k].value = ex[k]; });
    }
    renderPrompt();
  }
  $$('.chip[data-example]').forEach(function (c) {
    c.addEventListener('click', function () { loadExample(c.dataset.example); });
  });
  $('#builder-form').addEventListener('input', function (e) {
    // Si escribe a mano, ya no es el ejemplo / typing by hand means it's no longer the example
    if (e.target.matches('input:not([type]), textarea')) {
      activeExample = null;
      $$('.chip').forEach(function (c) { c.classList.remove('active'); });
    }
    renderPrompt();
  });
  $('#builder-form').addEventListener('change', renderPrompt);

  /* ---------- Init ---------- */
  applyLang(lang(), { silent: true });
  startTerminal();

  // Llama la atención al botón de idioma una vez / draw attention to the language button once
  setTimeout(function () { $('#lang-toggle').classList.add('pulse'); }, 2500);

  /* ---------- Service worker (instalable / installable) ---------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
