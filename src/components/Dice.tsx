import React, { useState, useEffect } from 'react';
import { DiceSkin } from '../types';
import { useApp } from '../context/AppContext';

export interface DieVisualConfig {
  nameRo: string;
  nameEn: string;
  rarity: 'Standard' | 'Rar' | 'Epic' | 'Legendar' | 'Mistic' | 'Exclusiv';
  // Background gradient and base material
  bgGradient: string;
  // Outer frame styling, border & shadows for 3D bevels (physical depth, reduced outer glow)
  boxShadow: string;
  innerBorder: string;
  // Corner brackets / rivets style
  cornerBracketColor: string;
  cornerType: 'rivet' | 'filigree' | 'rune' | 'gem' | 'claw' | 'star' | 'none';
  // Pip styling
  pipGradient: string;
  pipBorder: string;
  pipShadow: string;
  // Optional surface overlay texture description
  textureType:
    | 'gold_sheen'
    | 'bone_grain'
    | 'wood_rings'
    | 'ruby_facet'
    | 'frost_lattice'
    | 'obsidian_runes'
    | 'amethyst_geode'
    | 'dragon_scale'
    | 'celestial_rays'
    | 'jade_swirl'
    | 'void_stars'
    | 'magma_cracks'
    | 'copper_patina'
    | 'granite_fleck'
    | 'plasma_arc'
    | 'spectral_mist';
  // Center emblem icon for roll = 1
  aceIcon: string;
  aceLabel: string;
  glowColor: string;
}

export const DICE_SKIN_CONFIGS: Record<string, DieVisualConfig> = {
  // ==========================================
  // STANDARD (No/Minimal glow, Realistic materials)
  // ==========================================
  gold: {
    nameRo: 'Aur Lucios',
    nameEn: 'Polished Gold',
    rarity: 'Standard',
    bgGradient:
      'linear-gradient(145deg, #fff7bd 0%, #f6d155 18%, #d49e1e 48%, #996c0d 82%, #5c3c04 100%)',
    boxShadow:
      'inset 2px 2px 2px rgba(255,255,255,0.85), inset -2px -2px 3px rgba(60,35,4,0.9), 0 4px 10px rgba(0,0,0,0.6)',
    innerBorder: 'border-yellow-100/70',
    cornerBracketColor: '#5c3c04',
    cornerType: 'filigree',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #4a2800 0%, #291200 70%, #0d0400 100%)',
    pipBorder: 'border border-amber-500/40',
    pipShadow:
      'shadow-[inset_0_2px_3px_rgba(0,0,0,0.95),0_1px_1px_rgba(255,245,180,0.3)]',
    textureType: 'gold_sheen',
    aceIcon: '👑',
    aceLabel: 'Crown',
    glowColor: 'rgba(212,158,30,0.15)',
  },
  bone: {
    nameRo: 'Os Străvechi',
    nameEn: 'Ancient Bone',
    rarity: 'Standard',
    bgGradient:
      'linear-gradient(140deg, #fbf7ee 0%, #ebe2ce 25%, #ded0b7 60%, #baa687 100%)',
    boxShadow:
      'inset 2px 2px 2px rgba(255,255,255,0.9), inset -2px -2px 3px rgba(70,58,44,0.65), 0 4px 10px rgba(0,0,0,0.5)',
    innerBorder: 'border-[#dfd3bf]',
    cornerBracketColor: '#8a7761',
    cornerType: 'none',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #2c2217 0%, #150f09 75%, #050302 100%)',
    pipBorder: 'border border-[#8f7d67]/50',
    pipShadow:
      'shadow-[inset_0_2px_3px_rgba(0,0,0,0.95),0_1px_1px_rgba(255,255,255,0.4)]',
    textureType: 'bone_grain',
    aceIcon: '💀',
    aceLabel: 'Skull',
    glowColor: 'rgba(0,0,0,0)',
  },
  wood: {
    nameRo: 'Lemn de Stejar',
    nameEn: 'Carved Oak',
    rarity: 'Standard',
    bgGradient:
      'linear-gradient(135deg, #a66a38 0%, #7d441c 30%, #522709 70%, #301302 100%)',
    boxShadow:
      'inset 2px 2px 2px rgba(255,205,155,0.5), inset -2px -2px 3px rgba(18,7,1,0.95), 0 4px 10px rgba(0,0,0,0.6)',
    innerBorder: 'border-[#b87c4a]/50',
    cornerBracketColor: '#2b1204',
    cornerType: 'rivet',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #fef3c7 0%, #f59e0b 45%, #92400e 85%, #451a03 100%)',
    pipBorder: 'border border-amber-950/70',
    pipShadow:
      'shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7),0_1.5px_2px_rgba(0,0,0,0.85)]',
    textureType: 'wood_rings',
    aceIcon: '🍺',
    aceLabel: 'Ale Mug',
    glowColor: 'rgba(0,0,0,0)',
  },
  tavern_oak: {
    nameRo: 'Stejar de Tavernă',
    nameEn: 'Tavern Oak',
    rarity: 'Standard',
    bgGradient:
      'linear-gradient(135deg, #8c531b 0%, #5c300a 35%, #381a03 70%, #170801 100%)',
    boxShadow:
      'inset 2px 2px 2px rgba(230,170,110,0.4), inset -2px -2px 3px rgba(10,3,0,0.95), 0 4px 10px rgba(0,0,0,0.65)',
    innerBorder: 'border-amber-700/50',
    cornerBracketColor: '#b45309',
    cornerType: 'rivet',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #fef3c7 0%, #fde68a 35%, #b45309 80%, #3f1903 100%)',
    pipBorder: 'border border-amber-900/60',
    pipShadow:
      'shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),0_1.5px_2px_rgba(0,0,0,0.9)]',
    textureType: 'wood_rings',
    aceIcon: '🍷',
    aceLabel: 'Tavern Chalice',
    glowColor: 'rgba(0,0,0,0)',
  },
  copper: {
    nameRo: 'Cupru Patinat',
    nameEn: 'Weathered Copper',
    rarity: 'Standard',
    bgGradient:
      'linear-gradient(135deg, #d97706 0%, #9a4808 30%, #3a5c4d 70%, #152d22 100%)',
    boxShadow:
      'inset 2px 2px 2px rgba(254,215,140,0.55), inset -2px -2px 3px rgba(10,25,18,0.9), 0 4px 10px rgba(0,0,0,0.55)',
    innerBorder: 'border-[#5eead4]/40',
    cornerBracketColor: '#14b8a6',
    cornerType: 'rivet',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ccfbf1 0%, #5eead4 40%, #0f766e 85%, #042f2e 100%)',
    pipBorder: 'border border-teal-200/50',
    pipShadow:
      'shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7),0_1.5px_2px_rgba(0,0,0,0.85)]',
    textureType: 'copper_patina',
    aceIcon: '🪙',
    aceLabel: 'Ancient Coin',
    glowColor: 'rgba(45,212,191,0.15)',
  },
  granite: {
    nameRo: 'Granit Monahal',
    nameEn: 'Monastic Granite',
    rarity: 'Standard',
    bgGradient:
      'linear-gradient(135deg, #9ca3af 0%, #6b7280 35%, #374151 70%, #181c24 100%)',
    boxShadow:
      'inset 2px 2px 2px rgba(243,244,246,0.6), inset -2px -2px 3px rgba(10,12,16,0.9), 0 4px 10px rgba(0,0,0,0.6)',
    innerBorder: 'border-zinc-400/50',
    cornerBracketColor: '#d1d5db',
    cornerType: 'rivet',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #f3f4f6 0%, #9ca3af 45%, #374151 85%, #111827 100%)',
    pipBorder: 'border border-zinc-400/60',
    pipShadow:
      'shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7),0_1.5px_2px_rgba(0,0,0,0.9)]',
    textureType: 'granite_fleck',
    aceIcon: '🪨',
    aceLabel: 'Monolith',
    glowColor: 'rgba(0,0,0,0)',
  },

  // ==========================================
  // RAR (Subtle edge contour, deep mineral refraction/cracks)
  // ==========================================
  ruby: {
    nameRo: 'Rubin Sângeriu',
    nameEn: 'Blood Ruby',
    rarity: 'Rar',
    bgGradient:
      'linear-gradient(135deg, #f87171 0%, #b91c1c 25%, #7f1d1d 65%, #350505 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(254,202,202,0.85), inset -2px -2px 3px rgba(45,3,3,0.95), 0 0 6px rgba(220,38,38,0.35), 0 4px 10px rgba(0,0,0,0.65)',
    innerBorder: 'border-[#fca5a5]/60',
    cornerBracketColor: '#fecaca',
    cornerType: 'gem',
    pipGradient:
      'radial-gradient(circle at 30% 30%, #ffffff 0%, #ffe4e6 35%, #fda4af 70%, #e11d48 100%)',
    pipBorder: 'border border-white/80',
    pipShadow:
      'shadow-[0_0_4px_rgba(255,255,255,0.7),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'ruby_facet',
    aceIcon: '💎',
    aceLabel: 'Ruby Gem',
    glowColor: 'rgba(220,38,38,0.35)',
  },
  ice: {
    nameRo: 'Gheață Eternă',
    nameEn: 'Glacial Frost',
    rarity: 'Rar',
    bgGradient:
      'linear-gradient(135deg, #e0f2fe 0%, #60a5fa 30%, #0369a1 70%, #082f49 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(255,255,255,0.95), inset -2px -2px 3px rgba(6,35,55,0.9), 0 0 6px rgba(56,189,248,0.35), 0 4px 10px rgba(0,0,0,0.55)',
    innerBorder: 'border-white/80',
    cornerBracketColor: '#bae6fd',
    cornerType: 'gem',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ffffff 0%, #e0f2fe 40%, #38bdf8 75%, #0284c7 100%)',
    pipBorder: 'border border-cyan-100/90',
    pipShadow:
      'shadow-[0_0_4px_rgba(224,242,254,0.7),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'frost_lattice',
    aceIcon: '❄️',
    aceLabel: 'Snowflake',
    glowColor: 'rgba(56,189,248,0.35)',
  },
  emerald_jade: {
    nameRo: 'Jad Smarald',
    nameEn: 'Emerald Jade',
    rarity: 'Rar',
    bgGradient:
      'linear-gradient(135deg, #6ee7b7 0%, #059669 30%, #047857 70%, #022c22 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(209,250,229,0.8), inset -2px -2px 3px rgba(2,44,34,0.9), 0 0 6px rgba(16,185,129,0.35), 0 4px 10px rgba(0,0,0,0.6)',
    innerBorder: 'border-emerald-200/70',
    cornerBracketColor: '#a7f3d0',
    cornerType: 'gem',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ffffff 0%, #d1fae5 40%, #34d399 75%, #047857 100%)',
    pipBorder: 'border border-emerald-100',
    pipShadow:
      'shadow-[0_0_4px_rgba(110,231,183,0.7),inset_0_1px_2px_rgba(255,255,255,0.8)]',
    textureType: 'jade_swirl',
    aceIcon: '💚',
    aceLabel: 'Jade Heart',
    glowColor: 'rgba(16,185,129,0.35)',
  },

  // ==========================================
  // EPIC (Glow strictly focused on engravings/crystals/scales)
  // ==========================================
  obsidian: {
    nameRo: 'Obsidian Runic',
    nameEn: 'Runic Obsidian',
    rarity: 'Epic',
    bgGradient:
      'linear-gradient(135deg, #2e1065 0%, #17072b 30%, #090212 70%, #020005 100%)',
    boxShadow:
      'inset 2px 2px 2px rgba(232,121,249,0.4), inset -2px -2px 3px rgba(0,0,0,0.98), 0 0 7px rgba(168,85,247,0.35), 0 4px 12px rgba(0,0,0,0.8)',
    innerBorder: 'border-[#c084fc]/40',
    cornerBracketColor: '#c084fc',
    cornerType: 'rune',
    pipGradient:
      'radial-gradient(circle at 30% 30%, #fae8ff 0%, #e879f9 35%, #a855f7 70%, #581c87 100%)',
    pipBorder: 'border border-fuchsia-300/80',
    pipShadow:
      'shadow-[0_0_6px_rgba(217,70,239,0.8),inset_0_1px_2px_rgba(255,255,255,0.8)]',
    textureType: 'obsidian_runes',
    aceIcon: '👁️',
    aceLabel: 'Arcane Eye',
    glowColor: 'rgba(168,85,247,0.35)',
  },
  amethyst: {
    nameRo: 'Ametist Regal',
    nameEn: 'Royal Amethyst',
    rarity: 'Epic',
    bgGradient:
      'linear-gradient(135deg, #d8b4fe 0%, #9333ea 30%, #581c87 70%, #2e0854 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(255,255,255,0.7), inset -2px -2px 3px rgba(25,3,45,0.95), 0 0 7px rgba(147,51,234,0.35), 0 4px 10px rgba(0,0,0,0.65)',
    innerBorder: 'border-purple-200/60',
    cornerBracketColor: '#f3e8ff',
    cornerType: 'gem',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ffffff 0%, #f3e8ff 40%, #c084fc 75%, #7e22ce 100%)',
    pipBorder: 'border border-white/90',
    pipShadow:
      'shadow-[0_0_5px_rgba(233,213,255,0.8),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'amethyst_geode',
    aceIcon: '🔮',
    aceLabel: 'Geode Crystal',
    glowColor: 'rgba(147,51,234,0.35)',
  },
  emerald_hydra: {
    nameRo: 'Hidra de Smarald',
    nameEn: 'Emerald Hydra',
    rarity: 'Epic',
    bgGradient:
      'linear-gradient(135deg, #34d399 0%, #059669 30%, #064e3b 70%, #022c22 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(167,243,208,0.7), inset -2px -2px 3px rgba(2,44,34,0.95), 0 0 7px rgba(5,150,105,0.35), 0 4px 10px rgba(0,0,0,0.65)',
    innerBorder: 'border-emerald-300/50',
    cornerBracketColor: '#6ee7b7',
    cornerType: 'claw',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ffffff 0%, #a7f3d0 35%, #10b981 70%, #064e3b 100%)',
    pipBorder: 'border border-emerald-200',
    pipShadow:
      'shadow-[0_0_6px_rgba(16,185,129,0.8),inset_0_1px_2px_rgba(255,255,255,0.8)]',
    textureType: 'dragon_scale',
    aceIcon: '🐍',
    aceLabel: 'Hydra Brood',
    glowColor: 'rgba(16,185,129,0.35)',
  },
  plasma_pink: {
    nameRo: 'Plasmă Spectrală',
    nameEn: 'Spectral Plasma',
    rarity: 'Epic',
    bgGradient:
      'linear-gradient(135deg, #f472b6 0%, #db2777 30%, #831843 70%, #350518 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(253,242,248,0.7), inset -2px -2px 3px rgba(35,0,20,0.9), 0 0 7px rgba(236,72,153,0.35), 0 4px 10px rgba(0,0,0,0.7)',
    innerBorder: 'border-pink-300/60',
    cornerBracketColor: '#fbcfe8',
    cornerType: 'star',
    pipGradient:
      'radial-gradient(circle at 30% 30%, #ffffff 0%, #fce7f3 35%, #f43f5e 75%, #881337 100%)',
    pipBorder: 'border border-pink-100',
    pipShadow:
      'shadow-[0_0_6px_rgba(244,114,182,0.8),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'plasma_arc',
    aceIcon: '💖',
    aceLabel: 'Plasma Spark',
    glowColor: 'rgba(236,72,153,0.35)',
  },

  // ==========================================
  // LEGENDAR (Dragon scales + glowing fissures/cracks/incandescent veins)
  // ==========================================
  crimson_dragon: {
    nameRo: 'Solzi de Dragon Roșu',
    nameEn: 'Crimson Dragonscale',
    rarity: 'Legendar',
    bgGradient:
      'linear-gradient(135deg, #ef4444 0%, #b91c1c 25%, #580d0d 65%, #200303 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(254,202,202,0.75), inset -2px -2px 3px rgba(20,2,2,0.98), 0 0 8px rgba(220,38,38,0.45), 0 5px 12px rgba(0,0,0,0.75)',
    innerBorder: 'border-amber-400/50',
    cornerBracketColor: '#fef08a',
    cornerType: 'claw',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ffffff 0%, #fef08a 35%, #eab308 70%, #b45309 100%)',
    pipBorder: 'border border-yellow-200',
    pipShadow:
      'shadow-[0_0_6px_rgba(254,240,138,0.8),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'dragon_scale',
    aceIcon: '🐉',
    aceLabel: 'Dragon Crest',
    glowColor: 'rgba(239,68,68,0.45)',
  },
  bloodfire: {
    nameRo: 'Focul Dragonului de Sânge',
    nameEn: 'Bloodfire Dragon',
    rarity: 'Legendar',
    bgGradient:
      'linear-gradient(135deg, #f87171 0%, #dc2626 25%, #7f1d1d 65%, #200108 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(254,202,202,0.75), inset -2px -2px 3px rgba(15,0,4,0.98), 0 0 8px rgba(225,29,72,0.45), 0 5px 12px rgba(0,0,0,0.75)',
    innerBorder: 'border-rose-400/50',
    cornerBracketColor: '#fbbf24',
    cornerType: 'claw',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ffffff 0%, #fef08a 35%, #f43f5e 70%, #881337 100%)',
    pipBorder: 'border border-yellow-200',
    pipShadow:
      'shadow-[0_0_6px_rgba(244,63,94,0.8),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'dragon_scale',
    aceIcon: '🔥',
    aceLabel: 'Blood Flame',
    glowColor: 'rgba(225,29,72,0.45)',
  },
  infernal_ember: {
    nameRo: 'Foc Infernal',
    nameEn: 'Infernal Ember',
    rarity: 'Legendar',
    bgGradient:
      'linear-gradient(135deg, #c2410c 0%, #7c2d12 25%, #3c1205 65%, #150401 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(254,215,170,0.65), inset -2px -2px 3px rgba(20,3,0,0.98), 0 0 8px rgba(234,88,12,0.45), 0 5px 12px rgba(0,0,0,0.75)',
    innerBorder: 'border-orange-500/50',
    cornerBracketColor: '#fde047',
    cornerType: 'rune',
    pipGradient:
      'radial-gradient(circle at 30% 30%, #ffffff 0%, #fef08a 30%, #f97316 70%, #9a3412 100%)',
    pipBorder: 'border border-yellow-300',
    pipShadow:
      'shadow-[0_0_7px_rgba(251,146,60,0.85),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'magma_cracks',
    aceIcon: '🔥',
    aceLabel: 'Blazing Core',
    glowColor: 'rgba(234,88,12,0.45)',
  },

  // ==========================================
  // MISTIC (Deep cosmic nebula / Divine angelic engravings)
  // ==========================================
  void_cosmic: {
    nameRo: 'Vid Cosmic',
    nameEn: 'Cosmic Void',
    rarity: 'Mistic',
    bgGradient:
      'linear-gradient(135deg, #1e1b4b 0%, #0f172a 35%, #050b14 70%, #010409 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(56,189,248,0.6), inset -2px -2px 3px rgba(0,0,0,0.98), 0 0 10px rgba(56,189,248,0.4), 0 5px 14px rgba(0,0,0,0.85)',
    innerBorder: 'border-cyan-400/50',
    cornerBracketColor: '#38bdf8',
    cornerType: 'star',
    pipGradient:
      'radial-gradient(circle at 30% 30%, #ffffff 0%, #7dd3fc 35%, #0284c7 75%, #0369a1 100%)',
    pipBorder: 'border border-cyan-200',
    pipShadow:
      'shadow-[0_0_8px_rgba(56,189,248,0.85),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'void_stars',
    aceIcon: '🌌',
    aceLabel: 'Cosmic Nebula',
    glowColor: 'rgba(56,189,248,0.4)',
  },
  celestial_gold: {
    nameRo: 'Aur Celest',
    nameEn: 'Celestial Gold',
    rarity: 'Mistic',
    bgGradient:
      'linear-gradient(135deg, #ffffff 0%, #fef08a 25%, #eab308 55%, #a16207 85%, #583303 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(255,255,255,0.95), inset -2px -2px 3px rgba(80,40,2,0.9), 0 0 10px rgba(234,179,8,0.4), 0 5px 14px rgba(0,0,0,0.6)',
    innerBorder: 'border-white',
    cornerBracketColor: '#ffffff',
    cornerType: 'star',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ffffff 0%, #fef9c3 30%, #ca8a04 75%, #713f12 100%)',
    pipBorder: 'border border-amber-100',
    pipShadow:
      'shadow-[0_0_7px_rgba(255,255,255,0.85),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'celestial_rays',
    aceIcon: '⭐',
    aceLabel: 'Divine Star',
    glowColor: 'rgba(234,179,8,0.4)',
  },
  imperial_gold: {
    nameRo: 'Aur Imperial & Smarald',
    nameEn: 'Imperial Gold & Emerald',
    rarity: 'Mistic',
    bgGradient:
      'linear-gradient(135deg, #ffffff 0%, #fef08a 20%, #d97706 50%, #047857 85%, #022c22 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(255,255,255,0.95), inset -2px -2px 3px rgba(2,44,34,0.9), 0 0 10px rgba(234,179,8,0.4), 0 5px 14px rgba(0,0,0,0.65)',
    innerBorder: 'border-yellow-200',
    cornerBracketColor: '#ffffff',
    cornerType: 'filigree',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ffffff 0%, #d1fae5 35%, #059669 75%, #022c22 100%)',
    pipBorder: 'border border-emerald-200',
    pipShadow:
      'shadow-[0_0_7px_rgba(52,211,153,0.85),inset_0_1px_2px_rgba(255,255,255,0.9)]',
    textureType: 'celestial_rays',
    aceIcon: '👑',
    aceLabel: 'Imperial Sovereign',
    glowColor: 'rgba(234,179,8,0.4)',
  },

  // ==========================================
  // EXCLUSIV CUFĂR (Ghostly misty jade, calm inner natural luminescence)
  // ==========================================
  spectral_jade: {
    nameRo: 'Jad Spectral',
    nameEn: 'Spectral Jade',
    rarity: 'Exclusiv',
    bgGradient:
      'linear-gradient(135deg, #a7f3d0 0%, #059669 30%, #047857 70%, #022c22 100%)',
    boxShadow:
      'inset 2px 2px 3px rgba(209,250,229,0.85), inset -2px -2px 3px rgba(2,44,34,0.9), 0 0 6px rgba(16,185,129,0.3), 0 4px 12px rgba(0,0,0,0.65)',
    innerBorder: 'border-emerald-200/65',
    cornerBracketColor: '#d1fae5',
    cornerType: 'filigree',
    pipGradient:
      'radial-gradient(circle at 35% 35%, #ffffff 0%, #ecfdf5 40%, #6ee7b7 75%, #059669 100%)',
    pipBorder: 'border border-emerald-100',
    pipShadow:
      'shadow-[0_0_5px_rgba(110,231,183,0.7),inset_0_1px_2px_rgba(255,255,255,0.8)]',
    textureType: 'spectral_mist',
    aceIcon: '🐍',
    aceLabel: 'Jade Serpent',
    glowColor: 'rgba(16,185,129,0.3)',
  },
};

export const getDieSkinConfig = (skin?: string): DieVisualConfig => {
  if (skin && DICE_SKIN_CONFIGS[skin]) {
    return DICE_SKIN_CONFIGS[skin];
  }
  return DICE_SKIN_CONFIGS.gold;
};

// =========================================================================
// HIGH-FIDELITY VECTOR MATERIAL & TEXTURE OVERLAY ENGINE
// =========================================================================
const DieTextureOverlay: React.FC<{ type: DieVisualConfig['textureType'] }> = ({ type }) => {
  switch (type) {
    case 'gold_sheen':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Subtle brushed metal micro-texture */}
          <div
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(255,255,255,0.4) 0px, transparent 1px, transparent 3px, rgba(0,0,0,0.3) 4px)',
            }}
          />
          {/* Beveled light catch */}
          <div
            className="absolute inset-0 opacity-40 mix-blend-screen"
            style={{
              background:
                'radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.8) 0%, transparent 50%)',
            }}
          />
        </div>
      );

    case 'bone_grain':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Organic porous bone speckles & hairline micro-fissures */}
          <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-multiply" xmlns="http://www.w3.org/2000/svg">
            <filter id="bone-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="0.33 0 0 0 0  0 0.3 0 0 0  0 0 0.25 0 0  0 0 0 0.7 0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#bone-noise)" />
            {/* Fine aged bone hairline crack */}
            <path d="M 12 10 Q 18 22 26 28 T 38 42" stroke="rgba(100,80,60,0.35)" strokeWidth="0.7" fill="none" />
            <path d="M 50 15 Q 44 26 48 38" stroke="rgba(100,80,60,0.25)" strokeWidth="0.5" fill="none" />
          </svg>
        </div>
      );

    case 'wood_rings':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Natural oak grain rings & wood pores */}
          <div
            className="absolute inset-0 opacity-45 mix-blend-overlay"
            style={{
              backgroundImage:
                'repeating-radial-gradient(ellipse at 15% 15%, transparent 0, transparent 4px, rgba(0,0,0,0.45) 5px, rgba(255,255,255,0.15) 6px, transparent 7px)',
            }}
          />
          {/* Wood fibers along vertical axis */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-multiply"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent 0, transparent 2px, rgba(40,15,0,0.4) 3px, transparent 4px)',
            }}
          />
        </div>
      );

    case 'copper_patina':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Hammered metal sheen */}
          <div
            className="absolute inset-0 opacity-35 mix-blend-overlay"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.3) 0px, transparent 2px, rgba(0,0,0,0.3) 4px)',
            }}
          />
          {/* Verdigris turquoise oxidation clusters in corners */}
          <svg className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="6" fill="rgba(45,212,191,0.5)" filter="blur(2px)" />
            <circle cx="56" cy="56" r="8" fill="rgba(45,212,191,0.55)" filter="blur(2px)" />
            <circle cx="56" cy="10" r="5" fill="rgba(20,184,166,0.4)" filter="blur(2px)" />
          </svg>
        </div>
      );

    case 'granite_fleck':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Stone flecks & quartz minerals */}
          <svg className="absolute inset-0 w-full h-full opacity-55 mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
            <filter id="granite-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
              <feColorMatrix type="matrix" values="0.5 0 0 0 0  0 0.5 0 0 0  0 0 0.5 0 0  0 0 0 1 0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#granite-noise)" />
          </svg>
          {/* Chiseled bevel highlights */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-screen"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 40%, rgba(0,0,0,0.5) 100%)',
            }}
          />
        </div>
      );

    case 'ruby_facet':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Geometric crystal facets & internal light refraction planes */}
          <svg className="absolute inset-0 w-full h-full opacity-45 mix-blend-screen" viewBox="0 0 100 100">
            <polygon points="0,0 50,20 20,50" fill="rgba(255,255,255,0.35)" />
            <polygon points="50,20 100,0 80,50" fill="rgba(255,100,100,0.25)" />
            <polygon points="20,50 50,80 0,100" fill="rgba(150,0,0,0.35)" />
            <polygon points="80,50 100,100 50,80" fill="rgba(255,200,200,0.4)" />
            <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="rgba(255,200,200,0.3)" strokeWidth="0.8" />
          </svg>
          {/* Sharp specular vertex highlight */}
          <div
            className="absolute top-2 left-2 w-3 h-3 rounded-full opacity-70 mix-blend-screen"
            style={{
              background: 'radial-gradient(circle, #fff 0%, rgba(255,255,255,0) 70%)',
            }}
          />
        </div>
      );

    case 'frost_lattice':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Glacial fracture lines and trapped ice fissures */}
          <svg className="absolute inset-0 w-full h-full opacity-65 mix-blend-screen" viewBox="0 0 100 100">
            <path
              d="M 10 15 L 35 30 L 45 60 L 25 85 M 35 30 L 70 25 L 85 45 L 60 75 M 70 25 L 90 10"
              stroke="rgba(224,242,254,0.75)"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 45 60 L 75 68 L 88 90"
              stroke="rgba(186,230,253,0.6)"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          {/* Frosted edges */}
          <div
            className="absolute inset-0 opacity-40 mix-blend-screen"
            style={{
              background:
                'radial-gradient(circle at center, transparent 40%, rgba(224,242,254,0.5) 100%)',
            }}
          />
        </div>
      );

    case 'obsidian_runes':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Ultra-glossy volcanic glass reflection sweep */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-screen"
            style={{
              background:
                'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0.2) 50%, transparent 65%)',
            }}
          />
          {/* Arcane engraved runes glowing strictly from the engravings */}
          <svg className="absolute inset-0 w-full h-full opacity-75 mix-blend-screen" viewBox="0 0 100 100">
            <g stroke="#e879f9" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.85">
              {/* Rune 1 - Top Left */}
              <path d="M 12 12 L 12 24 M 12 14 L 18 18 L 12 22" />
              {/* Rune 2 - Bottom Right */}
              <path d="M 88 88 L 88 76 M 88 86 L 82 82 L 88 78" />
              {/* Arcane subtle rune accent */}
              <circle cx="86" cy="16" r="2" fill="#c084fc" />
              <circle cx="14" cy="84" r="2" fill="#c084fc" />
            </g>
          </svg>
        </div>
      );

    case 'amethyst_geode':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Crystalline quartz geometry planes */}
          <svg className="absolute inset-0 w-full h-full opacity-45 mix-blend-screen" viewBox="0 0 100 100">
            <polygon points="10,20 40,10 60,35 30,50" fill="rgba(233,213,255,0.4)" />
            <polygon points="60,35 90,20 85,60 55,75" fill="rgba(192,132,252,0.3)" />
            <polygon points="30,50 55,75 35,90 10,70" fill="rgba(243,232,255,0.35)" />
            <line x1="40" y1="10" x2="55" y2="75" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          </svg>
        </div>
      );

    case 'dragon_scale':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Overlapping reptilian dragon scales with light ridges */}
          <svg className="absolute inset-0 w-full h-full opacity-45 mix-blend-overlay" viewBox="0 0 100 100">
            <pattern id="dragon-scales" width="16" height="16" patternUnits="userSpaceOnUse">
              <path
                d="M 0 8 Q 8 0 16 8 Q 8 16 0 8 Z"
                fill="rgba(255,255,255,0.25)"
                stroke="rgba(0,0,0,0.6)"
                strokeWidth="0.8"
              />
              <path
                d="M 8 0 Q 16 -8 24 0 Q 16 8 8 0 Z"
                fill="rgba(255,255,255,0.18)"
                stroke="rgba(0,0,0,0.6)"
                strokeWidth="0.8"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dragon-scales)" />
          </svg>
          {/* Dragon claw scratch accent */}
          <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen" viewBox="0 0 100 100">
            <path
              d="M 20 15 Q 35 40 40 85 M 30 12 Q 45 42 50 88 M 40 18 Q 55 45 60 82"
              stroke="rgba(254,240,138,0.7)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    case 'magma_cracks':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Cooled basalt rock crust with incandescent magma fissures */}
          <svg className="absolute inset-0 w-full h-full opacity-85 mix-blend-screen" viewBox="0 0 100 100">
            {/* Glowing lava crack paths */}
            <path
              d="M 5 25 L 30 40 L 45 35 L 70 65 L 95 60"
              stroke="#fb923c"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 5 25 L 30 40 L 45 35 L 70 65 L 95 60"
              stroke="#fef08a"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Branch fissure */}
            <path
              d="M 45 35 L 55 15 L 80 10"
              stroke="#ea580c"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 45 35 L 55 15 L 80 10"
              stroke="#fef08a"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 30 40 L 25 70 L 15 90"
              stroke="#ea580c"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    case 'void_stars':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Cosmic starry nebula & pinhole stars */}
          <svg className="absolute inset-0 w-full h-full opacity-80 mix-blend-screen" viewBox="0 0 100 100">
            {/* Nebula gas glow */}
            <circle cx="35" cy="40" r="25" fill="rgba(56,189,248,0.25)" filter="blur(6px)" />
            <circle cx="70" cy="65" r="20" fill="rgba(168,85,247,0.25)" filter="blur(6px)" />
            {/* Twinkling micro-stars */}
            <circle cx="20" cy="20" r="1" fill="#fff" />
            <circle cx="80" cy="30" r="1.2" fill="#fff" />
            <circle cx="45" cy="75" r="1" fill="#fff" />
            <circle cx="65" cy="18" r="0.8" fill="#7dd3fc" />
            <circle cx="15" cy="60" r="0.8" fill="#e0f2fe" />
            <circle cx="85" cy="80" r="1" fill="#fff" />
            <polygon points="50,30 52,35 57,35 53,38 55,43 50,40 45,43 47,38 43,35 48,35" fill="rgba(255,255,255,0.7)" transform="scale(0.5) translate(40, 20)" />
          </svg>
        </div>
      );

    case 'celestial_rays':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Engraved angelic wing feathers & halo sacred geometry */}
          <svg className="absolute inset-0 w-full h-full opacity-45 mix-blend-overlay" viewBox="0 0 100 100">
            {/* Angelic wing feather curve */}
            <path
              d="M 15 85 C 25 50 50 30 85 20 C 65 45 50 70 30 90 Z"
              fill="rgba(255,255,255,0.3)"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="0.8"
            />
            {/* Subtle halo rays */}
            <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
            <line x1="50" y1="50" x2="80" y2="25" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
            <line x1="50" y1="50" x2="20" y2="25" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
          </svg>
        </div>
      );

    case 'spectral_mist':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Ethereal ghost vapors trapped in jade */}
          <svg className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen" viewBox="0 0 100 100">
            <path
              d="M 10 30 Q 35 15 50 40 T 90 35 Q 75 75 50 65 T 15 75 Z"
              fill="rgba(167,243,208,0.3)"
              filter="blur(4px)"
            />
            <path
              d="M 25 60 Q 55 45 75 70"
              stroke="rgba(209,250,229,0.6)"
              strokeWidth="1.5"
              fill="none"
              filter="blur(1px)"
            />
          </svg>
        </div>
      );

    case 'plasma_arc':
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Arcane lightning / plasma filaments */}
          <svg className="absolute inset-0 w-full h-full opacity-70 mix-blend-screen" viewBox="0 0 100 100">
            <path
              d="M 15 15 L 35 45 L 25 50 L 55 85 M 35 45 L 75 35 L 85 65"
              stroke="#f472b6"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 15 15 L 35 45 L 25 50 L 55 85"
              stroke="#ffffff"
              strokeWidth="0.7"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    case 'jade_swirl':
    default:
      return (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          {/* Translucent mineral swirls */}
          <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-overlay" viewBox="0 0 100 100">
            <path
              d="M 0 50 Q 50 10 100 50 Q 50 90 0 50 Z"
              fill="rgba(255,255,255,0.25)"
              filter="blur(3px)"
            />
          </svg>
        </div>
      );
  }
};

// =========================================================================
// CORNER ACCENTS (Rivets, Filigree, Runes, Claws, Gems, Stars)
// =========================================================================
const DieCornerAccents: React.FC<{
  type: DieVisualConfig['cornerType'];
  color: string;
  size: 'sm' | 'md' | 'lg';
}> = ({ type, color, size }) => {
  if (type === 'none') return null;

  const s = size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const posClasses = [
    'top-1 left-1',
    'top-1 right-1',
    'bottom-1 left-1',
    'bottom-1 right-1',
  ];

  if (type === 'rivet') {
    return (
      <>
        {posClasses.map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} ${s} rounded-full border border-black/60 shadow-[0_1px_1px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.5)] pointer-events-none z-10`}
            style={{ backgroundColor: color }}
          />
        ))}
      </>
    );
  }

  if (type === 'filigree' || type === 'gem' || type === 'claw') {
    return (
      <>
        {posClasses.map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} ${s} rotate-45 border border-black/40 shadow-[0_1px_2px_rgba(0,0,0,0.6)] pointer-events-none z-10`}
            style={{ backgroundColor: color }}
          />
        ))}
      </>
    );
  }

  if (type === 'star') {
    return (
      <>
        {posClasses.map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} ${s} rounded-full bg-white shadow-[0_0_2px_#fff] pointer-events-none z-10`}
          />
        ))}
      </>
    );
  }

  // Rune
  return (
    <>
      {posClasses.map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} ${s} rounded-xs opacity-70 pointer-events-none z-10 shadow-[0_0_2px_${color}]`}
          style={{ backgroundColor: color }}
        />
      ))}
    </>
  );
};

// =========================================================================
// SINGLE DIE FACE RENDERER (Photorealistic materials, 3D relief, custom pips)
// =========================================================================
export const DieFace: React.FC<{
  value: number;
  skin?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}> = ({ value, skin = 'gold', size = 'lg', className = '', onClick }) => {
  const config = getDieSkinConfig(skin);

  const dotsMap: Record<number, string[]> = {
    1: ['col-start-2 row-start-2'],
    2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
    3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
    4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
  };

  const positions = dotsMap[value] || dotsMap[1];

  const dotSize =
    size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : 'w-4 h-4 sm:w-4.5 sm:h-4.5';
  const padding =
    size === 'sm' ? 'p-1 gap-0.5' : size === 'md' ? 'p-1.5 sm:p-2 gap-1' : 'p-2 sm:p-3 gap-1 sm:gap-1.5';

  const dieDimensions =
    size === 'sm'
      ? 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl'
      : size === 'md'
      ? 'w-14 h-14 sm:w-16 sm:h-16 rounded-xl'
      : 'w-20 h-20 sm:w-22 sm:h-22 rounded-2xl';

  return (
    <div
      onClick={onClick}
      className={`relative select-none flex items-center justify-center border ${config.innerBorder} ${dieDimensions} transition-all duration-200 overflow-hidden ${className}`}
      style={{
        background: config.bgGradient,
        boxShadow: config.boxShadow,
      }}
    >
      {/* High-Fidelity Material Texture Overlay */}
      <DieTextureOverlay type={config.textureType} />

      {/* Diagonal Specular Reflection Sweep (tactile polished physical surface) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 mix-blend-screen rounded-xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 30%, transparent 55%)',
        }}
      />

      {/* Recessed Inset Face Plate for tactile 3D relief */}
      <div
        className="absolute inset-1 sm:inset-1.5 rounded-lg pointer-events-none"
        style={{
          boxShadow: 'inset 0 1.5px 2px rgba(0,0,0,0.35), inset 0 -1px 1.5px rgba(255,255,255,0.2)',
        }}
      />

      {/* Corner Ornaments (Rivets, Filigree, Runes, Claws, Gems, Stars) */}
      <DieCornerAccents
        type={config.cornerType}
        color={config.cornerBracketColor}
        size={size}
      />

      {/* Central Ace Emblem for Roll 1 OR Standard Carved Pips for 2-6 */}
      {value === 1 ? (
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
          <div
            className={`rounded-full flex items-center justify-center ${config.pipBorder} ${config.pipShadow} ${
              size === 'sm' ? 'w-5 h-5 text-xs' : size === 'md' ? 'w-7 h-7 text-base' : 'w-10 h-10 text-xl sm:text-2xl'
            }`}
            style={{ background: config.pipGradient }}
          >
            <span className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transform scale-110">
              {config.aceIcon}
            </span>
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-3 grid-rows-3 w-full h-full ${padding} items-center justify-items-center relative z-10 pointer-events-none`}>
          {positions.map((pos, idx) => (
            <span
              key={idx}
              className={`${dotSize} rounded-full ${pos} ${config.pipBorder} ${config.pipShadow} transform active:scale-95 transition-transform`}
              style={{ background: config.pipGradient }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface DiceProps {
  values: number[];
  skin?: DiceSkin;
  isRolling?: boolean;
  onRoll?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Dice: React.FC<DiceProps> = ({
  values,
  skin = 'gold',
  isRolling = false,
  onRoll,
  disabled = false,
  size = 'lg',
}) => {
  const { t } = useApp();
  const [shakeDetected, setShakeDetected] = useState(false);

  // Motion sensor for phone shake
  useEffect(() => {
    let lastX = 0,
      lastY = 0,
      lastZ = 0;
    let lastTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (disabled || isRolling || !onRoll) return;

      const current = event.accelerationIncludingGravity;
      if (!current) return;

      const currentTime = Date.now();
      if (currentTime - lastTime > 100) {
        const diffTime = currentTime - lastTime;
        lastTime = currentTime;

        const x = current.x || 0;
        const y = current.y || 0;
        const z = current.z || 0;

        const speed = (Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime) * 10000;

        if (speed > 1800) {
          // Shake sensitivity threshold
          setShakeDetected(true);
          onRoll();
          setTimeout(() => setShakeDetected(false), 800);
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [disabled, isRolling, onRoll]);

  const buttonClasses =
    size === 'sm'
      ? 'px-4 py-1.5 rounded-lg font-cinzel font-bold text-xs sm:text-sm text-black'
      : size === 'md'
      ? 'px-6 py-2.5 rounded-xl font-cinzel font-bold text-sm sm:text-base text-black'
      : 'px-8 py-3.5 rounded-xl font-cinzel font-bold text-lg text-black';

  return (
    <div className={`flex flex-col items-center select-none ${size === 'sm' ? 'gap-1.5' : 'gap-3'}`}>
      <div className={`flex items-center justify-center ${size === 'sm' ? 'gap-2.5' : 'gap-5'}`}>
        {values.map((val, idx) => (
          <div
            key={idx}
            onClick={() => !disabled && !isRolling && onRoll && onRoll()}
            className={`cursor-pointer transform transition-transform duration-200 active:scale-95 ${
              isRolling || shakeDetected ? 'animate-roll' : 'hover:scale-105 hover:-translate-y-1'
            }`}
          >
            <DieFace value={val} skin={skin} size={size} />
          </div>
        ))}
      </div>

      {onRoll && (
        <button
          disabled={disabled || isRolling}
          onClick={onRoll}
          className={`${buttonClasses} transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow cursor-pointer ${
            disabled || isRolling
              ? 'bg-gray-600 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-[#e8c84a] to-[#ffd700] hover:brightness-110 shadow-[0_0_12px_rgba(234,179,8,0.35)]'
          }`}
        >
          <span>{isRolling ? '...' : t('rollDice')}</span>
          {!disabled && !isRolling && (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/20 text-black text-[10px] font-mono border border-black/30 font-bold">
              Space ⏎
            </kbd>
          )}
        </button>
      )}

      {onRoll && size !== 'sm' && (
        <div className="flex items-center gap-2 text-xs text-[#888] font-barlow">
          <span>{t('shakeDevice')}</span>
          <span className="hidden sm:inline text-gray-500">• Tasta Space / Enter</span>
        </div>
      )}
    </div>
  );
};
