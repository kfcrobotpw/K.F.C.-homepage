# Security Spec for K.F.C. Executive Chatroom

## 1. Data Invariants

For the `ChatMessage` collection (`/officer_messages/{messageId}`):
* **Identity Protection:** Messages can only be read or written by users authenticated and verified as **Officers** in the club (`isOfficer()`).
* **Author Spoofing Mitigation:** The `senderId` field inside any newly created `ChatMessage` must strictly match the authenticated user's ID (`request.auth.uid`).
* **Content Constraints:** Message content must be a string and is strictly capped at 2500 characters to prevent buffer-exhaustion or resource-drain behavior.
* **Temporal Integrity:** The message's `createdAt` timestamp must be strictly matched to the trusted server time (`request.time`).
* **Immutability of Messages:** Messages are append-only. Once sent, messages cannot be modified or updated by any client, protecting chat history records from alterations. Deletion is restricted to Officers who are the original senders or administrators.

## 2. The "Dirty Dozen" Payloads (Executive Chat Spec)

We test for authorization bypasses and integrity hacks:

1. **Unauthenticated Read/Write:** Attempting to read/write a message without signing in. (Outcome: `PERMISSION_DENIED`)
2. **Standard Member Bypass (Read):** A logged-in, non-officer client trying to listen to the `/officer_messages` stream. (Outcome: `PERMISSION_DENIED`)
3. **Standard Member Bypass (Write):** A logged-in, non-officer client sending a chat block. (Outcome: `PERMISSION_DENIED`)
4. **Identity Impersonation:** A genuine officer crafting a message with `senderId: "another_user_uid"`. (Outcome: `PERMISSION_DENIED`)
5. **Junk Character Identifier:** Poisoning the `messageId` template with an invalid, oversized string (e.g., 200 character symbols). (Outcome: `PERMISSION_DENIED` thanks to `isValidId(messageId)` constraint)
6. **Immutable Alteration:** Attempting to update/edit an existing message from the chat panel. (Outcome: `PERMISSION_DENIED`)
7. **Malicious Content Sizing:** Trying to push a chat content of length 150,000 characters. (Outcome: `PERMISSION_DENIED` due to size enforcement checking)
8. **Client Timestamp Spoofing:** Supplying a custom client-side UTC string for `createdAt` instead of a server runtime placeholder. (Outcome: `PERMISSION_DENIED`)
9. **Shadow Ghost Fields:** Appending extraneous variables like `isAdminGroupChat: true` in the message collection map data. (Outcome: `PERMISSION_DENIED` due to exact map key counting size of 6)
10. **Malicious Chat Room Injection:** Injecting comments or fields missing the necessary elements. (Outcome: `PERMISSION_DENIED`)
11. **Malicious Deletion of Other User's Message:** An officer trying to delete a message sent by a different officer. (Outcome: `PERMISSION_DENIED`)
12. **Bypassed Query Scraper:** Querying the channel without appropriate credentials. (Outcome: `PERMISSION_DENIED`)
