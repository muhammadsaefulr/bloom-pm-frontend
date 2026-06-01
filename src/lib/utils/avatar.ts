const colors = ["#ec4899", "#14b8a6", "#6366f1", "#f59e0b", "#10b981", "#64748b"];

function initialsForName(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || "U";
}

function colorForName(name: string) {
  const total = Array.from(name || "User").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length];
}

export function fallbackAvatarUrl(name = "User") {
  const initials = initialsForName(name);
  const background = colorForName(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="${background}"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">${initials}</text></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function safeAvatarUrl(name = "User", avatarUrl?: string | null) {
  const value = avatarUrl?.trim();
  if (!value) return fallbackAvatarUrl(name);

  if (value.startsWith("data:image/") || value.startsWith("blob:")) {
    return value;
  }

  if (value.startsWith("//")) {
    return safeAvatarUrl(name, `https:${value}`);
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      if (url.hostname.includes("googleusercontent.com")) {
        return fallbackAvatarUrl(name);
      }

      return value;
    } catch {
      return fallbackAvatarUrl(name);
    }
  }

  return fallbackAvatarUrl(name);
}
