# iOS Core Flow Audit

_Overnight stabilization — 2026-05-30. Verdict per flow: **Test** (covered by
an automated test), **Code** (wired + readable, not directly unit-tested),
**Manual** (needs a human on-device), **No iOS UI** (service exists, no screen)._

Mobile suite at audit time: **292 passed + 1 skipped**; core: **336 passed**.

| # | Flow | Status | Evidence / Notes |
|---|------|--------|------------------|
| 1 | Create account | **Test** | `signup.test.js`, `AuthContext` signUp → `createProfile`; core `profileOperations` |
| 2 | Sign in | **Test + live** | `login.test.js`; live-verified earlier (commit `3684e0e`), keychain fix preserved |
| 3 | Sign out | **Test** | `settings.test.js` asserts the confirm Alert; `AuthContext.signOut` → reset to Welcome |
| 4 | Forgot password | **Test** | `forgotPassword.test.js` |
| 5 | Add ski | **Test** | `newSki.test.js`, `skiService.test.js` (`createSki`), core `skiOperations`/`validation/ski` |
| 6 | Edit ski | **No iOS UI** | `skiService.updateSki` exists + tested, but **no mobile edit screen** (newSki is add-only; no `EditSki` route). Editing is web-only (`/ski/[id]/edit`). **Gap.** |
| 7 | Retire / unretire ski | **No iOS UI** | Skis are *filtered* by `retired` everywhere, and `skiService.deleteSki` (soft) exists + tested, but **no mobile action to set/clear `retired`**. **Gap.** |
| 8 | Search skis | **Test** | Home filter (`homescreen.test.js`); `SkiSelector` search (`SkiSelector.test.js`) |
| 9 | Scan sticker (OCR) | **Test + Manual** | `ocrService.test.js`; `scanSki.js` UI never field-tested — **manual on a real sticker** |
| 10 | Log wax | **Test** | `waxinglog.test.js`, `waxLogService.test.js`, core `validation/waxLog` (incl. empty-log block) |
| 11 | Log test | **Test** | `testinglog.test.js`, `testLogService.test.js`, core `validation/testLog` |
| 12 | View ski history | **Test** | `skiInfo.test.js` |
| 13 | Share ski / fleet | **Test** | `shareService.test.js`, `skiInfo.share.test.js` (invite caption + link) |
| 14 | Export data | **Test (core) + Code** | `settings.js` "Export my data" → `exportAndShareUserData`; core `dataExport.test.js`. Share-sheet glue **manual** |
| 15 | Delete account | **Test** | `settings.deleteAccount.test.js`, `userService.deleteAccount.test.js`; two-step (alert → reauth) |
| 16 | Become coach / stop coaching | **Test** | `userService.coachCapability.test.js`, `profile.coach.test.js` (cascade on stop) |
| 17 | Mode switch personal/coaching/waxtruck | **Test** | `ModeContext.test.js` (12), `TabBar.test.js` (8); persistence race + corrupt-mode hardened |
| 18 | Coach request / accept | **Test + live** | `coachRequestService.test.js`, core `coachOperations`; `verify-coach-pairing.sh` (live, not re-run — rules unchanged) |
| 19 | Coach views athlete fleet | **Code + Manual** | `athleteDetail.js`; rules live-verified (coach reads athlete, write denied). **Manual two-account pass** |
| 20 | Coach sends message / advisory | **Test + Manual** | `messageService.test.js`, core `messageOperations`/`advisoryOperations`; `composeAdvisory.js`. **Manual send** |
| 21 | Athlete reads message | **Code + Manual** | `messages.js`/`messageDetail.js` + `subscribe*`; unread badge in TabBar. **Manual** |
| 22 | Wax Truck setup | **Test + Manual** | `waxTestService.test.js`, core `waxTestOperations`; `waxTestSetup.js` UI never human-run. **Manual** |
| 23 | Wax Truck bracket generation | **Test** | core `waxTestOperations` (sizes 2/3/4/5/8/16, byes, run-to-winner) |
| 24 | Wax Truck winner selection | **Test (core) + Manual** | core `advanceWinner`; `waxTestRunner.js` tap path **manual** |
| 25 | Convert winner → advisory | **Code + Manual** | `waxTestRunner.js` → navigate `ComposeAdvisory`. **Manual** |

## Summary

- **20 / 25 flows have automated coverage** (Test), the data/logic layers
  especially strongly (core + service suites).
- **2 flows have NO iOS UI** and should be called out to the user:
  **#6 Edit ski** and **#7 Retire/unretire ski** — the service methods exist
  and are tested, but there is no screen to invoke them on iOS. These are not
  "broken," they're **unimplemented on mobile** (edit exists on web). Decide
  whether the beta needs them on iOS; if so that's net-new UI (out of scope
  for this stabilization run).
- The **highest-risk-but-unproven-by-a-human** flows remain Wax Truck
  (#22, #24, #25) and the cross-account coach loop (#19–21) — they need a
  manual two-account, two-device pass. Their logic is tested; their on-device
  UX is not.

No flow is **broken** (crashes / dead ends) in the audited code. The two gaps
above are missing-UI, documented honestly rather than hidden.
