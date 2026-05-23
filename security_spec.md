# Security Specification for Yongin Youth Center K.F.C. Robot Club Website

This document outlines the security invariants, access control policies, and potential threat avenues (the "Dirty Dozen" payloads) that our Firestore security rules must block to preserve the integrity of our club data.

## 1. Core Data Invariants & Permissions Matrix

All access requests in the K.F.C. Robot Club database require proper Authentication. Anonymous actions are rejected.

| Collection Path | Get/List (Read) | Create (Write) | Update (Write) | Delete (Write) |
|---|---|---|---|---|
| `/users/{userId}` | Authenticated. | `request.auth.uid == userId`. Cannot set `isOfficer == true` unless bootstrapped admin. | `request.auth.uid == userId` (cannot edit `isOfficer`) OR Admin. | None / Admin only. |
| `/notices/{noticeId}` | Authenticated. | Admin Only. | Admin Only. | Admin Only. |
| `/notices/{noticeId}/likes/{userId}` | Authenticated. | `request.auth.uid == userId` | None. | `request.auth.uid == userId` |
| `/notices/{noticeId}/comments/{commentId}` | Authenticated. | Authenticated. `authorId == request.auth.uid` | Authenticated. `authorId == request.auth.uid` | `authorId == request.auth.uid` OR Admin. |
| `/notices/{noticeId}/votes/{userId}` | Authenticated. | `request.auth.uid == userId` | `request.auth.uid == userId` | `request.auth.uid == userId` |
| `/resources/{resourceId}` | Authenticated. | Authenticated. `authorId == request.auth.uid` | `authorId == request.auth.uid` OR Admin. | `authorId == request.auth.uid` OR Admin. |
| `/schedules/{scheduleId}` | Authenticated. | Admin Only. | Admin Only. | Admin Only. |
| `/executives/{executiveId}` | Authenticated. | Admin Only. | Admin Only. | Admin Only. |

### Major Root Admin Identifier
- Google Account email: `kfcrobotpw@gmail.com` is verified and acts as the root master administrator.

---

## 2. The "Dirty Dozen" Payloads (Avenues of Attack to Block)

Here are twelve hostile payloads that our ruleset must completely deny:

1. **Privilege Escalation on Signup**: A new user signs up and passes `{ "id": "attackerUid", "email": "attacker@gmail.com", "displayName": "Attacker", "photoURL": "...", "isOfficer": true }` to `/users/attackerUid`.
   - *Status*: Rejected. Users cannot write `isOfficer: true` during creation unless their verified email is `kfcrobotpw@gmail.com`.

2. **Self-Promotion via Update**: An existing user makes an update request to `/users/attackerUid` modifying only `isOfficer` to `true`.
   - *Status*: Rejected. Normal users cannot update `isOfficer` fields. Only other verified Admins can modify that property.

3. **Impersonated Notice Creation**: A logged-in user posts a notice setting `authorId` to the true Admin's UID to cause misinformation.
   - *Status*: Rejected. `incoming().authorId` must match the authenticated user's UID `request.auth.uid`, and the user must be verified as an officer.

4. **Shadow Notice Inject**: An attacker creates a notice with random parameters outside the schema (e.g. `{ "title": "X", "hackCode": "kill-db", ... }`).
   - *Status*: Rejected. Strict schema matching (`data.keys().hasAll(...) && data.keys().size() == N`) prevents shadow database fields.

5. **Spamming Massive Notice IDs**: An attacker sends a notice create request with a 2MB document ID.
   - *Status*: Rejected. `isValidId(noticeId)` enforces length restrictions and alphanumeric safe characters.

6. **Spoofing Someone Else's Like**: A user posts to `/notices/someNoticeId/likes/victimUserId` with their own auth token.
   - *Status*: Rejected. The like path key must match their auth UID (`request.auth.uid == userId`).

7. **Double Voting on Polls**: An attacker writes multiple votes or writes a vote with someone else's ID under `/notices/someNoticeId/votes/victimUserId`.
   - *Status*: Rejected. Enforced by requiring path key matching and payload `userId == request.auth.uid`.

8. **Tampering with Notice Comment Authorship**: A member writes or edits a comment under someone else's name, or updates `authorId`.
   - *Status*: Rejected. Comment's `authorId` is validated to equal `request.auth.uid` and marked as immutable during updates.

9. **Hijacking Club Calendar event**: A normal member writes, edits, or deletes an event at `/schedules/eventXYZ`.
   - *Status*: Rejected. Scheduled writes are exclusive to verified officers.

10. **Infiltrating the Executives directory**: Someone posts a fake executive card or modifies the role of the club president in `/executives/president`.
    - *Status*: Rejected. Only authenticated officers can write to `/executives`.

11. **Client-Bypassing Resource Scraping**: A malicious crawler requests read access to resources.
    - *Status*: Allowed only for authenticated, verified members. Non-signed-in queries are rejected instantly.

12. **Zombie Resource Overwriting**: An active member attempts to overwrite a learning material resource posted by another member.
    - *Status*: Rejected. Users can only overwrite/edit resources where they are verified as the original creator (`existing().authorId == request.auth.uid`).

---

## 3. Implementation Verification Rules

Our final `firestore.rules` will be fully optimized with the ABAC helpers described in the Firebase Integration skill to block all 12 of these attack pathways.
