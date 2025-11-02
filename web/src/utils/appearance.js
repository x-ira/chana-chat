export function color_scheme() {
  return localStorage.getItem('color_mode') ?? 's';
}

export function init_color_scheme() {
  const doc_cls = document.documentElement.classList;
  const color_mode = color_scheme();
  const sys_dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (color_mode === 'l') {
        doc_cls.remove('dark');
    } else if (color_mode === 'd') {
        doc_cls.add('dark');
    } else if (color_mode === 's') {
        if (sys_dark_mode) {
            doc_cls.add('dark');
        } else {
            doc_cls.remove('dark');
        }
    }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (color_scheme() === 's') {
        const doc_cls = document.documentElement.classList;
        if (e.matches) {
            doc_cls.add('dark');
        } else {
            doc_cls.remove('dark');
        }
    }
});
