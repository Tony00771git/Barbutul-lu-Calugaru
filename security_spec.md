# Security Specification & Threat Model for Firestore Security Rules

## 1. Data Invariants
- **Identity Invariant**: Users can only create, update, or delete their own profile (`/users/{userId}`) where `userId == request.auth.uid`.
- **Leaderboard Invariant**: Any authenticated user can publish or update their own leaderboard entry (`/leaderboards/{userId}`) matching their `request.auth.uid`. Anyone can read leaderboard entries to display rankings.
- **Match History Invariant**: Authenticated players can submit a completed match report (`/duel_histories/{matchId}`) where `incoming().creatorUid == request.auth.uid`. Once created, match reports are immutable (no client updates or deletes).
- **Type and Boundary Invariant**: All strings, numbers, and lists must have strict length and range boundaries to avoid Denial-of-Wallet and resource poisoning.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1 (Ghost Field / Shadow Update)**: Updating user profile with extra unauthorized field `{ "isAdmin": true }` -> REJECT.
2. **Payload 2 (ID Spoofing on Create)**: Trying to write to `/users/victimUid` while authenticated as `attackerUid` -> REJECT.
3. **Payload 3 (Unauthenticated Read to Private Profile)**: Reading `/users/{userId}` without valid auth token -> REJECT.
4. **Payload 4 (Unbounded String Resource Attack)**: Trying to set `displayName` to 100KB string -> REJECT.
5. **Payload 5 (Leaderboard Identity Hijacking)**: Writing to `/leaderboards/victimUid` as `attackerUid` -> REJECT.
6. **Payload 6 (Match History Mutation)**: Trying to update or overwrite an existing `/duel_histories/{matchId}` record -> REJECT.
7. **Payload 7 (Invalid Enum/Submode in Match History)**: Setting `submode: "invalid_hacked_mode"` -> REJECT.
8. **Payload 8 (Negative Drink Counts)**: Trying to save `totalSips: -500` or `totalChugs: -10` -> REJECT.
9. **Payload 9 (Unbounded Array Injection)**: Injecting 10,000 items in `unlockedAchievements` array -> REJECT.
10. **Payload 10 (Path ID Injection)**: Supplying a 2KB malicious document ID with script tags -> REJECT via `isValidId()`.
11. **Payload 11 (Timestamp Falsification)**: Providing arbitrary client timestamps instead of `request.time` -> REJECT.
12. **Payload 12 (Immutable Field Tampering)**: Changing `createdAt` or `userId` during profile update -> REJECT.
