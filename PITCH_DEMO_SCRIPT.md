# NordicFleet — Pitch Demo Script

_A tight, repeatable walkthrough for a live demo of the private beta. Aim for
6 to 8 minutes. Pre-seed one athlete account with a few skis, a handful of wax
logs and test logs, and one linked coach so nothing is empty on screen._

## Before you start

- Run a **Release** build on a real iPhone (the Settings footer should read the
  current `BUILD_TAG`, not a stale one).
- Sign in as the pre-seeded athlete `op-athlete@…`.
- Have the coach account `op-coach@…` ready on a second device or the web app.
- Silence notifications. Mirror the phone to the room screen.

## The story (one sentence)

"NordicFleet is the system of record for a competitive nordic skier's fleet:
every ski, every wax, every on-snow test, plus a private line to their coach -
so the fast skis are repeatable and nothing lives on a napkin."

## 1. The dashboard (15s)

- Open the app to **Home**. Point out the three figures: Total skis, Last wax,
  Tests logged, over the live fleet list.
- "The dashboard is the at-a-glance state of the fleet."

## 2. A ski's whole history (45s)

- Tap a ski → **ski detail**. Show the hero card (brand, model, flex, length),
  then **Wax history** and **Test history** with ratings.
- "Everything done to this ski is here, newest first."

## 3. Full history + edit (60s) — _new this pass_

- Back to Home. Tap the **Last wax** figure → **Wax history** across the whole
  fleet, each row labelled by ski. Tap the **Tests logged** figure → **Test
  history**.
- Tap any history row → it opens that log in an **editor**. Change a glide wax
  or a rating, Save. "You can correct a log after the fact; the original date
  and created time are preserved, so it keeps its place in history."

## 4. Add a ski by scanning a sticker (45s)

- Start **Add ski → Scan**. Point the camera at a ski sticker (or use a saved
  photo). Show the parsed brand/model/length/flex with **confidence chips**.
- "We read the sticker, score each field, and let you confirm. Brand-aware: a
  Madshus F-code becomes an approximate flex." (Foundation; OCR quality varies.)

## 5. Coach messaging (60s)

- Open **Messages**. Show a thread that includes **both** what the coach sent
  and what the athlete sent, one chronological list, unread dots only on
  received-unread.
- On the coach device, send a wax tip or a **race-day advisory** (structured
  ski recommendation). Watch it arrive on the athlete in real time.
- "The coach sees their own sent messages too - it reads like a conversation,
  not a one-way inbox."

## 6. Units + feedback (30s) — _new this pass_

- **Profile → Units**: flip Weight to **lb** and Height to **in**. Show the
  figures convert instantly. "Stored in metric, shown how the athlete thinks."
- **Settings → Feedback → Send beta feedback**: show the pre-filled draft
  (build tag + platform included). "Every beta report tells us which build it
  came from."

## 7. Trust + compliance (20s)

- **Settings**: Export my data (JSON), Privacy Policy / Terms, Delete account
  (two-step). "Your data is yours - export or delete it any time."

## Close (15s)

"Five skiers in private beta now. The roadmap is coach invite links, athlete-
granted coach edit/suggestions, and public share pages - all gated behind a
Firestore rules test harness so we never ship a permission we haven't tested."

## If something breaks

- Have screenshots/screen-recording of each step above as a fallback.
- Known soft spots: sticker OCR depends on lighting; the rules-gated coach
  invite/permission UIs are not in this build (see `NEXT_FEATURE_BACKLOG.md`).
