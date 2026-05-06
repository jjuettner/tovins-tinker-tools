/**
 * Parse SRD-style "Challenge" strings from compendium JSON into numeric CR and XP.
 *
 * @param raw Value of the "Challenge" field (e.g. `"10 (5,900 XP)"`, `"1/4 (50 XP)"`).
 * @returns CR as decimal (e.g. 0.125 for 1/8) and XP (0 if absent).
 */
export function parseChallenge(raw: string): { cr: number; xp: number } {
  const s = raw.trim();
  if (!s) return { cr: 0, xp: 0 };

  const xpMatch = s.match(/\(\s*([\d,]+)\s*XP\s*\)/i);
  const xp = xpMatch ? Number.parseInt(xpMatch[1].replace(/,/g, ""), 10) : 0;
  const beforeParen = s.split("(")[0].trim();
  if (!beforeParen) return { cr: 0, xp };

  if (beforeParen.includes("/")) {
    const parts = beforeParen.split("/").map((p) => p.trim());
    const num = Number.parseFloat(parts[0] ?? "");
    const den = Number.parseFloat(parts[1] ?? "");
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return { cr: 0, xp };
    return { cr: num / den, xp };
  }

  const cr = Number.parseFloat(beforeParen);
  return { cr: Number.isFinite(cr) ? cr : 0, xp };
}

/**
 * Parse "Hit Points" field into average HP and dice expression.
 *
 * @param raw e.g. `"135 (18d10 + 36)"` or `"9 (2d8)"`.
 * @returns hp and optional dice string inside parentheses.
 */
export function parseHitPoints(raw: string): { hp: number; hpDice: string | null } {
  const s = raw.trim();
  if (!s) return { hp: 0, hpDice: null };

  const m = s.match(/^(\d+)\s*\(([^)]+)\)\s*$/);
  if (m) {
    const hp = Number.parseInt(m[1], 10);
    const dice = m[2].trim();
    return { hp: Number.isFinite(hp) ? hp : 0, hpDice: dice || null };
  }

  const leading = s.match(/^(\d+)/);
  const hp = leading ? Number.parseInt(leading[1], 10) : Number.parseInt(s, 10);
  return { hp: Number.isFinite(hp) ? hp : 0, hpDice: null };
}
