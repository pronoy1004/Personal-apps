export function getInitialTheme(): 'light' | 'dark' {

  if (typeof window === 'undefined') return 'light';
  
  try {
    const stored = localStorage.getItem('kanban-data');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.settings?.theme) {
        if (data.settings.theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return data.settings.theme === 'dark' ? 'dark' : 'light';
      }
    }
  } catch {
    // Fall through to system preference
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
