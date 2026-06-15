/** Lucide-style icon names use lowercase kebab-case; anything else is treated as emoji. */
const LUCIDE_ICON_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const CATEGORY_COLOR_ICON = 'circle';

export type CategoryDisplayMode = 'color' | 'emoji';

export function isCategoryEmoji(icon: string): boolean {
  if (!icon || icon === CATEGORY_COLOR_ICON || icon === 'tag') return false;
  return !LUCIDE_ICON_PATTERN.test(icon);
}

export function getCategoryDisplayMode(icon: string): CategoryDisplayMode {
  return isCategoryEmoji(icon) ? 'emoji' : 'color';
}

export function categoryIconForMode(mode: CategoryDisplayMode, emoji: string): string {
  return mode === 'emoji' ? emoji : CATEGORY_COLOR_ICON;
}

export const CATEGORY_EMOJI_SUGGESTIONS = [
  '🛒',
  '🍕',
  '☕',
  '🚗',
  '⛽',
  '🏠',
  '💡',
  '📱',
  '✈️',
  '🎬',
  '💊',
  '🎓',
  '👕',
  '🎮',
  '💰',
  '📊',
  '🏥',
  '🐾',
  '🎁',
  '💳',
  '🏋️',
  '📚',
  '🧾',
  '🔧',
];
