import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pronoy's To-Do List",
  description: "Personal task management list",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
