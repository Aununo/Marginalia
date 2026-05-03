(function(){
  const root = document.documentElement;
  const themeKey = 'theme';
  const moonIcon = '<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"></path></svg>';
  const sunIcon = '<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.2v2.1"></path><path d="M12 19.7v2.1"></path><path d="M21.8 12h-2.1"></path><path d="M4.3 12H2.2"></path><path d="M18.9 5.1l-1.5 1.5"></path><path d="M6.6 17.4l-1.5 1.5"></path><path d="M18.9 18.9l-1.5-1.5"></path><path d="M6.6 6.6L5.1 5.1"></path></svg>';
  let searchLoaded = false;
  let searchIndex = [];

  function renderThemeButtons(theme){
    const markup = theme === 'dark' ? sunIcon : moonIcon;
    document.querySelectorAll('.theme-btn').forEach(function(button){
      button.innerHTML = markup;
    });
  }

  function applyTheme(theme){
    if(theme === 'dark') root.setAttribute('data-theme','dark');
    else root.removeAttribute('data-theme');
    renderThemeButtons(theme === 'dark' ? 'dark' : 'light');
  }

  function initFontReady(){
    if(!root.classList.contains('fonts-loading')) return;
    var done = false;

    function reveal(){
      if(done) return;
      done = true;
      root.classList.remove('fonts-loading');
      root.classList.add('fonts-ready');
    }

    window.setTimeout(reveal, 900);
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(reveal).catch(reveal);
    } else {
      reveal();
    }
  }

  /* ── Cursor Spotlight ── */
  function initCursorSpotlight(){
    var spotlight = document.querySelector('.home-spotlight');
    if(!spotlight) return;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if(prefersReducedMotion.matches) return;

    document.addEventListener('mousemove', function(e){
      root.style.setProperty('--spotlight-x', e.clientX + 'px');
      root.style.setProperty('--spotlight-y', e.clientY + 'px');
    });
  }

  /* ── Typewriter (cycle through sentences) ── */
  function initTypewriter(){
    var target = document.getElementById('typewriter-target');
    if(!target) return;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var cursor = target.querySelector('.home-hero__cursor');

    var sentences = [
      'I never want to work a 9-to-5 again.',
      'I want more money than I could ever spend.',
      'I want to sleep when I\'m tired and eat when I\'m hungry.',
      'Maybe I could also do meaningful work that leaves something behind.'
    ];

    if(prefersReducedMotion.matches){
      target.textContent = sentences[0];
      if(cursor) target.appendChild(cursor);
      return;
    }

    var sentenceIndex = 0;
    var charIndex = 0;

    function clearText(){
      var nodes = [];
      for(var n = target.firstChild; n; n = n.nextSibling){
        if(n !== cursor) nodes.push(n);
      }
      for(var j = 0; j < nodes.length; j++){
        target.removeChild(nodes[j]);
      }
    }

    function erase(callback){
      var nodes = [];
      for(var n = target.firstChild; n; n = n.nextSibling){
        if(n !== cursor) nodes.push(n);
      }
      if(!nodes.length){ callback(); return; }

      var last = nodes[nodes.length - 1];
      if(last.nodeType === 3 && last.textContent.length > 1){
        last.textContent = last.textContent.slice(0, -1);
      } else {
        target.removeChild(last);
      }
      setTimeout(function(){ erase(callback); }, 25);
    }

    function typeSentence(text, callback){
      if(charIndex < text.length){
        var charNode = document.createTextNode(text.charAt(charIndex));
        target.insertBefore(charNode, cursor);
        charIndex++;
        var nextDelay = 35 + Math.random() * 45;
        if(text.charAt(charIndex - 1) === ',' || text.charAt(charIndex - 1) === '.') nextDelay += 120;
        setTimeout(function(){ typeSentence(text, callback); }, nextDelay);
      } else {
        callback();
      }
    }

    function cycle(){
      var text = sentences[sentenceIndex];
      charIndex = 0;
      typeSentence(text, function(){
        setTimeout(function(){
          erase(function(){
            sentenceIndex = (sentenceIndex + 1) % sentences.length;
            setTimeout(cycle, 400);
          });
        }, 2000);
      });
    }

    setTimeout(cycle, 900);
  }

  /* ── Scroll Reveal (IntersectionObserver) ── */
  function initScrollReveal(){
    var elements = document.querySelectorAll('.reveal');
    if(!elements.length) return;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if(prefersReducedMotion.matches){
      elements.forEach(function(el){ el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function(el){ observer.observe(el); });
  }

  /* ── Sky effects: stars (dark) & petals (light) ── */
  function initSkyEffects(){
    var container = document.querySelector('.sky-effects');
    if(!container) return;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if(prefersReducedMotion.matches) return;

    function createStars(){
      var existing = container.querySelectorAll('.sky-star');
      if(existing.length) return;
      var count = 20;
      var frag = document.createDocumentFragment();
      for(var i = 0; i < count; i++){
        var star = document.createElement('div');
        star.className = 'sky-star' + (Math.random() < 0.15 ? ' sky-star--large' : '');
        star.style.left = (Math.random() * 100) + '%';
        star.style.top = (Math.random() * 100) + '%';
        star.style.animationDuration = (2 + Math.random() * 4) + 's';
        star.style.animationDelay = (Math.random() * 5) + 's';
        frag.appendChild(star);
      }
      container.appendChild(frag);
    }

    function createPetals(){
      var existing = container.querySelectorAll('.petal');
      if(existing.length) return;
      var count = 6;
      var frag = document.createDocumentFragment();
      for(var i = 0; i < count; i++){
        var petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.left = (10 + Math.random() * 80) + '%';
        /* size variation */
        var s = 4 + Math.random() * 4;
        petal.style.width = s + 'px';
        petal.style.height = s + 'px';
        /* drift: gentle left or right */
        var drift = (-60 + Math.random() * 120) + 'px';
        petal.style.setProperty('--petal-drift', drift);
        /* spin */
        var spin = (180 + Math.random() * 360) + 'deg';
        petal.style.setProperty('--petal-spin', spin);
        /* timing */
        var dur = 10 + Math.random() * 8;
        petal.style.animationDuration = dur + 's';
        petal.style.animationDelay = (Math.random() * dur) + 's';
        frag.appendChild(petal);
      }
      container.appendChild(frag);
    }

    function clearStars(){
      container.querySelectorAll('.sky-star').forEach(function(s){ s.remove(); });
    }
    function clearPetals(){
      container.querySelectorAll('.petal').forEach(function(p){ p.remove(); });
    }

    function onThemeChange(){
      if(root.getAttribute('data-theme') === 'dark'){
        clearPetals();
        createStars();
      } else {
        clearStars();
        createPetals();
      }
    }

    if(root.getAttribute('data-theme') === 'dark') createStars();
    else createPetals();

    var observer = new MutationObserver(onThemeChange);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ── Bubbles (glowing particles) ── */
  function initBubbles(){
    var canvas = document.querySelector('.bubble-canvas');
    if(!canvas) return;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var W, H;
    var particles = [];
    var COUNT = 12;
    var animId = null;

    function isDark(){
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function resize(){
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* Exclusion zone — keep particles away from the Ferris wheel center */
    function clampOutsideCenter(x, y, margin){
      var cx = W / 2, cy = H * 0.45;
      var zx = 200, zy = 260;
      var left = cx - zx - margin, right = cx + zx + margin;
      var top = cy - zy - margin, bottom = cy + zy + margin;
      if(x > left && x < right && y > top && y < bottom){
        var dLeft = x - left, dRight = right - x;
        var dTop = y - top, dBottom = bottom - y;
        var minD = Math.min(dLeft, dRight, dTop, dBottom);
        if(minD === dLeft) x = left;
        else if(minD === dRight) x = right;
        else if(minD === dTop) y = top;
        else y = bottom;
      }
      return { x: x, y: y };
    }

    function spawnX(){
      /* 60% chance: edges; 40% chance: anywhere (will be clamped) */
      return Math.random() < 0.6
        ? (Math.random() < 0.5 ? Math.random() * W * 0.2 : W * 0.8 + Math.random() * W * 0.2)
        : Math.random() * W;
    }

    function createParticle(){
      var dark = isDark();
      var sx = spawnX();
      var sy = Math.random() * H;
      var pos = clampOutsideCenter(sx, sy, 20);
      return {
        x: pos.x,
        y: pos.y,
        r: 3 + Math.random() * 4,
        baseR: 3 + Math.random() * 4,
        vy: -(0.08 + Math.random() * 0.12),
        vx: 0,
        wobbleAmp: 0.2 + Math.random() * 0.3,
        wobbleSpeed: 0.003 + Math.random() * 0.005,
        wobblePhase: Math.random() * Math.PI * 2,
        opacity: dark ? (0.35 + Math.random() * 0.25) : (0.2 + Math.random() * 0.15),
        glow: dark ? (12 + Math.random() * 8) : (6 + Math.random() * 5),
        color: dark
          ? 'rgba(200,220,255,'    // blue-white glow
          : 'rgba(180,140,100,'    // warm amber
      };
    }

    function init(){
      particles = [];
      for(var i = 0; i < COUNT; i++){
        particles.push(createParticle());
      }
    }

    function draw(time){
      ctx.clearRect(0, 0, W, H);
      for(var i = 0; i < particles.length; i++){
        var p = particles[i];
        p.y += p.vy;
        p.vx = Math.sin(time * p.wobbleSpeed + p.wobblePhase) * p.wobbleAmp;
        p.x += p.vx;
        p.r = p.baseR + Math.sin(time * 0.002 + i) * 0.5;

        /* push out of exclusion zone */
        var clamped = clampOutsideCenter(p.x, p.y, 10);
        p.x = clamped.x;
        p.y = clamped.y;

        if(p.y < -20){
          p.y = H + 10;
          p.x = spawnX();
          var resp = clampOutsideCenter(p.x, p.y, 20);
          p.x = resp.x;
          p.y = resp.y;
        }
        if(p.x < -20) p.x = W + 10;
        if(p.x > W + 20) p.x = -10;

        ctx.save();
        ctx.globalAlpha = 1;
        ctx.shadowColor = p.color + Math.min(1, p.opacity + 0.2).toFixed(2) + ')';
        ctx.shadowBlur = p.glow;
        ctx.fillStyle = p.color + p.opacity.toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function loop(time){
      draw(time);
      animId = requestAnimationFrame(loop);
    }

    resize();
    init();

    if(reducedMotion){
      draw(0);
    } else {
      animId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', function(){
      resize();
    });

    var root = document.documentElement;
    var themeObs = new MutationObserver(function(){
      init();
    });
    themeObs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ── Constellation (interests) ── */
  function initConstellation(){
    var canvas = document.querySelector('.constellation-canvas');
    if(!canvas) return;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var mouseX = -1000, mouseY = -1000;
    var hovered = null;

    var topics = [
      { label: 'Writing', x: 0.18, y: 0.3 },
      { label: 'Code', x: 0.75, y: 0.25 },
      { label: 'Reading', x: 0.4, y: 0.6 },
      { label: 'Music', x: 0.82, y: 0.65 },
      { label: 'Photography', x: 0.25, y: 0.75 },
      { label: 'Design', x: 0.58, y: 0.4 },
      { label: 'Travel', x: 0.12, y: 0.55 },
      { label: 'Learning', x: 0.65, y: 0.8 },
    ];

    var connections = [
      [0, 2], [0, 5], [1, 5], [1, 7], [2, 4],
      [3, 5], [4, 6], [5, 7], [2, 7], [0, 6]
    ];

    function resize(){
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getPos(topic){
      var rect = canvas.getBoundingClientRect();
      return { x: topic.x * rect.width, y: topic.y * rect.height };
    }

    function draw(){
      var rect = canvas.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h);

      var isDark = root.getAttribute('data-theme') === 'dark';
      var accentColor = isDark ? '107, 163, 214' : '184, 134, 11';
      var mutedColor = isDark ? '110, 122, 146' : '168, 158, 148';

      /* connections */
      connections.forEach(function(pair){
        var a = getPos(topics[pair[0]]);
        var b = getPos(topics[pair[1]]);
        var isHovered = hovered === pair[0] || hovered === pair[1];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isHovered
          ? 'rgba(' + accentColor + ', 0.35)'
          : 'rgba(' + mutedColor + ', 0.12)';
        ctx.lineWidth = isHovered ? 1.5 : 0.8;
        ctx.stroke();
      });

      /* nodes */
      topics.forEach(function(topic, i){
        var pos = getPos(topic);
        var dx = mouseX - pos.x;
        var dy = mouseY - pos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var isNear = dist < 60;
        if(isNear && hovered === null) hovered = i;
        else if(!isNear && hovered === i) hovered = null;

        var nodeR = isNear ? 5 : 3;
        var glowR = isNear ? 28 : 0;

        /* glow */
        if(isNear){
          var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR);
          grad.addColorStop(0, 'rgba(' + accentColor + ', 0.15)');
          grad.addColorStop(1, 'rgba(' + accentColor + ', 0)');
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        /* dot */
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeR, 0, Math.PI * 2);
        ctx.fillStyle = isNear ? 'rgba(' + accentColor + ', 0.9)' : 'rgba(' + mutedColor + ', 0.5)';
        ctx.fill();

        /* label */
        if(isNear){
          ctx.font = '500 14px Jost, sans-serif';
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color').trim() || '#3d3630';
          ctx.textAlign = 'center';
          ctx.fillText(topic.label, pos.x, pos.y - 16);
        }
      });

      if(!prefersReducedMotion.matches) requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousemove', function(e){
      var rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', function(){
      mouseX = -1000;
      mouseY = -1000;
      hovered = null;
    });

    resize();
    window.addEventListener('resize', resize);

    if(prefersReducedMotion.matches){
      /* static draw once */
      topics.forEach(function(t){ t._static = true; });
      draw();
    } else {
      requestAnimationFrame(draw);
    }
  }

  /* ── Gallery items reveal ── */
  function initGalleryReveal(){
    var items = document.querySelectorAll('.gallery-item');
    if(!items.length) return;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if(prefersReducedMotion.matches){
      items.forEach(function(item){ item.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var index = Array.prototype.indexOf.call(items, entry.target);
          setTimeout(function(){
            entry.target.classList.add('visible');
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    items.forEach(function(item){ observer.observe(item); });
  }

  /* ── Search ── */
  function ensureSearchModal(){
    if(document.querySelector('.search-modal')) return;
    var modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Search posts');

    var panel = document.createElement('div');
    panel.className = 'search-panel';

    var input = document.createElement('input');
    input.className = 'search-input';
    input.type = 'text';
    input.placeholder = 'Search posts...';
    input.setAttribute('autocomplete', 'off');

    var results = document.createElement('div');
    results.className = 'search-results';

    panel.appendChild(input);
    panel.appendChild(results);
    modal.appendChild(panel);
    modal.addEventListener('click', function(e){ if(e.target === modal) modal.classList.remove('open'); });
    document.body.appendChild(modal);
    input.addEventListener('input', renderSearchResults);
  }

  async function loadSearchIndex(){
    if(searchLoaded) return;
    try {
      var res = await fetch('/public/search-index.json');
      searchIndex = await res.json();
    } catch(e) {
      searchIndex = [];
    }
    searchLoaded = true;
  }

  function scoreItem(item, q){
    var hay = [item.title, item.summary, (item.tags || []).join(' ')].join(' \n ').toLowerCase();
    if(!hay.includes(q)) return -1;
    var s = 0;
    if((item.title || '').toLowerCase().includes(q)) s += 5;
    if((item.tags || []).join(' ').toLowerCase().includes(q)) s += 3;
    if((item.summary || '').toLowerCase().includes(q)) s += 2;
    return s;
  }

  function renderSearchResults(){
    var modal = document.querySelector('.search-modal');
    if(!modal) return;
    var input = modal.querySelector('.search-input');
    var results = modal.querySelector('.search-results');
    var q = (input.value || '').trim().toLowerCase();
    results.textContent = '';

    function appendEmpty(message){
      var empty = document.createElement('div');
      empty.className = 'search-empty';
      empty.textContent = message;
      results.appendChild(empty);
    }

    if(!q){
      appendEmpty('Type to search posts, tags, and summaries.');
      return;
    }
    var matches = searchIndex
      .map(function(item){ return { item: item, score: scoreItem(item, q) }; })
      .filter(function(x){ return x.score >= 0; })
      .sort(function(a,b){ return b.score - a.score; })
      .slice(0, 20);
    if(!matches.length){
      appendEmpty('No matching posts.');
      return;
    }

    matches.forEach(function(m){
      var item = m.item;
      var result = document.createElement('a');
      result.className = 'search-result';
      result.href = item.url || '#';

      var title = document.createElement('div');
      title.className = 'search-result-title';
      title.textContent = item.title || 'Untitled';

      var meta = document.createElement('div');
      meta.className = 'search-result-meta';
      var tags = item.tags && item.tags.length ? ' · ' + item.tags.join(' · ') : '';
      meta.textContent = (item.date || '') + tags;

      var summary = document.createElement('div');
      summary.className = 'search-result-summary';
      summary.textContent = item.summary || '';

      result.appendChild(title);
      result.appendChild(meta);
      result.appendChild(summary);
      results.appendChild(result);
    });
  }

  try { applyTheme(localStorage.getItem(themeKey)); } catch(e) {}

  window.toggleTheme = function(){
    var dark = root.getAttribute('data-theme') === 'dark';
    var next = dark ? 'light' : 'dark';
    applyTheme(next === 'dark' ? 'dark' : 'light');
    try { localStorage.setItem(themeKey, next); } catch(e) {}
  };

  window.toggleSearch = async function(){
    ensureSearchModal();
    await loadSearchIndex();
    var modal = document.querySelector('.search-modal');
    modal.classList.toggle('open');
    if(modal.classList.contains('open')){
      var input = modal.querySelector('.search-input');
      input.focus();
      renderSearchResults();
    }
  };

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      var modal = document.querySelector('.search-modal');
      if(modal) modal.classList.remove('open');
    }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      window.toggleSearch();
    }
  });

  /* ── Posts Archive ── */
  function initPostsArchive(){
    if(!document.body.classList.contains('posts-page-body')) return;

    var blogEntries = Array.from(document.querySelectorAll('.blog-entry'));
    var hoverPreview = document.querySelector('.hover-preview');
    var previewSubtitle = document.querySelector('.preview-subtitle');
    var previewImage = document.querySelector('.preview-image');
    var legendItems = Array.from(document.querySelectorAll('.legend-item'));
    var isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var activeFilter = null;

    if(!blogEntries.length || !hoverPreview || !previewSubtitle || !previewImage || !legendItems.length) return;

    if(!isMobile){
      blogEntries.forEach(function(entry){
        entry.addEventListener('mouseenter', function(){
          previewSubtitle.textContent = this.getAttribute('data-subtitle') || '';
          previewImage.src = this.getAttribute('data-image') || '';
          var title = this.querySelector('.blog-title');
          previewImage.alt = title ? title.textContent : '';
          hoverPreview.classList.add('visible');
        });
        entry.addEventListener('mouseleave', function(){
          hoverPreview.classList.remove('visible');
        });
      });
    }

    legendItems.forEach(function(item){
      item.addEventListener('click', function(){
        var category = this.getAttribute('data-category');
        if(activeFilter === category){
          activeFilter = null;
          this.classList.remove('active');
          blogEntries.forEach(function(entry){ entry.classList.remove('hidden'); });
          return;
        }
        activeFilter = category;
        legendItems.forEach(function(li){ li.classList.remove('active'); });
        this.classList.add('active');
        blogEntries.forEach(function(entry){
          if(entry.getAttribute('data-category') === category) entry.classList.remove('hidden');
          else entry.classList.add('hidden');
        });
      });
    });
  }

  /* ── Post Galleries ── */
  function initPostGalleries(){
    var galleries = Array.from(document.querySelectorAll('.post-gallery'));
    if(!galleries.length) return;
    var wheelScrollTimers = new WeakMap();

    function toPixels(delta, deltaMode, gallery){
      if(deltaMode === 1) return delta * 18;
      if(deltaMode === 2) return delta * gallery.clientWidth;
      return delta;
    }

    function markWheelScrolling(gallery){
      gallery.classList.add('is-wheel-scrolling');
      var activeTimer = wheelScrollTimers.get(gallery);
      if(activeTimer) window.clearTimeout(activeTimer);
      var timer = window.setTimeout(function(){
        gallery.classList.remove('is-wheel-scrolling');
        wheelScrollTimers.delete(gallery);
      }, 160);
      wheelScrollTimers.set(gallery, timer);
    }

    function scrollGallery(gallery, rawDelta, deltaMode, event){
      if(!gallery || gallery.scrollWidth <= gallery.clientWidth + 2) return false;
      var delta = toPixels(rawDelta, deltaMode, gallery);
      if(Math.abs(delta) < 1) return false;
      var maxScrollLeft = gallery.scrollWidth - gallery.clientWidth;
      var nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, gallery.scrollLeft + delta));
      if(nextScrollLeft === gallery.scrollLeft) return false;
      event.preventDefault();
      event.stopPropagation();
      markWheelScrolling(gallery);
      gallery.scrollLeft = nextScrollLeft;
      return true;
    }

    function setActiveItem(gallery, item){
      var items = Array.from(gallery.querySelectorAll('.post-gallery-item'));
      var hasActive = false;
      items.forEach(function(candidate){
        var isActive = candidate === item;
        candidate.classList.toggle('is-active', isActive);
        if(isActive) hasActive = true;
      });
      gallery.classList.toggle('has-active', hasActive);
    }

    galleries.forEach(function(gallery){
      var items = Array.from(gallery.querySelectorAll('.post-gallery-item'));

      items.forEach(function(item){
        item.addEventListener('mouseenter', function(){ setActiveItem(gallery, item); });
        item.addEventListener('focus', function(){ setActiveItem(gallery, item); });
      });

      gallery.addEventListener('mouseleave', function(){ setActiveItem(gallery, null); });
      gallery.addEventListener('focusout', function(){
        window.setTimeout(function(){
          var activeElement = document.activeElement;
          if(!(activeElement instanceof Element) || !gallery.contains(activeElement)){
            setActiveItem(gallery, null);
          }
        }, 0);
      });

      gallery.addEventListener('wheel', function(event){
        var primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) * 0.75
          ? event.deltaY : event.deltaX;
        scrollGallery(gallery, primaryDelta, event.deltaMode, event);
      }, { passive: false });

      gallery.addEventListener('mousewheel', function(event){
        var legacyDelta = typeof event.wheelDelta === 'number' ? -event.wheelDelta : 0;
        scrollGallery(gallery, legacyDelta, 0, event);
      }, { passive: false });

      gallery.addEventListener('keydown', function(event){
        var step = Math.max(gallery.clientWidth * 0.85, 220);
        if(event.key === 'ArrowRight'){
          event.preventDefault();
          gallery.scrollBy({ left: step, behavior: 'smooth' });
        } else if(event.key === 'ArrowLeft'){
          event.preventDefault();
          gallery.scrollBy({ left: -step, behavior: 'smooth' });
        }
      });
    });
  }

  /* ── Thinking Cards Pull-from-Deck ── */
  function initThinkingCards(){
    var cards = document.querySelectorAll('.thinking-card');
    if(!cards.length) return;

    var overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    document.body.appendChild(overlay);

    var activeClone = null;
    var activeCard = null;

    function open(card){
      activeCard = card;
      var rect = card.getBoundingClientRect();
      var clone = card.cloneNode(true);

      /* replace icon center with description text */
      var center = clone.querySelector('.thinking-card__center');
      var desc = card.getAttribute('data-desc') || '';
      if(center && desc){
        center.textContent = '';
        var expandedDesc = document.createElement('p');
        expandedDesc.className = 'thinking-card__desc-expanded';
        expandedDesc.textContent = desc;
        center.appendChild(expandedDesc);
      }

      clone.style.position = 'fixed';
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      clone.style.margin = '0';
      clone.style.zIndex = '2001';
      clone.style.transform = 'rotate(' + (getComputedStyle(card).getPropertyValue('--card-rotate') || '0deg') + ')';
      clone.style.transition = 'none';
      clone.style.cursor = 'default';
      overlay.appendChild(clone);
      activeClone = clone;

      /* force reflow */
      clone.offsetHeight;

      overlay.classList.add('open');

      /* animate to center */
      var cx = (window.innerWidth - 300) / 2;
      var cy = (window.innerHeight - 420) / 2;
      clone.style.transition = 'left 0.5s cubic-bezier(0.22, 1, 0.36, 1), top 0.5s cubic-bezier(0.22, 1, 0.36, 1), width 0.5s cubic-bezier(0.22, 1, 0.36, 1), height 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      clone.style.left = cx + 'px';
      clone.style.top = cy + 'px';
      clone.style.width = '300px';
      clone.style.height = '420px';
      clone.style.transform = 'rotate(0deg)';
      clone.classList.add('is-expanded');
    }

    function close(){
      if(!activeClone || !activeCard) return;
      var rect = activeCard.getBoundingClientRect();
      var rotate = getComputedStyle(activeCard).getPropertyValue('--card-rotate') || '0deg';
      activeClone.style.transform = 'rotate(' + rotate + ')';
      activeClone.style.left = rect.left + 'px';
      activeClone.style.top = rect.top + 'px';
      activeClone.style.width = rect.width + 'px';
      activeClone.style.height = rect.height + 'px';
      overlay.classList.remove('open');

      var clone = activeClone;
      setTimeout(function(){
        if(clone.parentNode) clone.parentNode.removeChild(clone);
      }, 500);
      activeClone = null;
      activeCard = null;
    }

    cards.forEach(function(card){
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.style.cursor = 'pointer';
      card.addEventListener('click', function(){ open(card); });
      card.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          open(card);
        }
      });
    });

    overlay.addEventListener('click', function(e){
      if(e.target === overlay) close();
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') close();
    });
  }

  /* ── TOC scroll highlight ── */
  function initTocHighlight(){
    var toc = document.querySelector('.post-article .toc');
    if(!toc) return;
    var body = document.querySelector('.post-body');
    if(!body) return;

    var headings = Array.from(body.querySelectorAll('h2[id], h3[id]'));
    if(!headings.length) return;

    var tocLinks = {};
    headings.forEach(function(h){
      var links = toc.querySelectorAll('a[href]');
      Array.prototype.some.call(links, function(link){
        if(link.getAttribute('href') === '#' + h.id){
          tocLinks[h.id] = link;
          return true;
        }
        return false;
      });
    });

    var activeId = null;

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var id = entry.target.id;
          if(id === activeId) return;
          activeId = id;
          Object.keys(tocLinks).forEach(function(key){
            tocLinks[key].classList.toggle('is-active', key === id);
          });
        }
      });
    }, {
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0
    });

    headings.forEach(function(h){ observer.observe(h); });
  }

  /* ── Gallery page lightbox ── */
  function initGalleryLightbox(){
    var lightbox = document.getElementById('gallery-lightbox');
    var content = document.getElementById('gallery-lightbox-content');
    if(!lightbox || !content) return;

    var items = document.querySelectorAll('.gw-painting, .gw-sculpture');
    items.forEach(function(item){
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      function openItem(e){
        e.stopPropagation();
        content.innerHTML = item.innerHTML;
        lightbox.classList.add('active');
      }

      item.addEventListener('click', openItem);
      item.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          openItem(e);
        }
      });
    });

    content.addEventListener('click', function(e){
      e.stopPropagation();
    });

    lightbox.addEventListener('click', function(){
      lightbox.classList.remove('active');
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') lightbox.classList.remove('active');
    });
  }

  /* ── About page image lightbox ── */
  function initAboutLightbox(){
    var lightbox = document.getElementById('about-lightbox');
    var content = document.getElementById('about-lightbox-content');
    if(!lightbox || !content) return;

    var items = document.querySelectorAll('.about-gallery__item');
    // Fade in images as they load
    items.forEach(function(item){
      var img = item.querySelector('img');
      if(!img) return;
      if(img.complete){ img.classList.add('is-loaded'); }
      else { img.addEventListener('load', function(){ img.classList.add('is-loaded'); }); }
      img.addEventListener('error', function(){ img.classList.add('is-loaded'); });
    });
    items.forEach(function(item){
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      function openItem(e){
        e.stopPropagation();
        content.innerHTML = item.innerHTML;
        content.style.transform = 'rotate(' + (item.style.getPropertyValue('--img-rotate') || '0deg') + ')';
        lightbox.classList.add('active');
      }

      item.addEventListener('click', openItem);
      item.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          openItem(e);
        }
      });
    });

    content.addEventListener('click', function(e){
      e.stopPropagation();
    });

    lightbox.addEventListener('click', function(){
      lightbox.classList.remove('active');
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') lightbox.classList.remove('active');
    });
  }

  /* ── Gallery Spotify embed ── */
  function initGallerySpotify(){
    var cards = document.querySelectorAll('.gw-music[data-spotify]');
    if(!cards.length) return;

    // Stop any other playing card when one starts
    function stopAllExcept(current){
      cards.forEach(function(c){
        if(c === current) return;
        c.classList.remove('is-playing');
        var f = c.querySelector('.gw-music__frame');
        if(f) f.remove();
      });
    }

    cards.forEach(function(card){
      var art = card.querySelector('.gw-music__art');
      var playBtn = card.querySelector('.gw-music__play');
      if(!art) return;

      var trackId = card.getAttribute('data-spotify');

      // Fetch album art from Spotify oEmbed
      art.onload = function(){ art.classList.add('is-loaded'); };
      var oembedUrl = 'https://open.spotify.com/oembed?url=https://open.spotify.com/track/' + trackId;
      fetch(oembedUrl).then(function(r){ return r.json(); }).then(function(data){
        if(data.thumbnail_url){
          art.src = data.thumbnail_url;
        }
      }).catch(function(){});

      // Play/pause toggle
      if(playBtn){
        playBtn.addEventListener('click', function(e){
          e.stopPropagation();
          var isPlaying = card.classList.contains('is-playing');

          stopAllExcept(card);

          if(isPlaying){
            card.classList.remove('is-playing');
            var frame = card.querySelector('.gw-music__frame');
            if(frame) frame.remove();
          } else {
            var iframe = document.createElement('iframe');
            iframe.className = 'gw-music__frame';
            iframe.src = 'https://open.spotify.com/embed/track/' + trackId + '?utm_source=generator&theme=0';
            iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            iframe.loading = 'lazy';
            card.appendChild(iframe);
            card.classList.add('is-playing');
          }
        });
      }
    });
  }

  /* ── Post image lightbox ── */
  function initPostImageLightbox(){
    var postBody = document.querySelector('.post-body');
    if(!postBody) return;

    var overlay = document.createElement('div');
    overlay.className = 'post-image-lightbox';
    var imgEl = document.createElement('img');
    imgEl.className = 'post-image-lightbox__img';
    imgEl.src = '';
    imgEl.alt = '';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'post-image-lightbox__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.type = 'button';
    closeBtn.textContent = '\u00d7';
    overlay.appendChild(imgEl);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    function open(src, alt){
      imgEl.src = src;
      imgEl.alt = alt || '';
      overlay.classList.add('active');
    }

    function close(){
      overlay.classList.remove('active');
      imgEl.src = '';
    }

    postBody.addEventListener('click', function(e){
      var target = e.target;
      if(target.tagName !== 'IMG') return;
      open(target.src, target.alt);
    });

    overlay.addEventListener('click', function(e){
      if(e.target === overlay || e.target === closeBtn) close();
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') close();
    });
  }

  /* ── Init all ── */
  initCursorSpotlight();
  initFontReady();
  initTypewriter();
  initSkyEffects();
  initBubbles();
  initScrollReveal();
  initConstellation();
  initThinkingCards();
  initGalleryReveal();
  initPostsArchive();
  initPostGalleries();
  initAboutLightbox();
  initTocHighlight();
  initGalleryLightbox();
  initGallerySpotify();
  initProjectCards();
  initPostImageLightbox();

  function initProjectCards(){
    var terminal = document.querySelector('.pj-terminal');
    var output = document.querySelector('.pj-output');
    var cmdEl = document.querySelector('.pj-terminal__cmd');
    var cursorEl = document.querySelector('.pj-terminal__cursor');
    if (!terminal || !output || !cmdEl) return;

    var cmd = 'ls ~/projects';
    var running = false;

    function typeAndReveal(){
      if (running) return;
      running = true;
      terminal.classList.add('is-done');

      // Type out the command
      var i = 0;
      var iv = setInterval(function(){
        cmdEl.textContent = cmd.slice(0, ++i);
        if (i >= cmd.length){
          clearInterval(iv);
          // Hide cursor after typing
          if (cursorEl) cursorEl.style.display = 'none';
          // Reveal output after a short pause
          setTimeout(function(){
            output.setAttribute('aria-hidden', 'false');
            output.classList.add('is-revealed');
            // Stagger lang-bar then cards
            var langBar = output.querySelector('.pj-lang-bar');
            var cards = output.querySelectorAll('.pj-card');
            if (langBar){
              setTimeout(function(){ langBar.classList.add('is-visible'); }, 100);
            }
            cards.forEach(function(c, idx){
              setTimeout(function(){ c.classList.add('is-visible'); }, 300 + idx * 80);
            });
          }, 400);
        }
      }, 60);
    }

    // Enter key or click to trigger
    terminal.setAttribute('role', 'button');
    terminal.setAttribute('tabindex', '0');
    document.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && !running) typeAndReveal();
    });
    terminal.addEventListener('keydown', function(e){
      if ((e.key === 'Enter' || e.key === ' ') && !running){
        e.preventDefault();
        typeAndReveal();
      }
    });
    terminal.addEventListener('click', function(){
      if (!running) typeAndReveal();
    });
  }
})();
