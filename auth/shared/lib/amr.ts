// AMR (Authentication Methods References) — RFC 8176 claim в id_token.
// Zitadel выпускает: "pwd", "otp", "mfa", "webauthn", "idp", "sso", "u2f".

const MFA_CLAIM_VALUES = new Set(["mfa", "otp", "webauthn", "u2f"]);

export function amrIncludesMfa(amr: unknown): boolean {
  if (!Array.isArray(amr)) return false;
  return amr.some((v) => typeof v === "string" && MFA_CLAIM_VALUES.has(v));
}
