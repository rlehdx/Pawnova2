// Inline script to apply theme before paint (prevents flash)
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var match = document.cookie.match(/(?:^|;\\s*)theme=([^;]*)/);
              var theme = match ? match[1] : 'light';
              document.documentElement.setAttribute('data-theme', theme);
            } catch(e) {}
          })();
        `,
      }}
    />
  )
}
