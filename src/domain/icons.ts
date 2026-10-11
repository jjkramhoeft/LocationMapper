/** Curated Lucide icons available for pins, by kebab-case name (stored in JSON). */
export const ICON_NAMES = [
  'map-pin', 'house', 'building', 'building-2', 'hotel', 'tent',
  'plane', 'train-front', 'car', 'ship', 'sailboat', 'bike',
  'mountain', 'mountain-snow', 'tree-pine', 'tree-palm', 'waves', 'sun', 'umbrella',
  'briefcase', 'graduation-cap', 'school', 'landmark', 'church', 'castle', 'hospital',
  'users', 'user', 'heart', 'baby', 'dog',
  'star', 'flag', 'camera', 'compass', 'anchor', 'gem', 'trophy',
  'utensils', 'coffee', 'wine', 'beer', 'music', 'ticket', 'shopping-bag', 'dumbbell', 'book-open',
] as const

export type IconName = (typeof ICON_NAMES)[number]

const ICON_SET: ReadonlySet<string> = new Set(ICON_NAMES)

export function isIconName(value: unknown): value is IconName {
  return typeof value === 'string' && ICON_SET.has(value)
}

export const FALLBACK_ICON: IconName = 'map-pin'
