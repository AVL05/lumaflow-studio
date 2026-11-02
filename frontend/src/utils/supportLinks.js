const providers = [
  {
    id: "kofi",
    name: "Ko-fi",
    env: "VITE_KOFI_URL",
    host: "ko-fi.com",
    profile: /^\/([a-z0-9_][a-z0-9_-]{2,63})\/?$/i,
    reserved: new Set([
      "about",
      "account",
      "blog",
      "buttons",
      "checkout",
      "commissions",
      "contact",
      "dashboard",
      "donate",
      "explore",
      "features",
      "gold",
      "home",
      "login",
      "logout",
      "manage",
      "memberships",
      "payments",
      "privacy",
      "register",
      "settings",
      "shop",
      "signup",
      "support",
      "terms",
      "widgets",
    ]),
  },
  {
    id: "github",
    name: "GitHub Sponsors",
    env: "VITE_GITHUB_SPONSORS_URL",
    host: "github.com",
    profile: /^\/sponsors\/([a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38})\/?$/i,
    reserved: new Set([
      "account",
      "accounts",
      "checkout",
      "community",
      "dashboard",
      "explore",
      "join",
      "login",
      "logout",
      "new",
      "settings",
      "signup",
      "sponsorships",
      "your-sponsors",
      "your-sponsorships",
    ]),
  },
];

export function getSupportLinks(
  env = {
    VITE_KOFI_URL: import.meta.env.VITE_KOFI_URL,
    VITE_GITHUB_SPONSORS_URL: import.meta.env.VITE_GITHUB_SPONSORS_URL,
  },
) {
  return providers.flatMap((provider) => {
    const value = env[provider.env];
    if (typeof value !== "string") return [];
    const input = value.trim();
    if (
      !input ||
      input.length > 200 ||
      Array.from(input).some(
        (character) =>
          character.charCodeAt(0) <= 32 ||
          character.charCodeAt(0) === 127 ||
          "\\%?#".includes(character),
      )
    )
      return [];
    try {
      const url = new URL(input);
      const profile = url.pathname.match(provider.profile);
      if (
        url.protocol !== "https:" ||
        url.hostname !== provider.host ||
        url.username ||
        url.password ||
        url.port ||
        url.search ||
        url.hash ||
        !profile ||
        provider.reserved.has(profile[1].toLowerCase()) ||
        input.replace(/^https:\/\/[^/]+/i, "") !== url.pathname
      )
        return [];
      return [{ id: provider.id, name: provider.name, url: url.href }];
    } catch {
      return [];
    }
  });
}
