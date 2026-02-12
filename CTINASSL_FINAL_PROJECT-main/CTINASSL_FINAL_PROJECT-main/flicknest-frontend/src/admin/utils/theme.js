// src/admin/utils/theme.js

export function applyThemeFromStorage() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', theme);
}
