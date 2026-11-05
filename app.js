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

  const urlParams = new URLSearchParams(window.location.search);
  let showDrafts = urlParams.get('drafts') === '1';
  let currentPage = 1;
  let activeYear = null;
  let activePostId = null;
  let searchQuery = '';

  const postsContainer = document.getElementById('posts-container');
  const paginationNav = document.getElementById('pagination-nav');
  const archiveTree = document.getElementById('archive-tree');
  const totalCountLabel = document.getElementById('total-count-label');
  const filterStatus = document.getElementById('filter-status');
  const filterStatusText = document.getElementById('filter-status-text');
  const clearFilterBtn = document.getElementById('clear-filter-btn');
  const searchInput = document.getElementById('search-input');
  const searchKbd = document.getElementById('search-kbd');
  const searchClearBtn = document.getElementById('search-clear');
  const homeLink = document.getElementById('home-link');
  const brandHome = document.getElementById('brand-home');
  const themeToggle = document.getElementById('theme-toggle');
  const fontToggle = document.getElementById('font-toggle');
  const sizeDownBtn = document.getElementById('size-down');
  const sizeUpBtn = document.getElementById('size-up');
  const readingProgress = document.getElementById('reading-progress');
  const backToTopBtn = document.getElementById('back-to-top');
  const mobileArchiveToggle = document.getElementById('mobile-archive-toggle');
  const archiveAside = document.getElementById('archive-aside');
  const draftControlBox = document.getElementById('draft-control-box');
  const toggleDraftsCheckbox = document.getElementById('toggle-drafts-checkbox');
  const footerDraftBtn = document.getElementById('footer-draft-btn');
  const lightbox = document.getElementById('lightbox');
  const lightboxStage = document.getElementById('lightbox-stage');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDate = document.getElementById('lightbox-date');
  const lightboxDownload = document.getElementById('lightbox-download');
  const lightboxClose = document.getElementById('lightbox-close');
  const metaThemeColor = document.getElementById('meta-theme-color');

  function withTransition(fn) {
    if (document.startViewTransition) {
      document.startViewTransition(() => fn());
    } else {
      fn();
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

  function estimateReadingMinutes(blocks) {
    let words = 0;
    blocks.forEach((b) => {
      if (b.text) {
        words += b.text.trim().split(/\s+/).length;
      }
    });
    const mins = Math.max(1, Math.round(words / 210));
    return `${mins} min de lectura`;
  }

  function getVisiblePosts() {
    return allPosts.filter((p) => showDrafts || !p.draft);
  }

  function isPoemLike(blocks) {
    const pBlocks = blocks.filter((b) => b.type === 'paragraph');
    if (pBlocks.length < 12) return false;
    const avgLen = pBlocks.reduce((acc, b) => acc + b.text.length, 0) / pBlocks.length;
    return avgLen < 68;
  }

  function renderPostHTML(post, isSingleView, visibleList) {
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

    const sep = document.createElement('span');
    sep.className = 'meta-sep';
    sep.textContent = '·';
    metaTop.appendChild(sep);

    const readTime = document.createElement('span');
    readTime.className = 'post-reading-time';
    readTime.textContent = estimateReadingMinutes(post.blocks);
    metaTop.appendChild(readTime);

    if (post.draft) {
      const badge = document.createElement('span');
      badge.className = 'draft-badge';
      badge.textContent = 'Borrador';
      metaTop.appendChild(badge);
    }

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
        img.alt = post.title;
        img.loading = 'lazy';
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
    copyBtn.className = 'copy-link-btn';
    copyBtn.textContent = 'Copiar enlace';
    copyBtn.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}${post.draft ? '?drafts=1' : ''}#${post.id}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          copyBtn.textContent = '¡Enlace copiado!';
          setTimeout(() => {
            copyBtn.textContent = 'Copiar enlace';
          }, 2000);
        });
      }
    });

    const printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.className = 'copy-link-btn';
    printBtn.textContent = 'Imprimir / PDF';
    printBtn.addEventListener('click', () => {
      if (activePostId !== post.id) {
        activePostId = post.id;
        window.history.replaceState(null, '', `#${post.id}`);
        renderMain();
      }
      setTimeout(() => {
        window.print();
      }, 120);
    });

    const perma = document.createElement('a');
    perma.className = 'post-permalink';
    perma.href = `#${post.id}`;
    perma.textContent = isSingleView ? 'Enlace directo' : 'Abrir relato →';

    actions.appendChild(printBtn);
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
    archiveTree.innerHTML = '';
    totalCountLabel.textContent = `${visiblePosts.length} textos`;

    const byYear = new Map();
    visiblePosts.forEach((post) => {
      const year = post.date.slice(0, 4);
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(post);
    });

    const years = Array.from(byYear.keys()).sort((a, b) => Number(b) - Number(a));
    years.forEach((year, index) => {
      const postsInYear = byYear.get(year);
      const group = document.createElement('div');
      group.className = 'year-group';

      const shouldOpen =
        activeYear === year ||
        (activePostId && postsInYear.some((p) => p.id === activePostId)) ||
        (!activeYear && !activePostId && index < 3);

      if (shouldOpen) group.classList.add('open');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'year-toggle';
      btn.innerHTML = `
        <span class="year-toggle-left">
          <svg class="year-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <span>${year}</span>
        </span>
        <span class="year-count">${postsInYear.length}</span>
      `;

      btn.addEventListener('click', () => {
        const isOpen = group.classList.contains('open');
        if (isOpen && activeYear === year) {
          group.classList.remove('open');
        } else {
          group.classList.add('open');
          activeYear = year;
          activePostId = null;
          currentPage = 1;
          window.history.replaceState(null, '', `#year-${year}`);
          withTransition(renderMain);
        }
      });

      const ul = document.createElement('ul');
      ul.className = 'year-posts';

      postsInYear.forEach((p) => {
        const li = document.createElement('li');
        li.className = 'year-post-item';
        const a = document.createElement('a');
        a.className = 'year-post-link' + (activePostId === p.id ? ' active' : '');
        a.href = `#${p.id}`;

        const titleSpan = document.createElement('span');
        titleSpan.textContent = p.title + (p.draft ? ' (borrador)' : '');

        const daySpan = document.createElement('span');
        daySpan.className = 'year-post-day';
        daySpan.textContent = formatShortDayMonth(p.date);

        a.appendChild(titleSpan);
        a.appendChild(daySpan);
        li.appendChild(a);
        ul.appendChild(li);
      });

      group.appendChild(btn);
      group.appendChild(ul);
      archiveTree.appendChild(group);
    });
  }

  function renderMain() {
    const visiblePosts = getVisiblePosts();
    renderArchive(visiblePosts);

    postsContainer.innerHTML = '';
    paginationNav.innerHTML = '';

    if (activePostId) {
      const target = visiblePosts.find((p) => p.id === activePostId) || allPosts.find((p) => p.id === activePostId);
      if (target) {
        if (target.draft && !showDrafts) {
          showDrafts = true;
          draftControlBox.hidden = false;
          toggleDraftsCheckbox.checked = true;
          renderArchive(getVisiblePosts());
        }
        document.title = `${target.title} · Escribiéndote...`;
        filterStatus.hidden = false;
        filterStatusText.textContent = `Viendo relato individual · ${formatLongDate(target.date)}`;
        postsContainer.appendChild(renderPostHTML(target, true, getVisiblePosts()));
        updateReadingProgress();
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
      filterStatusText.textContent = `Resultados para “${searchQuery.trim()}” (${filtered.length})`;
    } else if (activeYear) {
      filtered = visiblePosts.filter((p) => p.date.startsWith(activeYear));
      filterStatus.hidden = false;
      filterStatusText.textContent = `Relatos publicados en ${activeYear} (${filtered.length})`;
    } else {
      filterStatus.hidden = true;
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<p>No se encontraron relatos con ese criterio.</p>`;
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'text-action';
      resetBtn.textContent = 'Mostrar todos los relatos';
      resetBtn.addEventListener('click', resetFilters);
      empty.appendChild(resetBtn);
      postsContainer.appendChild(empty);
      return;
    }

    const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * POSTS_PER_PAGE;
    const slice = filtered.slice(startIdx, startIdx + POSTS_PER_PAGE);

    slice.forEach((post) => {
      postsContainer.appendChild(renderPostHTML(post, false, visiblePosts));
    });

    if (totalPages > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'page-btn';
      prevBtn.disabled = currentPage === 1;
      prevBtn.textContent = '← Más recientes';
      prevBtn.addEventListener('click', () => {
        currentPage -= 1;
        withTransition(renderMain);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      const info = document.createElement('span');
      info.className = 'page-indicator';
      info.textContent = `Página ${currentPage} de ${totalPages}`;

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'page-btn';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.textContent = 'Anteriores →';
      nextBtn.addEventListener('click', () => {
        currentPage += 1;
        withTransition(renderMain);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      paginationNav.appendChild(prevBtn);
      paginationNav.appendChild(info);
      paginationNav.appendChild(nextBtn);
    }

    updateReadingProgress();
  }

  function resetFilters() {
    activeYear = null;
    activePostId = null;
    searchQuery = '';
    searchInput.value = '';
    searchClearBtn.hidden = true;
    if (searchKbd) searchKbd.hidden = false;
    currentPage = 1;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    withTransition(renderMain);
  }

  function syncFromHash() {
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
      withTransition(renderMain);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function openLightbox(src, title, formattedDate, slug) {
    lightboxStage.innerHTML = '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = title || '';
    lightboxStage.appendChild(img);
    if (lightboxTitle) lightboxTitle.textContent = title || '';
    if (lightboxDate) lightboxDate.textContent = formattedDate || '';
    if (lightboxDownload) {
      lightboxDownload.href = src;
      const ext = src.split('.').pop() || 'jpg';
      lightboxDownload.setAttribute('download', `${slug || 'foto'}.${ext}`);
    }
    lightbox.hidden = false;
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxStage.innerHTML = '';
  }

  function updateReadingProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      readingProgress.style.width = '0%';
    } else {
      const pct = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
      readingProgress.style.width = `${pct}%`;
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

  window.addEventListener('scroll', updateReadingProgress, { passive: true });
  window.addEventListener('hashchange', syncFromHash);

  homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetFilters();
  });

  brandHome.addEventListener('click', (e) => {
    e.preventDefault();
    resetFilters();
  });

  clearFilterBtn.addEventListener('click', resetFilters);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', next === 'dark' ? '#0F1115' : '#F5F6F8');
    }
    try {
      localStorage.setItem('escribiendote_theme_v2', next);
    } catch (e) {}
  });

  fontToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-font') === 'sans' ? 'sans' : 'serif';
    const next = current === 'sans' ? 'serif' : 'sans';
    document.documentElement.setAttribute('data-font', next);
    try {
      localStorage.setItem('escribiendote_font_v2', next);
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
        try { localStorage.setItem('escribiendote_size_v2', next); } catch (e) {}
      }
    });
    sizeUpBtn.addEventListener('click', () => {
      const curr = document.documentElement.getAttribute('data-size') || 'md';
      const idx = SIZES.indexOf(curr);
      if (idx < SIZES.length - 1) {
        const next = SIZES[idx + 1];
        document.documentElement.setAttribute('data-size', next);
        syncSizeButtons();
        try { localStorage.setItem('escribiendote_size_v2', next); } catch (e) {}
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
    if (searchKbd) searchKbd.hidden = Boolean(searchQuery);
    activePostId = null;
    currentPage = 1;
    renderMain();
  });

  searchClearBtn.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    searchClearBtn.hidden = true;
    if (searchKbd) searchKbd.hidden = false;
    currentPage = 1;
    renderMain();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    } else if (e.key === 'Escape' && !lightbox.hidden) {
      closeLightbox();
    } else if (activePostId && document.activeElement !== searchInput) {
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

  footerDraftBtn.addEventListener('click', () => {
    showDrafts = !showDrafts;
    draftControlBox.hidden = false;
    toggleDraftsCheckbox.checked = showDrafts;
    if (showDrafts) {
      activePostId = 'clara';
      window.location.hash = 'clara';
    } else if (activePostId === 'clara') {
      resetFilters();
    } else {
      renderMain();
    }
  });

  toggleDraftsCheckbox.addEventListener('change', (e) => {
    showDrafts = e.target.checked;
    if (!showDrafts && activePostId === 'clara') {
      resetFilters();
    } else {
      renderMain();
    }
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  if (showDrafts) {
    draftControlBox.hidden = false;
    toggleDraftsCheckbox.checked = true;
  }

  syncFromHash();
})();
