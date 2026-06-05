import {
  buildDeployStatus,
  type DeployStatus,
} from "@shared/deployConfig";

export type PublicRuntimeConfig = DeployStatus;

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  return buildDeployStatus({
    viteOAuthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL,
    viteAppId: process.env.VITE_APP_ID,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
  });
}

export function injectRuntimeConfig(html: string): string {
  const config = getPublicRuntimeConfig();
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  const scriptTag = `<script>window.__RUNTIME_CONFIG__=${json}</script>`;
  return html.replace("</head>", () => `${scriptTag}\n  </head>`);
}
