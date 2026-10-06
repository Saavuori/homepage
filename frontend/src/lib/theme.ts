// The theme is an explicit choice stamped on <html data-theme>, never the OS
// setting — matching the sibling apps. index.html applies the saved value
// before first paint; light is the default here.

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'homepage-theme'

export function loadTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* persistence is a nicety, not worth failing the toggle over */
  }
}
