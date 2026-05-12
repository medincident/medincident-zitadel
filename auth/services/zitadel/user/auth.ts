import NextAuth from "next-auth";
import ZitadelProvider from "next-auth/providers/zitadel";
import Credentials from "next-auth/providers/credentials";
import { env } from "@/shared/config/env";
import { takeQrApproval } from "@/services/zitadel/device-context";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    zitadelUserId?: string;
  }
}

const OIDC_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "urn:zitadel:iam:org:project:id:zitadel:aud",
].join(" ");

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${env.ZITADEL_API_URL}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.APP_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
        scope: OIDC_SCOPES,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Ошибка при обновлении токена (RefreshAccessTokenError):", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const useSecureCookies = env.APP_URL.startsWith("https://");

export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/api/auth",
  trustHost: true,
  cookies: {
    pkceCodeVerifier: {
      name: `${useSecureCookies ? "__Secure-" : ""}authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 минут
      },
    },
    state: {
      name: `${useSecureCookies ? "__Secure-" : ""}authjs.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15,
      },
    },
    nonce: {
      name: `${useSecureCookies ? "__Secure-" : ""}authjs.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15,
      },
    },
  },
  providers: [
    ZitadelProvider({
      clientId: env.APP_CLIENT_ID,
      issuer: env.ZITADEL_API_URL,

      // pkce — защита от перехвата кода
      // state — CSRF защита
      // nonce — защита от replay-атак (id_token привязан к конкретному запросу)
      checks: ["pkce", "state", "nonce"],

      client: {
        token_endpoint_auth_method: "none",
      },

      authorization: {
        params: {
          scope: OIDC_SCOPES,
        },
      },
    }),
    // Tokens получены SSE-handler'ом через device_code grant — берём их из
    // approval store по userCode и кладём в JWT, минуя PKCE flow.
    Credentials({
      id: "qr-device-flow",
      name: "QR Device Flow",
      credentials: {
        userCode: { type: "text" },
      },
      authorize: async (credentials) => {
        const userCode = typeof credentials?.userCode === "string" ? credentials.userCode : "";
        if (!userCode) return null;

        const approval = takeQrApproval(userCode);
        if (!approval) return null;

        return {
          id: approval.userId,
          accessToken: approval.accessToken,
          refreshToken: approval.refreshToken,
          accessTokenExpiresAt: approval.accessTokenExpiresAt,
          zitadelUserId: approval.userId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // 1a. Первичный логин через OIDC (ZitadelProvider) — account доступен
      if (account?.provider === "zitadel") {
        return {
          ...token,
          accessToken: account.access_token,
          // Zitadel user ID — из providerAccountId (числовой, напр. "367070315047550982")
          // token.sub может быть UUID из OIDC id_token, что НЕ совпадает с Zitadel user ID
          zitadelUserId: account.providerAccountId,
          expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + 12 * 60 * 60 * 1000,
          refreshToken: account.refresh_token,
        };
      }

      if (account?.provider === "qr-device-flow" && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          zitadelUserId: user.zitadelUserId,
          expiresAt: user.accessTokenExpiresAt ?? Date.now() + 12 * 60 * 60 * 1000,
          refreshToken: user.refreshToken,
        };
      }

      // 2. Если токен еще жив (добавляем запас в 1 минуту)
      if (Date.now() < (token.expiresAt as number) - 60 * 1000) {
        return token;
      }

      // 3. Токен истек — обновляем
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (token) {
        // @ts-expect-error - прокидываем токены и ошибки в клиентскую сессию
        session.accessToken = token.accessToken;
        // @ts-expect-error - Zitadel userId (числовой) для API вызовов
        session.zitadelUserId = token.zitadelUserId;
        // @ts-expect-error - прокидываем ошибку обновления токена в клиентскую сессию
        session.error = token.error;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
});
