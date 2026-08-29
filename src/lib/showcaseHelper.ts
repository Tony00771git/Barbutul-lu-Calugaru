import { CosmeticRarity, CosmeticItem } from '../types';
import { ALL_CHEST_COSMETICS, RARITY_DEFINITIONS } from '../data/chestsCatalog';
import { SHOP_CATALOG } from '../data/shopCatalog';
import { MEDIEVAL_AVATARS } from '../data/avatars';

export interface ItemRarityScore {
  id: string;
  name: string;
  nameEn: string;
  type: string;
  rarity: CosmeticRarity;
  rarityScore: number;
  icon: string;
  color: string;
  avatarKey?: string;
}

/**
 * Returns a numerical rarity weight for sorting and ranking items.
 */
export function getRarityTierWeight(rarity: CosmeticRarity): number {
  switch (rarity) {
    case 'rareSpecial':
      return 50000;
    case 'covert':
      return 40000;
    case 'classified':
      return 30000;
    case 'restricted':
      return 20000;
    case 'milspec':
    default:
      return 10000;
  }
}

/**
 * Analyzes any item ID and returns its metadata, rarity tier, and calculated score.
 */
export function analyzeItemRarity(itemId: string, language: 'ro' | 'en' = 'ro'): ItemRarityScore | null {
  if (!itemId) return null;
  const isRo = language === 'ro';

  // 1. Check in Chest Cosmetics
  const chestItem = ALL_CHEST_COSMETICS.find((c) => c.id === itemId || c.avatarKey === itemId);
  if (chestItem) {
    const tierWeight = getRarityTierWeight(chestItem.rarity);
    const meta = RARITY_DEFINITIONS[chestItem.rarity] || RARITY_DEFINITIONS.milspec;
    return {
      id: chestItem.id,
      name: isRo ? chestItem.name : chestItem.nameEn || chestItem.name,
      nameEn: chestItem.nameEn || chestItem.name,
      type: chestItem.type,
      rarity: chestItem.rarity,
      rarityScore: tierWeight + (chestItem.exclusiveToChest ? 5000 : 0),
      icon: chestItem.icon,
      color: meta.color,
      avatarKey: chestItem.avatarKey,
    };
  }

  // 2. Check in Shop Catalog
  const shopItem = SHOP_CATALOG.find((s) => s.id === itemId || s.key === itemId || s.avatarKey === itemId);
  if (shopItem) {
    let rarity: CosmeticRarity = 'restricted';
    let baseWeight = 20000;
    if (shopItem.cost >= 600 || shopItem.id.includes('celestial') || shopItem.id.includes('archimandrite')) {
      rarity = 'rareSpecial';
      baseWeight = 50000;
    } else if (shopItem.cost >= 350 || shopItem.id.includes('royal') || shopItem.id.includes('dragon')) {
      rarity = 'classified';
      baseWeight = 30000;
    }
    const meta = RARITY_DEFINITIONS[rarity] || RARITY_DEFINITIONS.classified;
    return {
      id: shopItem.id,
      name: isRo ? shopItem.nameRo : shopItem.nameEn,
      nameEn: shopItem.nameEn,
      type: shopItem.category,
      rarity,
      rarityScore: baseWeight + shopItem.cost,
      icon: shopItem.icon,
      color: meta.color,
      avatarKey: shopItem.avatarKey,
    };
  }

  // 3. Check in Medieval Avatars
  const avatar = MEDIEVAL_AVATARS.find((a) => a.id === itemId);
  if (avatar) {
    let rarity: CosmeticRarity = 'restricted';
    let score = 25000;
    if (avatar.id.includes('archimandrite') || avatar.id.includes('celestial') || avatar.id.includes('pope')) {
      rarity = 'rareSpecial';
      score = 52000;
    } else if (avatar.id.includes('templar') || avatar.id.includes('abbot') || avatar.id.includes('bishop')) {
      rarity = 'covert';
      score = 42000;
    } else if (avatar.id.includes('master') || avatar.id.includes('inquisitor') || avatar.id.includes('brewer')) {
      rarity = 'classified';
      score = 32000;
    }
    const meta = RARITY_DEFINITIONS[rarity] || RARITY_DEFINITIONS.rareSpecial;
    return {
      id: avatar.id,
      name: isRo ? avatar.nameRo : avatar.nameEn,
      nameEn: avatar.nameEn,
      type: 'avatar',
      rarity,
      rarityScore: score,
      icon: '🧙‍♂️',
      color: meta.color,
      avatarKey: avatar.id,
    };
  }

  return null;
}

/**
 * Returns the Top N rarest unique items from an inventory or owned items array.
 * If inventory is small, it gracefully incorporates highest tier medieval avatars.
 */
export function getTopRarestInventoryItems(
  purchasedItemIds: string[] = [],
  limitCount = 3,
  language: 'ro' | 'en' = 'ro'
): string[] {
  const candidateIds = new Set<string>();

  // 1. Add all owned item keys
  (purchasedItemIds || []).forEach((id) => {
    if (id && id.trim()) candidateIds.add(id.trim());
  });

  // 2. Add default / baseline avatars so inventory is never empty
  MEDIEVAL_AVATARS.forEach((av) => {
    candidateIds.add(av.id);
  });

  // 3. Score and sort all candidates
  const scoredItems: Array<{ id: string; score: number }> = [];

  candidateIds.forEach((id) => {
    const analyzed = analyzeItemRarity(id, language);
    if (analyzed) {
      scoredItems.push({
        id: analyzed.id,
        score: analyzed.rarityScore,
      });
    }
  });

  scoredItems.sort((a, b) => b.score - a.score);

  // Return unique top items up to limitCount
  const result: string[] = [];
  for (const item of scoredItems) {
    if (!result.includes(item.id)) {
      result.push(item.id);
      if (result.length >= limitCount) break;
    }
  }

  return result;
}

/**
 * Resolves the 3 showcase items for a profile.
 * If profile already has 3 custom chosen items, preserves them.
 * If any slots are empty, automatically fills them with the user's rarest items!
 */
export function getResolvedProfileShowcase(
  profileShowcasedIds?: string[],
  purchasedItemIds: string[] = [],
  language: 'ro' | 'en' = 'ro'
): string[] {
  const existing = (profileShowcasedIds || []).filter((id) => Boolean(id && id.trim()));
  if (existing.length >= 3) {
    return existing.slice(0, 3);
  }

  const rarest = getTopRarestInventoryItems(purchasedItemIds, 6, language);
  const combined = [...existing];

  for (const rId of rarest) {
    if (!combined.includes(rId)) {
      combined.push(rId);
      if (combined.length >= 3) break;
    }
  }

  return combined.slice(0, 3);
}
