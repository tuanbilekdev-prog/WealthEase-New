export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme') || 'light';
              const root = document.documentElement;
              root.classList.remove('dark');
              if (theme === 'dark') {
                root.classList.add('dark');
              }
              root.style.colorScheme = theme;
            } catch (e) {
              console.error('Theme initialization error:', e);
            }
          })();
        `,
      }}
    />
  )
}

