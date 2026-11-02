/* OpenDossard — Guide organisateurs : menu latéral, sélecteur mobile, précédent/suivant.
   Source unique de la liste des pages : ajouter une page = l'ajouter ici et passer ready à true. */

var GUIDE_SECTIONS = [
  {
    title: 'Bienvenue',
    pages: [{ file: 'index.html', title: 'Sommaire', icon: 'book-open', ready: true }],
  },
  {
    title: 'Préparer',
    pages: [
      { file: 'demarrer.html', title: 'Démarrer', icon: 'log-in', ready: true },
      { file: 'club.html', title: 'Mon club', icon: 'shield', ready: true },
    ],
  },
  {
    title: 'Organiser',
    pages: [
      { file: 'epreuves.html', title: 'Créer une épreuve', icon: 'calendar-plus', ready: true },
      { file: 'licencies.html', title: 'Licenciés', icon: 'id-card', ready: true },
      { file: 'engagements.html', title: 'Engagements', icon: 'user-plus', ready: true },
    ],
  },
  {
    title: 'Le jour de la course',
    pages: [
      { file: 'classements.html', title: 'Classements', icon: 'list-ordered', ready: true },
      { file: 'commissaires.html', title: 'Arbitres & commissaires', icon: 'flag', ready: true },
    ],
  },
  {
    title: 'Après la course',
    pages: [
      { file: 'challenges.html', title: 'Challenges & palmarès', icon: 'trophy', ready: true },
      { file: 'statistiques.html', title: 'Statistiques', icon: 'chart-column', ready: true },
    ],
  },
  {
    title: 'Aide',
    pages: [{ file: 'faq.html', title: 'Questions fréquentes', icon: 'circle-help', ready: true }],
  },
];

(function () {
  function currentFile() {
    var name = window.location.pathname.split('/').pop();
    return name && name.indexOf('.html') !== -1 ? name : 'index.html';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function icon(name) {
    var i = document.createElement('i');
    i.setAttribute('data-lucide', name);
    return i;
  }

  var current = currentFile();
  var allPages = [];
  GUIDE_SECTIONS.forEach(function (s) {
    s.pages.forEach(function (p) { allPages.push(p); });
  });
  var readyPages = allPages.filter(function (p) { return p.ready; });

  // 1. Menu latéral (desktop)
  var nav = document.getElementById('guide-nav');
  if (nav) {
    GUIDE_SECTIONS.forEach(function (section) {
      var group = el('div', 'guide-nav-group');
      group.appendChild(el('div', 'guide-nav-section', section.title));
      nav.appendChild(group);
      section.pages.forEach(function (page) {
        var link = el(page.ready ? 'a' : 'span', 'guide-nav-link');
        if (page.ready) link.href = page.file;
        else link.classList.add('pending');
        if (page.file === current) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
        link.appendChild(icon(page.icon));
        link.appendChild(el('span', '', page.title));
        if (!page.ready) link.appendChild(el('span', 'guide-nav-soon', 'à venir'));
        group.appendChild(link);
      });
    });
  }

  // 2. Sélecteur « Dans ce guide » (mobile)
  var select = document.getElementById('guide-select');
  if (select) {
    GUIDE_SECTIONS.forEach(function (section) {
      var group = document.createElement('optgroup');
      group.label = section.title;
      section.pages.forEach(function (page) {
        var opt = document.createElement('option');
        opt.value = page.file;
        opt.textContent = page.ready ? page.title : page.title + ' (à venir)';
        opt.disabled = !page.ready;
        opt.selected = page.file === current;
        group.appendChild(opt);
      });
      select.appendChild(group);
    });
    select.addEventListener('change', function () {
      window.location.href = select.value;
    });
    // Retour arrière (page restaurée depuis le cache du navigateur) : le select
    // garde la page qu'on vient de quitter ; on le recale sur la page courante.
    window.addEventListener('pageshow', function () {
      select.value = current;
    });
  }

  // 3. Précédent / suivant (pages publiées uniquement)
  var pager = document.getElementById('guide-pager');
  if (pager) {
    var idx = readyPages.findIndex(function (p) { return p.file === current; });
    function pagerLink(page, label, alignRight) {
      var a = el('a', 'guide-pager-link' + (alignRight ? ' text-right sm:col-start-2' : ''));
      a.href = page.file;
      a.appendChild(el('span', 'guide-pager-label', label));
      a.appendChild(el('span', 'guide-pager-title', page.title));
      return a;
    }
    if (idx > 0) pager.appendChild(pagerLink(readyPages[idx - 1], '← Précédent', false));
    if (idx !== -1 && idx < readyPages.length - 1) {
      pager.appendChild(pagerLink(readyPages[idx + 1], 'Suivant →', true));
    }
  }

  // 4. Cartes du sommaire : griser celles des pages non publiées
  document.querySelectorAll('[data-guide-card]').forEach(function (card) {
    var file = card.getAttribute('data-guide-card');
    var page = allPages.find(function (p) { return p.file === file; });
    if (page && !page.ready) {
      card.classList.add('pending');
      card.removeAttribute('href');
      var title = card.querySelector('[data-card-title]');
      if (title) title.appendChild(el('span', 'guide-nav-soon ml-2', 'à venir'));
    }
  });
})();
