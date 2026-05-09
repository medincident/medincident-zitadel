export interface PasswordRule {
  label: string;
  errorMessage: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: ReadonlyArray<PasswordRule> = [
  {
    label: "Не менее 8 символов",
    errorMessage: "Пароль должен содержать не менее 8 символов",
    test: (p) => p.length >= 8,
  },
  {
    label: "Не более 70 символов",
    errorMessage: "Пароль должен быть не более 70 символов",
    test: (p) => p.length <= 70,
  },
  {
    label: "Содержит заглавную букву",
    errorMessage: "Пароль должен содержать заглавную букву",
    test: (p) => /[A-ZА-ЯЁ]/.test(p),
  },
  {
    label: "Содержит строчную букву",
    errorMessage: "Пароль должен содержать строчную букву",
    test: (p) => /[a-zа-яё]/.test(p),
  },
  {
    label: "Содержит цифру",
    errorMessage: "Пароль должен содержать цифру",
    test: (p) => /\d/.test(p),
  },
  {
    label: "Содержит символ или знак пунктуации",
    errorMessage: "Пароль должен содержать символ или знак пунктуации",
    test: (p) => /[^a-zA-Zа-яА-ЯёЁ0-9\s]/.test(p),
  },
];

export function testPasswordValid(password: string): { ok: true } | { ok: false; error: string } {
  if (!password) return { ok: false, error: "Введите пароль" };
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return { ok: false, error: rule.errorMessage };
  }
  return { ok: true };
}

export function validatePassword(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}
