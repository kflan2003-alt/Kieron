import { FoodCategory } from '../types';

const BY_NAME: Record<string, string> = {
  'chicken breast': '🍗',
  'frozen chicken thighs': '🍗',
  salmon: '🐟',
  'greek yoghurt': '🥣',
  spinach: '🥬',
  strawberries: '🍓',
  broccoli: '🥦',
  peppers: '🫑',
  onion: '🧅',
  carrot: '🥕',
  eggs: '🥚',
  milk: '🥛',
  cheese: '🧀',
  'penne pasta': '🍝',
  rice: '🍚',
  wraps: '🫓',
  'frozen peas': '🫛',
  garlic: '🧄',
  'double cream': '🥛',
  'coconut milk': '🥥',
};

const BY_CATEGORY: Record<FoodCategory, string> = {
  fridge: '🧊',
  freezer: '❄️',
  cupboard: '🥫',
  fruit_veg: '🥕',
};

export function foodEmoji(name: string, category: FoodCategory): string {
  return BY_NAME[name.trim().toLowerCase()] ?? BY_CATEGORY[category];
}
