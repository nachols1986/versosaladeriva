(function () {
  'use strict';

  const MONTHS_ES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const MONTHS_SHORT = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

  const DAYS_ES = [
    'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
  ];

  const SIZES = ['sm', 'md', 'lg'];
  const POSTS_PER_PAGE = 8;

  const allPosts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [];

  let currentPage = 1;
  let activeYear = null;
  let activePostId = null;
  let searchQuery = '';

  const mainContent = document.getElementById('main-content');
  const postsContainer = document.getElementById('posts-container');
  const paginationNav = document.getElementById('pagination-nav');
  const archiveTree = document.getElementById('archive-tree');
  const totalCountLabel = document.getElementById('total-count-label');
  const filterStatus = document.getElementById('filter-status');
  const filterStatusText = document.getElementById('filter-status-text');
  const clearFilterBtn = document.getElementById('clear-filter-btn');
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear');
  const homeLink = document.getElementById('home-link');
  const themeToggle = document.getElementById('theme-toggle');
  const fontToggle = document.getElementById('font-toggle');
  const sizeDownBtn = document.getElementById('size-down');
  const sizeUpBtn = document.getElementById('size-up');
  const readingProgress = document.getElementById('reading-progress');
  const backToTopBtn = document.getElementById('back-to-top');
  const mobileArchiveToggle = document.getElementById('mobile-archive-toggle');
  const archiveAside = document.getElementById('archive-aside');
  const lightbox = document.getElementById('lightbox');
  const lightboxStage = document.getElementById('lightbox-stage');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDate = document.getElementById('lightbox-date');
  const lightboxDownload = document.getElementById('lightbox-download');
  const metaThemeColor = document.getElementById('meta-theme-color');
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');

  const supportsScrollTimeline = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline', 'scroll()');

  function routeFocusAfterNavigation() {
    const heading = postsContainer.querySelector('.post-title');
    if (activePostId && heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    } else if (mainContent) {
      mainContent.focus({ preventScroll: true });
    }
  }

  function withTransition(fn, shouldRouteFocus) {
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => fn());
      if (shouldRouteFocus) {
        transition.finished.finally(() => {
          routeFocusAfterNavigation();
        });
      }
    } else {
      fn();
      if (shouldRouteFocus) {
        routeFocusAfterNavigation();
      }
    }
  }

  function formatLongDate(isoDate) {
    const parts = isoDate.split('-').map(Number);
    if (parts.length !== 3) return isoDate;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayName = DAYS_ES[d.getDay()];
    const monthName = MONTHS_ES[parts[1] - 1];
    return `${dayName}, ${parts[2]} de ${monthName} de ${parts[0]}`;
  }

  function formatShortDayMonth(isoDate) {
    const parts = isoDate.split('-').map(Number);
    if (parts.length !== 3) return isoDate;
    return `${String(parts[2]).padStart(2, '0')} ${MONTHS_SHORT[parts[1] - 1]}`;
  }

  function countWordsAndChars(blocks) {
    let words = 0;
    let chars = 0;
    blocks.forEach((b) => {
      if (b.text) {
        const clean = b.text.trim();
        chars += clean.length;
        words += clean.split(/\s+/).length;
      }
    });
    const mins = Math.max(1, Math.round(words / 210));
    return { words, chars, mins };
  }

  function getVisiblePosts() {
    return allPosts.filter((p) => !p.draft);
  }

  function isPoemLike(blocks) {
    const pBlocks = blocks.filter((b) => b.type === 'paragraph');
    if (pBlocks.length < 12) return false;
    const avgLen = pBlocks.reduce((acc, b) => acc + b.text.length, 0) / pBlocks.length;
    return avgLen < 68;
  }

  function renderPostHTML(post, isSingleView, visibleList, isFirstOnPage) {
    const article = document.createElement('article');
    article.className = 'post-article';
    article.id = `post-${post.id}`;

    const header = document.createElement('header');
    header.className = 'post-header';

    const metaTop = document.createElement('div');
    metaTop.className = 'post-meta-top';

    const timeEl = document.createElement('time');
    timeEl.className = 'post-date';
    timeEl.dateTime = post.date;
    timeEl.textContent = formatLongDate(post.date);
    metaTop.appendChild(timeEl);

    const stats = countWordsAndChars(post.blocks);
    const readTime = document.createElement('span');
    readTime.className = 'post-reading-time';
    readTime.textContent = `· ${stats.mins} min de lectura`;
    metaTop.appendChild(readTime);

    const headerActions = document.createElement('div');
    headerActions.className = 'post-header-actions';

    const topPrintBtn = document.createElement('button');
    topPrintBtn.type = 'button';
    topPrintBtn.className = 'btn-recto secundario';
    topPrintBtn.title = 'Imprimir o guardar este relato como PDF';
    topPrintBtn.textContent = 'Imprimir / PDF';
    topPrintBtn.addEventListener('click', () => {
      if (activePostId !== post.id) {
        activePostId = post.id;
        window.history.replaceState(null, '', `#${post.id}`);
        renderMain();
      }
      setTimeout(() => {
        window.print();
      }, 150);
    });

    headerActions.appendChild(topPrintBtn);
    metaTop.appendChild(headerActions);

    const h2 = document.createElement('h2');
    h2.className = 'post-title';
    const titleLink = document.createElement('a');
    titleLink.href = `#${post.id}`;
    titleLink.textContent = post.title;
    h2.appendChild(titleLink);

    header.appendChild(metaTop);
    header.appendChild(h2);
    article.appendChild(header);

    const body = document.createElement('div');
    body.className = 'post-body';
    const poemMode = isPoemLike(post.blocks);

    post.blocks.forEach((block) => {
      if (block.type === 'paragraph') {
        const p = document.createElement('p');
        if (poemMode) p.className = 'poem-line';
        p.textContent = block.text;
        body.appendChild(p);
      } else if (block.type === 'epigraph') {
        const bq = document.createElement('blockquote');
        bq.className = 'post-epigraph';
        bq.textContent = block.text;
        body.appendChild(bq);
      } else if (block.type === 'image') {
        const fig = document.createElement('figure');
        fig.className = 'post-figure';
        const img = document.createElement('img');
        img.src = block.src;
        img.alt = `Fotografía del relato ${post.title}`;
        img.decoding = 'async';
        if (!isFirstOnPage) {
          img.loading = 'lazy';
        }
        img.addEventListener('click', () => openLightbox(block.src, post.title, formatLongDate(post.date), post.id));
        fig.appendChild(img);
        body.appendChild(fig);
      } else if (block.type === 'youtube') {
        const wrap = document.createElement('div');
        wrap.className = 'video-embed';
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${block.id}`;
        iframe.title = `Video en ${post.title}`;
        iframe.loading = 'lazy';
        iframe.allowFullscreen = true;
        wrap.appendChild(iframe);
        body.appendChild(wrap);
      }
    });

    article.appendChild(body);

    const footer = document.createElement('footer');
    footer.className = 'post-footer';
    const authorSpan = document.createElement('span');
    authorSpan.textContent = 'Publicado por Nacho';

    const actions = document.createElement('div');
    actions.className = 'post-footer-actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn-recto secundario';
    copyBtn.textContent = 'Copiar enlace';
    copyBtn.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}#${post.id}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          copyBtn.textContent = '¡Enlace copiado!';
          setTimeout(() => {
            copyBtn.textContent = 'Copiar enlace';
          }, 2000);
        });
      }
    });

    const perma = document.createElement('a');
    perma.className = 'btn-recto secundario';
    perma.href = `#${post.id}`;
    perma.textContent = isSingleView ? 'Enlace permanente' : 'Ficha individual →';

    actions.appendChild(copyBtn);
    actions.appendChild(perma);
    footer.appendChild(authorSpan);
    footer.appendChild(actions);
    article.appendChild(footer);

    if (isSingleView && visibleList) {
      const idx = visibleList.findIndex((p) => p.id === post.id);
      if (idx !== -1) {
        const nav = document.createElement('nav');
        nav.className = 'single-post-nav';
        nav.setAttribute('aria-label', 'Relatos anterior y siguiente');

        const newerPost = idx > 0 ? visibleList[idx - 1] : null;
        const olderPost = idx < visibleList.length - 1 ? visibleList[idx + 1] : null;

        if (newerPost) {
          const newerLink = document.createElement('a');
          newerLink.className = 'adj-link prev';
          newerLink.href = `#${newerPost.id}`;
          const dir = document.createElement('span');
          dir.className = 'adj-dir';
          dir.textContent = '← Más reciente';
          const t = document.createElement('span');
          t.className = 'adj-title';
          t.textContent = newerPost.title;
          newerLink.appendChild(dir);
          newerLink.appendChild(t);
          nav.appendChild(newerLink);
        }

        if (olderPost) {
          const olderLink = document.createElement('a');
          olderLink.className = 'adj-link next';
          olderLink.href = `#${olderPost.id}`;
          const dir = document.createElement('span');
          dir.className = 'adj-dir';
          dir.textContent = 'Anterior →';
          const t = document.createElement('span');
          t.className = 'adj-title';
          t.textContent = olderPost.title;
          olderLink.appendChild(dir);
          olderLink.appendChild(t);
          nav.appendChild(olderLink);
        }

        article.appendChild(nav);
      }
    }

    return article;
  }

  function renderArchive(visiblePosts) {
    totalCountLabel.textContent = `${visiblePosts.length} textos`;

    const byYear = new Map();
    visiblePosts.forEach((post) => {
      const year = post.date.slice(0, 4);
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(post);
    });

    const years = Array.from(byYear.keys()).sort((a, b) => Number(b) - Number(a));
    const groups = years.map((year, index) => {
      const postsInYear = byYear.get(year);
      const details = document.createElement('details');
      details.className = 'year-group';

      const shouldOpen =
        activeYear === year ||
        (activePostId && postsInYear.some((p) => p.id === activePostId)) ||
        (!activeYear && !activePostId && index < 4);

      if (shouldOpen) details.open = true;

      const summary = document.createElement('summary');
      summary.className = 'year-toggle';

      const yearLabel = document.createElement('span');
      yearLabel.textContent = year;

      const countSpan = document.createElement('span');
      countSpan.className = 'year-count';
      countSpan.textContent = String(postsInYear.length);

      summary.appendChild(yearLabel);
      summary.appendChild(countSpan);

      const ul = document.createElement('ul');
      ul.className = 'year-posts';

      postsInYear.forEach((p) => {
        const li = document.createElement('li');
        li.className = 'year-post-item';
        const a = document.createElement('a');
        a.className = 'year-post-link' + (activePostId === p.id ? ' active' : '');
        a.href = `#${p.id}`;

        const titleSpan = document.createElement('span');
        titleSpan.textContent = p.title;

        const daySpan = document.createElement('span');
        daySpan.className = 'year-post-day';
        daySpan.textContent = formatShortDayMonth(p.date);

        a.appendChild(titleSpan);
        a.appendChild(daySpan);
        li.appendChild(a);
        ul.appendChild(li);
      });

      details.appendChild(summary);
      details.appendChild(ul);
      return details;
    });

    archiveTree.replaceChildren(...groups);
  }

  function renderMain() {
    const visiblePosts = getVisiblePosts();
    renderArchive(visiblePosts);

    postsContainer.replaceChildren();
    paginationNav.replaceChildren();

    if (activePostId) {
      const target = visiblePosts.find((p) => p.id === activePostId) || allPosts.find((p) => p.id === activePostId);
      if (target) {
        document.title = `${target.title} · Escribiéndote...`;
        filterStatus.hidden = false;
        filterStatusText.textContent = `Ficha individual · ${target.title} (${formatLongDate(target.date)})`;
        postsContainer.replaceChildren(renderPostHTML(target, true, visiblePosts, true));
        updateScrollUI();
        return;
      }
    }

    document.title = 'Escribiéndote...';

    let filtered = visiblePosts;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      filtered = visiblePosts.filter((p) => {
        if (p.title.toLowerCase().includes(q)) return true;
        return p.blocks.some((b) => b.text && b.text.toLowerCase().includes(q));
      });
      filterStatus.hidden = false;
      filterStatusText.textContent = `Filtro de búsqueda: “${searchQuery.trim()}” (${filtered.length} relatos)`;
    } else if (activeYear) {
      filtered = visiblePosts.filter((p) => p.date.startsWith(activeYear));
      filterStatus.hidden = false;
      filterStatusText.textContent = `Archivo del año ${activeYear} (${filtered.length} relatos)`;
    } else {
      filterStatus.hidden = true;
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const msg = document.createElement('p');
      msg.textContent = 'No se encontraron relatos con ese criterio.';
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'btn-recto secundario';
      resetBtn.textContent = 'Mostrar todos los relatos';
      resetBtn.addEventListener('click', resetFilters);
      empty.appendChild(msg);
      empty.appendChild(resetBtn);
      postsContainer.replaceChildren(empty);
      return;
    }

    const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * POSTS_PER_PAGE;
    const slice = filtered.slice(startIdx, startIdx + POSTS_PER_PAGE);

    const renderedArticles = slice.map((post, idx) => renderPostHTML(post, false, visiblePosts, idx === 0));
    postsContainer.replaceChildren(...renderedArticles);

    if (totalPages > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'btn-recto secundario';
      prevBtn.disabled = currentPage === 1;
      prevBtn.textContent = '← Más recientes';
      prevBtn.addEventListener('click', () => {
        currentPage -= 1;
        withTransition(renderMain, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      const info = document.createElement('span');
      info.className = 'page-indicator';
      info.textContent = `Página ${currentPage} de ${totalPages}`;

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'btn-recto secundario';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.textContent = 'Anteriores →';
      nextBtn.addEventListener('click', () => {
        currentPage += 1;
        withTransition(renderMain, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      paginationNav.replaceChildren(prevBtn, info, nextBtn);
    }

    updateScrollUI();
  }

  function resetFilters() {
    activeYear = null;
    activePostId = null;
    searchQuery = '';
    searchInput.value = '';
    searchClearBtn.hidden = true;
    currentPage = 1;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    withTransition(renderMain, true);
  }

  function syncFromHash(isInitial) {
    const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, '')).trim();
    if (!rawHash) {
      activePostId = null;
      activeYear = null;
      renderMain();
      return;
    }
    if (rawHash.startsWith('year-')) {
      activeYear = rawHash.slice(5);
      activePostId = null;
      currentPage = 1;
      renderMain();
      return;
    }
    const found = allPosts.find((p) => p.id === rawHash || p.bloggerPath === rawHash);
    if (found) {
      activePostId = found.id;
      activeYear = null;
      withTransition(renderMain, !isInitial);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function openLightbox(src, title, formattedDate, slug) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = title ? `Fotografía ampliada de ${title}` : 'Fotografía ampliada';
    img.decoding = 'async';
    lightboxStage.replaceChildren(img);
    if (lightboxTitle) lightboxTitle.textContent = title || '';
    if (lightboxDate) lightboxDate.textContent = formattedDate || '';
    if (lightboxDownload) {
      lightboxDownload.href = src;
      const ext = src.split('.').pop() || 'jpg';
      lightboxDownload.setAttribute('download', `${slug || 'foto'}.${ext}`);
    }
    if (lightbox && typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    }
  }

  function updateScrollUI() {
    if (!supportsScrollTimeline && readingProgress) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      readingProgress.style.transform = `scaleX(${pct})`;
    }
    if (backToTopBtn) {
      backToTopBtn.hidden = window.scrollY < 520;
    }
  }

  function syncSizeButtons() {
    const curr = document.documentElement.getAttribute('data-size') || 'md';
    const idx = SIZES.indexOf(curr);
    if (sizeDownBtn) sizeDownBtn.disabled = idx <= 0;
    if (sizeUpBtn) sizeUpBtn.disabled = idx >= SIZES.length - 1;
  }

  window.addEventListener('scroll', updateScrollUI, { passive: true });
  window.addEventListener('hashchange', () => syncFromHash(false));

  homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetFilters();
  });

  clearFilterBtn.addEventListener('click', resetFilters);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', next);
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', next === 'dark' ? '#111815' : '#1f3a2e');
    }
    try {
      localStorage.setItem('escribiendote_theme_editorial', next);
    } catch (e) {}
  });

  fontToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-font') === 'sans' ? 'sans' : 'serif';
    const next = current === 'sans' ? 'serif' : 'sans';
    document.documentElement.setAttribute('data-font', next);
    try {
      localStorage.setItem('escribiendote_font_editorial', next);
    } catch (e) {}
  });

  if (sizeDownBtn && sizeUpBtn) {
    sizeDownBtn.addEventListener('click', () => {
      const curr = document.documentElement.getAttribute('data-size') || 'md';
      const idx = SIZES.indexOf(curr);
      if (idx > 0) {
        const next = SIZES[idx - 1];
        document.documentElement.setAttribute('data-size', next);
        syncSizeButtons();
        try { localStorage.setItem('escribiendote_size_editorial', next); } catch (e) {}
      }
    });
    sizeUpBtn.addEventListener('click', () => {
      const curr = document.documentElement.getAttribute('data-size') || 'md';
      const idx = SIZES.indexOf(curr);
      if (idx < SIZES.length - 1) {
        const next = SIZES[idx + 1];
        document.documentElement.setAttribute('data-size', next);
        syncSizeButtons();
        try { localStorage.setItem('escribiendote_size_editorial', next); } catch (e) {}
      }
    });
    syncSizeButtons();
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    searchClearBtn.hidden = !searchQuery;
    activePostId = null;
    currentPage = 1;
    renderMain();
  });

  searchClearBtn.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    searchClearBtn.hidden = true;
    currentPage = 1;
    renderMain();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    } else if (activePostId && document.activeElement !== searchInput && (!lightbox || !lightbox.open)) {
      const visible = getVisiblePosts();
      const idx = visible.findIndex((p) => p.id === activePostId);
      if (idx !== -1) {
        if (e.key === 'ArrowLeft' && idx > 0) {
          window.location.hash = visible[idx - 1].id;
        } else if (e.key === 'ArrowRight' && idx < visible.length - 1) {
          window.location.hash = visible[idx + 1].id;
        }
      }
    }
  });

  mobileArchiveToggle.addEventListener('click', () => {
    const isOpen = archiveAside.classList.toggle('mobile-open');
    mobileArchiveToggle.setAttribute('aria-expanded', String(isOpen));
  });

  if (lightbox) {
    lightbox.addEventListener('close', () => {
      lightboxStage.replaceChildren();
    });

    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      const isOutside = (e, dialog) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      lightbox.addEventListener('pointerdown', (e) => {
        pressedOutside = isOutside(e, lightbox);
      });
      lightbox.addEventListener('pointerup', (e) => {
        if (pressedOutside && isOutside(e, lightbox)) {
          lightbox.close();
        }
      });
    }
  }

  syncFromHash(true);
})();
