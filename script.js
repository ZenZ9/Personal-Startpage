// Main app state and logic for the personal startpage dashboard.
// The configuration is stored in localStorage so the page remains fully static
// while still preserving customizations across browser sessions.

const STORAGE_KEY = 'startpage-config-v1';

const DEFAULT_CONFIG = {
  bookmarks: [
    { id: 'github', label: 'GitHub', url: 'https://github.com', icon: 'G' },
    { id: 'gmail', label: 'Gmail', url: 'https://mail.google.com', icon: 'M' },
    { id: 'youtube', label: 'YouTube', url: 'https://youtube.com', icon: 'Y' },
    { id: 'docs', label: 'Docs', url: 'https://docs.google.com', icon: 'D' },
    { id: 'reddit', label: 'Reddit', url: 'https://reddit.com', icon: 'R' },
    { id: 'stackoverflow', label: 'Stack Overflow', url: 'https://stackoverflow.com', icon: 'S' }
  ],
  notes: 'Welcome back!\n\n- Check emails\n- Review sprint tasks\n- Watch the daily standup notes',
  customCSS: `/* Default startpage CSS starter: edit this freely */
/* You can override the app theme variables here.
   Available variables: --bg, --bg-alt, --panel, --panel-soft,
   --text, --muted, --border, --accent, --danger, --success
*/

:root {
  --bg: #090d18;
  --bg-alt: #0f172a;
  --panel: rgba(15, 23, 42, 0.85);
  --panel-strong: rgba(17, 24, 39, 0.9);
  --panel-soft: rgba(30, 41, 59, 0.8);
  --text: #edf2ff;
  --muted: #9aa8c7;
  --border: rgba(148, 163, 184, 0.16);
  --shadow: rgba(15, 23, 42, 0.52);
  --accent: #7c9cff;
  --accent-strong: #9ab0ff;
  --danger: #ff6b6b;
  --success: #6ee7b7;
}

body {
  background:
    radial-gradient(circle at top, rgba(124, 156, 255, 0.18), transparent 30%),
    linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 100%);
  color: var(--text);
}

.app-shell {
  width: min(1100px, 100%);
}

.clock-panel {
  background: rgba(15, 23, 42, 0.2);
  border: 1px solid var(--border);
  box-shadow: 0 18px 40px var(--shadow);
}

.clock {
  color: var(--text);
}

.date {
  color: var(--muted);
}

.search-input-wrap,
.engine-btn,
.bookmark-card,
.notes-input,
.custom-css-input,
.field-row input,
.field-row select,
.bookmark-item {
  background: var(--panel-soft);
  border-color: var(--border);
  color: var(--text);
}

.engine-btn.active {
  background: rgba(124, 156, 255, 0.12);
  border-color: rgba(124, 156, 255, 0.45);
  color: var(--text);
}

.bookmark-card:hover,
.bookmark-item:hover,
.settings-btn:hover,
.primary-btn:hover,
.secondary-btn:hover,
.danger-btn:hover,
.engine-btn:hover,
.close-btn:hover {
  border-color: rgba(124, 156, 255, 0.5);
}

.bookmark-icon {
  background: rgba(124, 156, 255, 0.12);
  border: 1px solid rgba(124, 156, 255, 0.18);
  color: var(--text);
}

.primary-btn {
  background: rgba(124, 156, 255, 0.12);
}

.danger-btn {
  background: rgba(255, 107, 107, 0.08);
  color: #ffc1c1;
}

.modal-backdrop {
  background: rgba(3, 7, 18, 0.7);
}

.settings-section {
  background: rgba(15, 23, 42, 0.2);
}

.settings-help {
  color: var(--muted);
}

.notes-input::placeholder,
.search-input-wrap input::placeholder {
  color: var(--muted);
}`,
  settings: {
    theme: 'dark',
    accent: '#7c9cff',
    defaultSearchEngine: 'google',
    locale: 'en-US'
  }
};

const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  github: 'https://github.com/search?q='
};

let appState = loadConfig();

const elements = {
  clock: document.getElementById('clock'),
  date: document.getElementById('date'),
  searchForm: document.getElementById('searchForm'),
  searchInput: document.getElementById('searchInput'),
  engineButtons: [...document.querySelectorAll('.engine-btn')],
  bookmarksGrid: document.getElementById('bookmarksGrid'),
  notesInput: document.getElementById('notesInput'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  themeSelect: document.getElementById('themeSelect'),
  accentColor: document.getElementById('accentColor'),
  searchEngineSelect: document.getElementById('searchEngineSelect'),
  localeInput: document.getElementById('localeInput'),
  bookmarkForm: document.getElementById('bookmarkForm'),
  bookmarkId: document.getElementById('bookmarkId'),
  bookmarkLabel: document.getElementById('bookmarkLabel'),
  bookmarkUrl: document.getElementById('bookmarkUrl'),
  bookmarkIcon: document.getElementById('bookmarkIcon'),
  bookmarkList: document.getElementById('bookmarkList'),
  cancelBookmarkEdit: document.getElementById('cancelBookmarkEdit'),
  customCssInput: document.getElementById('customCssInput'),
  exportConfigBtn: document.getElementById('exportConfigBtn'),
  importConfigInput: document.getElementById('importConfigInput'),
  resetConfigBtn: document.getElementById('resetConfigBtn')
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeDeep(target, source) {
  const result = deepClone(target);

  for (const key of Object.keys(source || {})) {
    const targetValue = result[key];
    const sourceValue = source[key];

    if (Array.isArray(sourceValue)) {
      result[key] = sourceValue;
    } else if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      result[key] = mergeDeep(targetValue || {}, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

function normalizeConfig(config) {
  const normalized = mergeDeep(DEFAULT_CONFIG, config || {});

  if (!normalized.customCSS || normalized.customCSS.trim() === '') {
    normalized.customCSS = deepClone(DEFAULT_CONFIG.customCSS);
  }

  return normalized;
}

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return deepClone(DEFAULT_CONFIG);
    }

    const parsed = JSON.parse(saved);
    return normalizeConfig(parsed);
  } catch (error) {
    console.warn('Failed to load config. Falling back to defaults.', error);
    return deepClone(DEFAULT_CONFIG);
  }
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function applyTheme() {
  document.body.dataset.theme = appState.settings.theme || 'dark';
  document.documentElement.style.setProperty('--accent', appState.settings.accent || '#7c9cff');
}

function applyCustomCSS() {
  let styleTag = document.getElementById('dynamic-custom-css');

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-custom-css';
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = appState.customCSS || '';
}

function updateClock() {
  const formatter = new Intl.DateTimeFormat(appState.settings.locale || navigator.language || 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const dateFormatter = new Intl.DateTimeFormat(appState.settings.locale || navigator.language || 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const now = new Date();
  elements.clock.textContent = formatter.format(now);
  elements.date.textContent = dateFormatter.format(now);
}

function buildSearchUrl(engine, query) {
  const cleanedQuery = encodeURIComponent(query.trim());
  const baseUrl = SEARCH_ENGINES[engine] || SEARCH_ENGINES.google;
  return `${baseUrl}${cleanedQuery}`;
}

function renderBookmarks() {
  elements.bookmarksGrid.innerHTML = '';

  appState.bookmarks.forEach((bookmark) => {
    const link = document.createElement('a');
    link.href = bookmark.url;
    link.className = 'bookmark-card';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = bookmark.label;

    const icon = document.createElement('span');
    icon.className = 'bookmark-icon';
    icon.textContent = bookmark.icon || bookmark.label.charAt(0).toUpperCase();

    const name = document.createElement('span');
    name.className = 'bookmark-label';
    name.textContent = bookmark.label;

    link.append(icon, name);
    elements.bookmarksGrid.appendChild(link);
  });
}

function renderBookmarkList() {
  elements.bookmarkList.innerHTML = '';

  appState.bookmarks.forEach((bookmark) => {
    const item = document.createElement('div');
    item.className = 'bookmark-item';

    const meta = document.createElement('div');
    meta.className = 'bookmark-meta';
    meta.innerHTML = `<strong>${escapeHtml(bookmark.label)}</strong><span>${escapeHtml(bookmark.url)}</span>`;

    const actions = document.createElement('div');
    actions.className = 'bookmark-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'icon-btn';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => fillBookmarkForm(bookmark));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'icon-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      appState.bookmarks = appState.bookmarks.filter((entry) => entry.id !== bookmark.id);
      saveConfig();
      renderBookmarks();
      renderBookmarkList();
    });

    actions.append(editButton, deleteButton);
    item.append(meta, actions);
    elements.bookmarkList.appendChild(item);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fillBookmarkForm(bookmark) {
  elements.bookmarkId.value = bookmark.id;
  elements.bookmarkLabel.value = bookmark.label;
  elements.bookmarkUrl.value = bookmark.url;
  elements.bookmarkIcon.value = bookmark.icon || '';
  elements.bookmarkLabel.focus();
}

function clearBookmarkForm() {
  elements.bookmarkForm.reset();
  elements.bookmarkId.value = '';
}

function syncSearchButtons() {
  const activeEngine = appState.settings.defaultSearchEngine || 'google';

  elements.engineButtons.forEach((button) => {
    const isActive = button.dataset.engine === activeEngine;
    button.classList.toggle('active', isActive);
  });

  elements.searchEngineSelect.value = activeEngine;
}

function openSettingsModal() {
  elements.settingsModal.classList.remove('hidden');
  elements.settingsModal.setAttribute('aria-hidden', 'false');
  elements.themeSelect.value = appState.settings.theme;
  elements.accentColor.value = appState.settings.accent;
  elements.searchEngineSelect.value = appState.settings.defaultSearchEngine;
  elements.localeInput.value = appState.settings.locale || navigator.language || 'en-US';
  elements.customCssInput.value = appState.customCSS;
  renderBookmarkList();
}

function closeSettingsModal() {
  elements.settingsModal.classList.add('hidden');
  elements.settingsModal.setAttribute('aria-hidden', 'true');
}

function handleSearch(event) {
  event.preventDefault();

  const query = elements.searchInput.value.trim();
  if (!query) {
    elements.searchInput.focus();
    return;
  }

  const engine = appState.settings.defaultSearchEngine || 'google';
  const url = buildSearchUrl(engine, query);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function handleEngineSelection(event) {
  const engine = event.currentTarget.dataset.engine;
  if (!engine) return;

  appState.settings.defaultSearchEngine = engine;
  saveConfig();
  syncSearchButtons();
  elements.searchInput.focus();
}

function handleBookmarkSubmit(event) {
  event.preventDefault();

  const id = elements.bookmarkId.value || `bookmark-${Date.now()}`;
  const label = elements.bookmarkLabel.value.trim();
  const url = elements.bookmarkUrl.value.trim();
  const icon = (elements.bookmarkIcon.value || label.charAt(0)).trim().slice(0, 2);

  if (!label || !url) {
    return;
  }

  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const existingIndex = appState.bookmarks.findIndex((bookmark) => bookmark.id === id);

  const bookmark = {
    id,
    label,
    url: normalizedUrl,
    icon
  };

  if (existingIndex >= 0) {
    appState.bookmarks[existingIndex] = bookmark;
  } else {
    appState.bookmarks.unshift(bookmark);
  }

  saveConfig();
  renderBookmarks();
  renderBookmarkList();
  clearBookmarkForm();
}

function handleConfigExport() {
  const json = JSON.stringify(appState, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'startpage-config.json';
  anchor.click();

  URL.revokeObjectURL(url);
}

async function handleConfigImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const content = await file.text();
    const parsed = JSON.parse(content);
    appState = mergeDeep(DEFAULT_CONFIG, parsed);
    saveConfig();
    syncUIFromState();
    closeSettingsModal();
  } catch (error) {
    console.error('Failed to import config', error);
    alert('The selected file is not a valid startpage config.');
  } finally {
    event.target.value = '';
  }
}

function resetConfig() {
  const shouldReset = window.confirm('Reset all settings, bookmarks, notes, and custom CSS to defaults?');
  if (!shouldReset) return;

  appState = normalizeConfig(deepClone(DEFAULT_CONFIG));
  saveConfig();
  syncUIFromState();
  closeSettingsModal();
}

function syncUIFromState() {
  applyTheme();
  applyCustomCSS();
  renderBookmarks();
  renderBookmarkList();
  syncSearchButtons();

  elements.notesInput.value = appState.notes || '';
  elements.customCssInput.value = appState.customCSS || '';
  elements.themeSelect.value = appState.settings.theme;
  elements.accentColor.value = appState.settings.accent;
  elements.searchEngineSelect.value = appState.settings.defaultSearchEngine;
  elements.localeInput.value = appState.settings.locale || navigator.language || 'en-US';

  updateClock();
  elements.searchInput.focus();
}

function setupEventListeners() {
  elements.searchForm.addEventListener('submit', handleSearch);

  elements.engineButtons.forEach((button) => {
    button.addEventListener('click', handleEngineSelection);
  });

  elements.settingsBtn.addEventListener('click', openSettingsModal);
  elements.closeModalBtn.addEventListener('click', closeSettingsModal);

  elements.settingsModal.addEventListener('click', (event) => {
    if (event.target.dataset.close === 'true') {
      closeSettingsModal();
    }
  });

  elements.themeSelect.addEventListener('change', (event) => {
    appState.settings.theme = event.target.value;
    saveConfig();
    applyTheme();
  });

  elements.accentColor.addEventListener('input', (event) => {
    appState.settings.accent = event.target.value;
    saveConfig();
    applyTheme();
  });

  elements.searchEngineSelect.addEventListener('change', (event) => {
    appState.settings.defaultSearchEngine = event.target.value;
    saveConfig();
    syncSearchButtons();
  });

  elements.localeInput.addEventListener('change', (event) => {
    appState.settings.locale = event.target.value || navigator.language || 'en-US';
    saveConfig();
    updateClock();
  });

  elements.bookmarkForm.addEventListener('submit', handleBookmarkSubmit);
  elements.cancelBookmarkEdit.addEventListener('click', clearBookmarkForm);

  elements.notesInput.addEventListener('input', (event) => {
    appState.notes = event.target.value;
    saveConfig();
  });

  elements.customCssInput.addEventListener('input', (event) => {
    appState.customCSS = event.target.value;
    saveConfig();
    applyCustomCSS();
  });

  elements.exportConfigBtn.addEventListener('click', handleConfigExport);
  elements.importConfigInput.addEventListener('change', handleConfigImport);
  elements.resetConfigBtn.addEventListener('click', resetConfig);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.settingsModal.classList.contains('hidden')) {
      closeSettingsModal();
    }
  });
}

function initialize() {
  setupEventListeners();
  syncUIFromState();
  updateClock();
  setInterval(updateClock, 1000);
  elements.searchInput.focus();
}

initialize();
