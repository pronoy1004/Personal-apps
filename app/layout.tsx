import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pronoy's To-Do List",
  description: "Personal task management list",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kanban Fitness" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
                  var stored = localStorage.getItem('kanban-data');
                  var theme = 'light';
                  if (stored) {
                    try {
                      var data = JSON.parse(stored);
                      if (data.settings && data.settings.theme) {
                        if (data.settings.theme === 'system' && window.matchMedia) {
                          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                        } else {
                          theme = data.settings.theme === 'dark' ? 'dark' : 'light';
                        }
                      }
                    } catch(e) {}
                  }
                  if (!stored || theme === 'light' || theme === 'system') {
                    if (window.matchMedia) {
                      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                  }
                  if (typeof document !== 'undefined') {
                    document.documentElement.classList[theme === 'dark' ? 'add' : 'remove']('dark');
                  }
                } catch(e) {
                  try {
                    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    }
                  } catch(err) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
