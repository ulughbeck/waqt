// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="theme-color" content="#0c0f1b" />
          <meta name="description" content="Immersive sky visualization with sun and moon positions based on local time" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Waqt" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
          {assets}
        </head>
        <body>
          <div id="app">
            <div
              id="loading-spinner"
              style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #000; z-index: 9999;"
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style="animation: spin 1s linear infinite;"
              >
                <style>
                  {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
                </style>
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="rgba(255,255,255,0.2)"
                  stroke-width="3"
                  fill="none"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="#fff"
                  stroke-width="3"
                  stroke-linecap="round"
                  fill="none"
                />
              </svg>
            </div>
            {children}
          </div>
          {scripts}
        </body>
      </html>
    )}
  />
));
