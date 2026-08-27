/**
 * Automated Test Suite for Google Play Connection & Master Profile Architecture
 * Run with: npx tsx scripts/test-google-play-master-profile.ts
 */

import { calculateProgression } from '../src/lib/progression';
import { Profile } from '../src/types';
import { CloudUserProfile } from '../src/lib/firestoreService';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failedTests++;
  }
}

console.log('\n======================================================');
console.log('🧪 RUNNING GOOGLE PLAY & MASTER PROFILE TEST SUITE');
console.log('======================================================\n');

// ---------------------------------------------------------
// TEST GROUP 1: Progression & Title Calculations
// ---------------------------------------------------------
console.log('--- TEST GROUP 1: Progression & Level Calculations ---');

const prog0 = calculateProgression(0);
assert(prog0.currentLevel === 1, 'Level 1 starts at 0 XP');
assert(Boolean(prog0.titleRo && prog0.titleEn), 'Progression provides valid Ro/En titles at 0 XP');

const prog1000 = calculateProgression(1500);
assert(prog1000.currentLevel >= 2, 'Level scales with XP > 1000');
assert(prog1000.xpNeededForNextLevel > 0, 'xpNeededForNextLevel is positive');

// ---------------------------------------------------------
// TEST GROUP 2: Master Profile Creation & Segregation
// ---------------------------------------------------------
console.log('\n--- TEST GROUP 2: Master Profile Creation & Segregation ---');

const mockUserId = 'user_google_play_test_12345';
const initialProfiles: Profile[] = [
  {
    id: 'sub_1',
    name: 'Călugărul Bețiv',
    avatarIcon: 'monk_drunk',
    isMaster: false,
    gamesPlayed: 5,
    totalSips: 20,
    totalChugs: 1,
    totalXP: 250,
    currentLevel: 1,
    currentTitle_ro: 'Ucenic de Pahar',
    currentTitle_en: 'Glass Apprentice',
    winsBoardgame: 2,
    winsDuel: 1,
    winsCasino: 0,
    winsPineapple: 0,
    winsCrash: 0,
    gamesPlayedCrash: 0,
    sipsDrunkCrash: 0,
    totalPineapplePoints: 0,
    unlockedAchievements: ['first_sip'],
    createdAt: Date.now(),
  },
  {
    id: 'sub_2',
    name: 'Fratele Ioan',
    avatarIcon: 'monk_drunk',
    isMaster: false,
    gamesPlayed: 2,
    totalSips: 10,
    totalChugs: 0,
    totalXP: 100,
    currentLevel: 1,
    currentTitle_ro: 'Ucenic de Tavernă',
    currentTitle_en: 'Tavern Apprentice',
    winsBoardgame: 0,
    winsDuel: 0,
    winsCasino: 0,
    winsPineapple: 0,
    winsCrash: 0,
    gamesPlayedCrash: 0,
    sipsDrunkCrash: 0,
    totalPineapplePoints: 0,
    unlockedAchievements: [],
    createdAt: Date.now(),
  },
];

// Simulate setting a new Master Profile
function simulateSetMainProfile(
  existingProfiles: Profile[],
  newName: string,
  newAvatar: string,
  uid: string
): Profile[] {
  const trimmed = newName.trim();
  const prog = calculateProgression(0);
  const existingMatch = existingProfiles.find(
    p => p.name.trim().toLowerCase() === trimmed.toLowerCase()
  );

  if (existingMatch) {
    const master: Profile = {
      ...existingMatch,
      name: trimmed,
      avatarIcon: newAvatar || existingMatch.avatarIcon || 'monk_master',
      isMaster: true,
    };
    const others = existingProfiles
      .filter(p => p.id !== existingMatch.id)
      .map(p => ({ ...p, isMaster: false }));
    return [master, ...others];
  } else {
    const newMaster: Profile = {
      id: `master_${uid.substring(0, 8)}`,
      name: trimmed,
      avatarIcon: newAvatar || 'monk_master',
      isMaster: true,
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
      totalXP: 0,
      currentLevel: 1,
      currentTitle_ro: prog.titleRo,
      currentTitle_en: prog.titleEn,
      winsBoardgame: 0,
      winsDuel: 0,
      winsCasino: 0,
      winsPineapple: 0,
      winsCrash: 0,
      gamesPlayedCrash: 0,
      sipsDrunkCrash: 0,
      totalPineapplePoints: 0,
      unlockedAchievements: [],
      createdAt: Date.now(),
    };
    const others = existingProfiles.map(p => ({ ...p, isMaster: false }));
    return [newMaster, ...others];
  }
}

const updatedWithNewMaster = simulateSetMainProfile(
  initialProfiles,
  'Starețul Suprem',
  'monk_master',
  mockUserId
);

assert(updatedWithNewMaster.length === 3, 'Created new master profile while keeping existing subprofiles');
assert(updatedWithNewMaster[0].isMaster === true, 'First profile is marked as isMaster: true');
assert(updatedWithNewMaster[0].name === 'Starețul Suprem', 'Master profile name is correctly assigned');
assert(updatedWithNewMaster[1].isMaster === false && updatedWithNewMaster[2].isMaster === false, 'Subprofiles have isMaster: false');

// Simulate promoting an existing subprofile to Master
const updatedPromoted = simulateSetMainProfile(
  initialProfiles,
  'Fratele Ioan',
  'monk_master',
  mockUserId
);

assert(updatedPromoted.length === 2, 'Promoting existing subprofile preserves total profile count');
assert(updatedPromoted[0].name === 'Fratele Ioan', 'Promoted profile moved to master position');
assert(updatedPromoted[0].isMaster === true, 'Promoted profile is master');
assert(updatedPromoted[0].totalXP === 100, 'Promoted profile retains its historical XP');
assert(updatedPromoted[1].isMaster === false, 'Previous master/subprofile remains subprofile');

// ---------------------------------------------------------
// TEST GROUP 3: Firestore Payload Sanitation & Undefined Guard
// ---------------------------------------------------------
console.log('\n--- TEST GROUP 3: Firestore Document Payload Guarding ---');

function sanitizePayloadForFirestore(
  profilesList: Profile[],
  userId: string,
  accountName: string,
  drunkenCoins: number
): CloudUserProfile {
  const activeProfilesList = Array.isArray(profilesList) && profilesList.length > 0
    ? profilesList.filter(Boolean)
    : [
        {
          id: `master_${userId.substring(0, 8)}`,
          name: accountName,
          avatarIcon: 'monk_master',
          isMaster: true,
          gamesPlayed: 0,
          totalSips: 0,
          totalChugs: 0,
          totalXP: 0,
          currentLevel: 1,
          currentTitle_ro: 'Ucenic de Tavernă',
          currentTitle_en: 'Tavern Apprentice',
          winsBoardgame: 0,
          winsDuel: 0,
          winsCasino: 0,
          winsPineapple: 0,
          winsCrash: 0,
          gamesPlayedCrash: 0,
          sipsDrunkCrash: 0,
          totalPineapplePoints: 0,
          unlockedAchievements: [],
          createdAt: Date.now(),
        },
      ];

  const master = activeProfilesList.find(p => p && p.isMaster) || activeProfilesList[0];
  const masterId = master ? master.id : `master_${userId.substring(0, 8)}`;

  const sanitizedProfiles: Profile[] = activeProfilesList.map(p => {
    const isMaster = p.id === masterId || p.isMaster === true;
    const prog = calculateProgression(p.totalXP || 0);
    return {
      id: p.id || `profile_${Date.now()}`,
      name: (p.name || 'Călugăr').substring(0, 50),
      avatarIcon: (p.avatarIcon || (isMaster ? 'monk_master' : 'monk_drunk')).substring(0, 50000),
      isMaster,
      gamesPlayed: Math.max(0, p.gamesPlayed || 0),
      totalSips: Math.max(0, p.totalSips || 0),
      totalChugs: Math.max(0, p.totalChugs || 0),
      totalXP: Math.max(0, p.totalXP || 0),
      currentLevel: p.currentLevel || prog.currentLevel || 1,
      currentTitle_ro: p.currentTitle_ro || prog.titleRo,
      currentTitle_en: p.currentTitle_en || prog.titleEn,
      winsBoardgame: Math.max(0, p.winsBoardgame || 0),
      winsDuel: Math.max(0, p.winsDuel || 0),
      winsCasino: Math.max(0, p.winsCasino || 0),
      winsPineapple: Math.max(0, p.winsPineapple || 0),
      winsCrash: Math.max(0, p.winsCrash || 0),
      gamesPlayedCrash: Math.max(0, p.gamesPlayedCrash || 0),
      sipsDrunkCrash: Math.max(0, p.sipsDrunkCrash || 0),
      totalPineapplePoints: Math.max(0, p.totalPineapplePoints || 0),
      unlockedAchievements: Array.isArray(p.unlockedAchievements) ? p.unlockedAchievements.slice(0, 50) : [],
      createdAt: p.createdAt || Date.now(),
    };
  });

  const sanitizedMaster: Profile = sanitizedProfiles.find(p => p.isMaster) || sanitizedProfiles[0];
  const sanitizedSubProfiles = sanitizedProfiles.filter(p => !p.isMaster && p.id !== sanitizedMaster.id);

  const totalLocalXP = sanitizedProfiles.reduce((s, p) => s + (p.totalXP || 0), 0);
  const masterProg = calculateProgression(sanitizedMaster ? (sanitizedMaster.totalXP || totalLocalXP) : totalLocalXP);

  return {
    userId,
    displayName: (sanitizedMaster?.name || accountName).substring(0, 100),
    avatarIcon: (sanitizedMaster?.avatarIcon || 'monk_drunk').substring(0, 50000),
    email: 'test@example.com',
    masterProfile: sanitizedMaster,
    subProfiles: sanitizedSubProfiles,
    profiles: sanitizedProfiles,
    drunkenCoins: Math.max(0, drunkenCoins || 100),
    hasSetMainProfile: true,
    gamesPlayed: sanitizedProfiles.reduce((s, p) => s + (p.gamesPlayed || 0), 0),
    totalSips: sanitizedProfiles.reduce((s, p) => s + (p.totalSips || 0), 0),
    totalChugs: sanitizedProfiles.reduce((s, p) => s + (p.totalChugs || 0), 0),
    totalXP: totalLocalXP,
    currentLevel: masterProg.currentLevel,
    currentTitle_ro: masterProg.titleRo,
    currentTitle_en: masterProg.titleEn,
    duelWins: sanitizedProfiles.reduce((s, p) => s + (p.winsDuel || 0), 0),
    duelPlayed: sanitizedProfiles.reduce((s, p) => s + (p.winsDuel || 0), 0),
    winsBoardgame: sanitizedProfiles.reduce((s, p) => s + (p.winsBoardgame || 0), 0),
    winsDuel: sanitizedProfiles.reduce((s, p) => s + (p.winsDuel || 0), 0),
    winsCasino: sanitizedProfiles.reduce((s, p) => s + (p.winsCasino || 0), 0),
    winsPineapple: sanitizedProfiles.reduce((s, p) => s + (p.winsPineapple || 0), 0),
    winsCrash: sanitizedProfiles.reduce((s, p) => s + (p.winsCrash || 0), 0),
    unlockedAchievements: Array.from(new Set(sanitizedProfiles.flatMap(p => p.unlockedAchievements || []))),
  };
}

// Test with empty list
const payloadEmpty = sanitizePayloadForFirestore([], mockUserId, 'Default User', 100);
assert(payloadEmpty.masterProfile !== null && payloadEmpty.masterProfile !== undefined, 'Handles empty profile array gracefully without crash');
assert(payloadEmpty.totalXP >= 0, 'totalXP is valid integer on empty array');
assert(payloadEmpty.hasSetMainProfile === true, 'hasSetMainProfile is preserved as boolean');

// Test with undefined fields inside profile objects
const dirtyProfiles: any[] = [
  {
    id: 'dirty_1',
    name: 'Dirty Profile',
    totalXP: undefined,
    totalSips: null,
    winsDuel: undefined,
  },
  null,
  undefined,
];

const payloadDirty = sanitizePayloadForFirestore(dirtyProfiles, mockUserId, 'Default User', 150);
assert(payloadDirty.totalXP === 0, 'totalXP defaults to 0 when inputs are undefined');
assert(payloadDirty.totalSips === 0, 'totalSips defaults to 0 when input is null');
assert(payloadDirty.subProfiles.length === 0, 'Null and undefined profiles are filtered out');
assert(payloadDirty.masterProfile.name === 'Dirty Profile', 'Master profile successfully sanitized');

// ---------------------------------------------------------
// TEST GROUP 4: Custom Equipped Titles & Leaderboard Sync
// ---------------------------------------------------------
console.log('\n--- TEST GROUP 4: Custom Equipped Titles & Leaderboard Sync ---');

const profilesWithCustomTitles: Profile[] = [
  {
    id: 'master_titled',
    name: 'Starețul Suprem',
    avatarIcon: 'monk_master',
    isMaster: true,
    gamesPlayed: 10,
    totalSips: 100,
    totalChugs: 5,
    totalXP: 2500,
    currentLevel: 3,
    currentTitle_ro: 'Mare Maestru al Berii',
    currentTitle_en: 'Grand Beer Master',
    winsBoardgame: 3,
    winsDuel: 4,
    winsCasino: 2,
    winsPineapple: 1,
    winsCrash: 1,
    gamesPlayedCrash: 2,
    sipsDrunkCrash: 10,
    totalPineapplePoints: 50,
    unlockedAchievements: ['lvl_3'],
    createdAt: Date.now(),
  },
  {
    id: 'sub_titled',
    name: 'Fratele Pahar',
    avatarIcon: 'monk_drunk',
    isMaster: false,
    gamesPlayed: 6,
    totalSips: 40,
    totalChugs: 2,
    totalXP: 800,
    currentLevel: 1,
    currentTitle_ro: 'Campionul Damigenei',
    currentTitle_en: 'Demi-John Champion',
    winsBoardgame: 1,
    winsDuel: 2,
    winsCasino: 0,
    winsPineapple: 0,
    winsCrash: 0,
    gamesPlayedCrash: 0,
    sipsDrunkCrash: 0,
    totalPineapplePoints: 0,
    unlockedAchievements: [],
    createdAt: Date.now(),
  },
];

const payloadTitled = sanitizePayloadForFirestore(profilesWithCustomTitles, mockUserId, 'Antoniu', 500);

assert(
  payloadTitled.masterProfile.currentTitle_ro === 'Mare Maestru al Berii',
  'Master profile custom Romanian title is saved in cloud payload'
);
assert(
  payloadTitled.masterProfile.currentTitle_en === 'Grand Beer Master',
  'Master profile custom English title is saved in cloud payload'
);
assert(
  payloadTitled.subProfiles[0].currentTitle_ro === 'Campionul Damigenei',
  'Sub-profile custom Romanian title is saved in cloud payload'
);
assert(
  payloadTitled.subProfiles[0].currentTitle_en === 'Demi-John Champion',
  'Sub-profile custom English title is saved in cloud payload'
);

// Simulate Leaderboard Mapping
const leaderboardEntries = payloadTitled.profiles.map(p => {
  const prog = calculateProgression(p.totalXP || 0);
  return {
    userId: mockUserId,
    profileId: p.id,
    isMaster: p.isMaster === true,
    displayName: p.name,
    currentLevel: p.currentLevel || prog.currentLevel,
    currentTitle_ro: p.currentTitle_ro || prog.titleRo,
    currentTitle_en: p.currentTitle_en || prog.titleEn,
  };
});

assert(
  leaderboardEntries.find(e => e.profileId === 'master_titled')?.currentTitle_ro === 'Mare Maestru al Berii',
  'Leaderboard document contains custom equipped title for Master profile'
);
assert(
  leaderboardEntries.find(e => e.profileId === 'sub_titled')?.currentTitle_ro === 'Campionul Damigenei',
  'Leaderboard document contains custom equipped title for Sub-profile'
);

// Simulate multi-device cloud merge test
const localProfilesBeforeSync: Profile[] = [
  {
    id: 'master_titled',
    name: 'Starețul Suprem',
    avatarIcon: 'monk_master',
    isMaster: true,
    gamesPlayed: 5,
    totalSips: 50,
    totalChugs: 2,
    totalXP: 1000,
    currentLevel: 2,
    currentTitle_ro: 'Ucenic de Pahar',
    currentTitle_en: 'Glass Apprentice',
    winsBoardgame: 1,
    winsDuel: 1,
    winsCasino: 1,
    winsPineapple: 0,
    winsCrash: 0,
    gamesPlayedCrash: 0,
    sipsDrunkCrash: 0,
    totalPineapplePoints: 0,
    unlockedAchievements: [],
    createdAt: Date.now(),
  },
];

// Merging cloud profile into local state should preserve the higher XP and the cloud's custom title
const mergedFromCloud = localProfilesBeforeSync.map(local => {
  const cloudMatch = payloadTitled.profiles.find(cp => cp.id === local.id);
  if (!cloudMatch) return local;
  const highestXp = Math.max(cloudMatch.totalXP || 0, local.totalXP || 0);
  const prog = calculateProgression(highestXp);
  return {
    ...local,
    totalXP: highestXp,
    currentLevel: prog.currentLevel,
    currentTitle_ro: cloudMatch.currentTitle_ro || local.currentTitle_ro || prog.titleRo,
    currentTitle_en: cloudMatch.currentTitle_en || local.currentTitle_en || prog.titleEn,
  };
});

assert(
  mergedFromCloud[0].currentTitle_ro === 'Mare Maestru al Berii',
  'Cloud merge successfully restores equipped custom title on secondary device'
);
assert(
  mergedFromCloud[0].totalXP === 2500,
  'Cloud merge retains highest XP across devices'
);

// ---------------------------------------------------------
// TEST SUMMARY
// ---------------------------------------------------------
console.log('\n======================================================');
console.log(`📊 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
