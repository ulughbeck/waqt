// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="theme-color" content="#003243" />
          <meta name="description" content="Immersive sky visualization with sun and moon positions based on local time" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Waqt" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-se-1st.png"
            media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-8.png"
            media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-8-plus.png"
            media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-x-xs.png"
            media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-xr-11.png"
            media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-xs-max-11-pro-max.png"
            media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-12-13-14.png"
            media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-12-13-14-pro-max.png"
            media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-14-pro.png"
            media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/iphone-14-pro-max.png"
            media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/ipad-mini-air.png"
            media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/ipad-mini-air-landscape.png"
            media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/ipad-pro-10-5.png"
            media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/ipad-pro-10-5-landscape.png"
            media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/ipad-pro-11.png"
            media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/ipad-pro-11-landscape.png"
            media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/ipad-pro-12-9.png"
            media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/splash/ipad-pro-12-9-landscape.png"
            media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          />
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
