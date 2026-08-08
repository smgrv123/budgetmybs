# Release Checklist — App Store & Google Play

Tailored to BudgetMyBS's current state as of this writing:

- Expo SDK ~54, RN 0.81, new architecture enabled, no EAS project configured yet (`eas.json` doesn't exist).
- Bundle identifiers are still the Expo placeholder: `com.anonymous.budgetmybs` (iOS `ios.bundleIdentifier` and Android `android.package` in `app.json`).
- **No Apple Developer or Google Play developer account exists yet** — this is the actual first blocker, ahead of any build config, since account verification can take days.
- The app sends user financial data to **two external third parties**: Splitwise (OAuth token exchange + bidirectional expense sync) and Google Gemini (`EXPO_PUBLIC_GEMINI_API_KEY`, chat-based financial advice). This is the main driver of the privacy-disclosure work below — a purely local-SQLite app would need far less.
- Uses `expo-notifications` (Impulse Buy Cooldown reminders) — needs a permission disclosure.
- No privacy policy, terms of service, or `eas.json` found anywhere in the repo yet.
- §6 below covers specific things in the _current implementation_ most likely to cause a first-submission rejection on either store — read it before you submit, not after a rejection email.

Work top to bottom — later sections depend on earlier ones (accounts → legal docs → EAS setup → store submission).

## Costs at a glance

| Item                                                              | Cost                                                                   | Notes                                                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Apple Developer Program                                           | **$99/year**, recurring                                                | Lapses = app pulled from sale until renewed                                                           |
| Google Play Developer account                                     | **$25 one-time**                                                       | No recurring fee after registration                                                                   |
| D-U-N-S number (Organization accounts only, either store)         | Free                                                                   | But lookup/registration can take 5+ business days                                                     |
| EAS Build (Expo)                                                  | Free tier available; paid tiers speed up build queue / add concurrency | Not required to ship, but worth budgeting if free-tier queue times are too slow during active testing |
| Domain + hosting for privacy policy/terms (if you don't have one) | ~$0–15/year                                                            | GitHub Pages is free and sufficient — a paid domain is optional polish                                |

---

## 1. Developer Accounts — Start These First

Neither account exists for this project yet. Both involve identity verification that can take anywhere from a few hours to several days, and almost everything downstream (EAS submit, TestFlight, Play internal testing) is blocked on them existing. Start these in parallel with — not after — the build-config and privacy-policy work in §2–3.

### Apple Developer Program — $99/year

- [ ] Decide **Individual vs Organization** before starting — hard to change later without re-enrolling under the other type:
  - **Individual**: fastest path, usually approved within 24–48 hours. The App Store listing shows "by [Your Legal Name]" rather than a company/brand name.
  - **Organization**: listing shows your company name instead, but requires a **D-U-N-S number** (a free Dun & Bradstreet business identifier). If your business doesn't already have one, registration/lookup alone can take **5+ business days**, sometimes longer, before you can even start the Apple enrollment. Only worth it if you're incorporated and want the app under a company name from day one.
- [ ] Sign up at developer.apple.com with an Apple ID that has **two-factor authentication enabled** (mandatory).
- [ ] Pay the **$99/year** fee — recurring, not one-time. If it lapses, your app comes off the store until renewed.
- [ ] Wait for Apple's identity verification — Individual is typically same-day to 48 hours; Organization adds the D-U-N-S lookup time on top of that.
- [ ] Once approved, you can create the App ID + app record in App Store Connect (§4).

### Google Play Developer account — $25 one-time

- [ ] Sign up at play.google.com/console with a Google account.
- [ ] Pay the **one-time $25** registration fee — no recurring cost after this, unlike Apple.
- [ ] Choose **Individual vs Organization** here too — Organization again needs a D-U-N-S number; Individual only needs a government-issued photo ID.
- [ ] Complete identity verification — Google requires a government ID upload (and sometimes a short verification video) for all new accounts; this can take a few hours to a few days.
- [ ] **New-account production gate**: Google requires a first-time developer account to run a **closed testing track with at least 20 testers, active for a continuous 14 days**, before Production publishing unlocks for that account's first app. Internal testing (§5) is unaffected and available immediately — but budget roughly a **2-week minimum runway** between "first build ready" and "can actually go live on Google Play" as a new account. (Confirm the exact tester-count/day thresholds in Play Console when you reach this step — Google has revised these numbers before.)

**Practical implication**: Google's new-account gate (~2 weeks) and a possible Apple Organization D-U-N-S wait (~1 week) are both pure calendar time, not engineering time. Kick off account creation today, in parallel with everything else in this doc, so those clocks run concurrently with build/privacy-policy work rather than after it.

## 2. App Identity & Build Config

- [ ] **Replace placeholder bundle IDs.** `com.anonymous.*` is the Expo default and cannot ship. Pick a real reverse-DNS identifier (e.g. `com.<yourname>.budgetmybs`) and set it in both `expo.ios.bundleIdentifier` and `expo.android.package` in `app.json`. Once submitted to either store, **this cannot be changed** — decide it once, deliberately.
- [ ] **Create an EAS project.** Run `eas init` (or `npx expo install eas-cli` first if not global) to generate a project ID and populate `app.json`'s `extra.eas.projectId`.
- [ ] **Add `eas.json` build profiles** — at minimum `development`, `preview` (internal testing), and `production`. `eas build:configure` scaffolds this.
- [ ] **Decide on app versioning strategy** — `expo.version` (user-facing, currently `1.0.0`) vs. build numbers (`ios.buildNumber` / `android.versionCode`). EAS can auto-increment these (`"autoIncrement": true` in the build profile) — recommended so you never manually bump per submission.
- [ ] **Move the Gemini API key out of client bundle, or accept the risk knowingly.** `EXPO_PUBLIC_*` env vars are compiled into the app binary in plaintext and extractable via a decompiled APK/IPA — anyone can pull your key and run up your Gemini bill. Before shipping, either (a) proxy Gemini calls through a small backend/edge function that holds the real key, or (b) explicitly accept the risk and put spend alerts/quotas on the Gemini API key in Google AI Studio. Given "no backend server" is a stated architectural constraint, (b) may be the pragmatic choice for v1 — but make it a conscious decision, not an oversight.
- [ ] Confirm `expo-secure-store` (already used for Splitwise tokens) is also used for the Gemini key if you go with a user-provided-key model — the scaffolding for this already exists in `src/config/env.ts` as a "future feature."
- [ ] Remove any remaining Expo Go / dev-only affordances from production builds (verify no `__DEV__`-gated debug menus leak through).

## 3. Privacy Policy & Terms of Service

Both stores **require a working, publicly-hosted privacy policy URL** before you can submit — not just for apps that collect data, all apps. You'll need actual hosting (a GitHub Pages site, Notion public page, or a simple static page) since app.json config doesn't host anything itself.

- [ ] **Write the Privacy Policy.** Given the data flows in this app, it must disclose:
  - Financial transaction data is stored locally on-device (SQLite) — clarify this is the primary store.
  - Transaction/expense data sent to **Splitwise** via OAuth for split-expense syncing, and that Splitwise's own privacy policy governs data once there (link to it).
  - Financial data sent to **Google Gemini API** for AI-generated financial advice — note that prompts (which include transaction context) leave the device and are processed by Google. Link to Google's Gemini API data usage policy.
  - Any analytics/crash reporting SDKs if you add them before launch (Sentry, Expo Application Services diagnostics, etc.) — audit `package.json` for these.
  - Push notification usage (local reminders for Impulse Buy Cooldown) — clarify if this is purely local scheduling (no server-side push) since that changes the disclosure significantly.
  - Data deletion/account deletion process — Apple requires apps with account creation to support in-app account deletion (see §4).
- [ ] **Write Terms of Service / EULA.** If you don't author a custom EULA, Apple's Standard EULA is used by default for App Store — decide if that's sufficient or if you want custom terms (recommended if you want to disclaim liability for financial advice being informational-only, not licensed financial advice).
- [ ] **Host both documents** at stable public URLs (e.g. `yourdomain.com/privacy`, `yourdomain.com/terms`, or GitHub Pages if no domain yet).
- [ ] **Link the URLs from within the app**, not just the store listing — e.g. a Settings screen entry. Both Apple and Google check for this; App Review has rejected apps for privacy-policy links that only appear in the store listing.
- [ ] If you add a way to disconnect from Splitwise or delete local data, make sure the privacy policy references that as the deletion mechanism.

## 4. Apple App Store + TestFlight

### Apple Developer account

- [ ] Covered in §1 — confirm enrollment is approved before proceeding.
- [ ] Create the App ID in App Store Connect matching your final bundle identifier from §2.
- [ ] Create the app record in App Store Connect (name, primary language, bundle ID, SKU).

### App Privacy ("Nutrition Label")

- [ ] Complete the **App Privacy** questionnaire in App Store Connect. Based on this app's data flows, expect to declare:
  - Financial Info (transaction data) — collected, linked to user, used for app functionality; shared with Splitwise (third-party) for sync purposes.
  - Financial Info sent to Gemini for AI features — declare as "used for app functionality," decide if "linked to identity" applies (Gemini calls likely don't include a persistent user ID, so probably not linked — verify against actual `gemini.ts` payload).
  - User ID / OAuth tokens (Splitwise) — if stored, declare under "Identifiers."
- [ ] Apple cross-checks this against actual app behavior during review — mismatches are a common rejection reason. Have someone re-verify the declared data flows against `src/services/splitwise/` and `src/services/gemini.ts` right before submitting.

### Financial app specifics

- [ ] Review App Store Review Guideline **§3.1.1 / §5.x** around financial apps — since this is budgeting + AI advice (not payments/lending), you're likely fine, but explicitly state in App Review notes that the app does **not** provide licensed financial advice, move money, or store payment credentials — this preempts a common reviewer question.
- [ ] If the AI chat gives advice-like language, consider an in-app disclaimer ("informational only, not financial advice") — reduces both review friction and liability.

### Assets

- [ ] App icon: 1024×1024 PNG, no alpha channel, no rounded corners (Apple applies the mask). Verify `assets/images/icon.png` meets this — check dimensions/alpha now.
- [ ] Screenshots for each required device size (6.7" iPhone at minimum; add iPad if `supportsTablet: true` stays enabled — it currently is, which means App Store requires iPad screenshots too, or you should set `supportsTablet: false` if the UI isn't actually iPad-optimized).
- [ ] App preview video (optional but improves conversion).
- [ ] App Store description, keywords, promotional text, support URL, marketing URL (optional).
- [ ] Age rating questionnaire (financial apps are typically 4+, but complete honestly — mention if AI chat content needs a rating bump).

### TestFlight (internal testing)

- [ ] Build a release with EAS: `eas build --platform ios --profile production` (or a dedicated `preview` profile).
- [ ] Submit to App Store Connect: `eas submit --platform ios` (needs an App Store Connect API key — generate one in App Store Connect → Users and Access → Keys, and configure it in `eas.json`/`eas submit` credentials).
- [ ] Internal testers (your Apple Developer team, up to 100, no review needed) can install immediately once the build processes.
- [ ] External TestFlight testers (if you want beta users beyond your team) require a **one-time Beta App Review** — separate and lighter-weight than the full App Store review, but still a review. Budget a day or two.
- [ ] Verify the build actually installs and runs end-to-end on a physical device via TestFlight (not just the simulator) before wider distribution — this catches provisioning/signing issues invisible in local builds.

## 5. Google Play Store

### Play Console setup

- [ ] Covered in §1 — confirm account verification is complete before proceeding.
- [ ] Create the app entry in Play Console with the final package name from §2 (`android.package` — also unchangeable after first upload).
- [ ] Complete the Play Console **App content** section: privacy policy URL, ads declaration (none, presumably), content rating questionnaire, target audience, data safety form (below), government apps declaration (no), COVID-19 tracing (no), news app (no).

### Data Safety form

- [ ] This is Google's equivalent of Apple's nutrition label — declare the same data flows: financial/transaction data collected and shared with Splitwise; financial data processed via Gemini; whether data is encrypted in transit (yes, standard HTTPS) and whether users can request deletion.
- [ ] Declare whether data collection is required for core functionality or optional (Splitwise sync is optional/opt-in per the existing connect/disconnect flow — reflect that).

### Assets

- [ ] Feature graphic (1024×500), hi-res icon (512×512), at least 2 screenshots per supported form factor (phone; tablet only if you support it).
- [ ] Short description (80 chars) and full description (4000 chars).
- [ ] Verify the adaptive icon layers (`android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png` — already present per `app.json`) render correctly at all Android icon shapes (circle, squircle, rounded square) — test via `eas build` + install, not just visually inspecting the PNGs.

### Internal testing track

- [ ] Build with EAS: `eas build --platform android --profile production` (produces an `.aab`).
- [ ] Submit or manually upload to the **Internal testing** track in Play Console (fastest path — no review delay, live in minutes, up to 100 testers via email list or a shareable opt-in link).
- [ ] This is where the §1 new-account requirement bites: before you can promote from testing to **Production** for the first time on a new account, Play requires the closed testing track (≥20 testers, 14 continuous days) described in §1. Internal testing itself has no such gate — start it immediately regardless.
- [ ] Confirm signing is handled by Play App Signing (Google-managed) rather than a local keystore — simpler and is EAS's default when you let Google manage the upload key.

## 6. Likely First-Rejection Risks (Specific to This App)

Everything above is standard-issue checklist work. These are things found by actually reading `useSplitwise.ts`, `SplitwiseAuthService.ts`, and the AI service layer — the specific spots in _this_ codebase most likely to cause a first-submission rejection or a reviewer back-and-forth, ranked roughly by likelihood.

1. **Reviewers can't test the Splitwise integration without a real Splitwise account.** `useSplitwise.ts` drives a live OAuth2/PKCE flow (`AuthSession.useAuthRequest` + `promptAsync`) against the actual Splitwise service — there's no mock/demo mode. App reviewers don't have a Splitwise account and won't create one mid-review. If they tap "Connect Splitwise" in Settings and hit a dead end, that's a textbook Apple Guideline 2.1 (App Completeness) hold or a Google "unable to verify" bounce.
   - Fix: in the App Review notes / Play Console reviewer instructions, either (a) supply a working demo Splitwise username/password so the reviewer can complete the OAuth flow, or (b) state explicitly that Splitwise is an optional, disconnect-able integration and point the reviewer at core flows (expense tracking, budgeting, AI chat) that work fully without it. Option (b) is cheaper and true given the connect/disconnect design already in place — just say so up front instead of hoping the reviewer figures it out.

2. **The Splitwise OAuth client secret ships inside the app binary.** `EXPO_PUBLIC_SPLITWISE_CLIENT_SECRET` (read in both `useSplitwise.ts` and `SplitwiseAuthService.ts`) is compiled into the JS bundle in plaintext and extractable from the shipped APK/IPA with basic reverse-engineering tools. This is a step worse than the Gemini key exposure already flagged in §2: an OAuth _client secret_ is supposed to never leave a trusted server. If it leaks and gets abused, Splitwise can revoke the app's API credentials outright — breaking the integration for every user, not just costing you API quota. Neither store's review explicitly greps for this today, but Google Play's automated pre-launch scanning has flagged hardcoded secrets in other apps before, so treat it as a real risk independent of store review, not just a review risk. Same two options as the Gemini key: proxy the token exchange through a minimal backend, or consciously accept the risk knowing recovery just means re-registering a new Splitwise API app if it's ever abused.

3. **No in-app disclaimer on the AI-generated financial advice.** Checked `chatService.ts`, `gemini.ts`, and `financialPlanService.ts` — none contain user-facing disclaimer copy (the only "disclaimer" strings in the codebase belong to the unrelated Impulse Buy Cooldown notification feature). Apple reviewers evaluating a Finance-category app that gives AI-generated advice commonly ask for an explicit "informational only, not licensed financial advice" disclosure somewhere in the chat flow. It's a small addition and cheaper to ship proactively than to add reactively after a rejection.

4. **`ios.supportsTablet: true` with no evidence of iPad-specific testing.** This setting in `app.json` obligates iPad screenshots in App Store Connect. If the UI hasn't actually been run on an iPad simulator, you risk either submitting stretched/incorrect iPad screenshots (an easy visual reject) or the reviewer finding real iPad layout bugs live. Quick call to make now: verify the UI on iPad, or flip this to `false` and skip the iPad surface entirely for v1.

5. **Data Safety / App Privacy answers must match observed network traffic exactly, not from memory.** Both stores cross-check declared data flows against what the app actually calls over the network (Google's automated traffic inspection is the stricter of the two). Since this app talks to `api.splitwise.com` and the Gemini endpoint, whoever fills out the Data Safety form (§5) and App Privacy questionnaire (§4) should do it by reading `src/services/splitwise/` and `src/services/gemini.ts` directly, not from a general sense of "what the app does." A declared-vs-actual mismatch is one of the most common real rejection reasons for apps with third-party integrations, not a hypothetical one.

6. **Sign in with Apple — likely a non-issue, but worth pre-empting.** Guideline 4.8 requires Sign in with Apple only when a third-party login is used to _set up or authenticate the user's app account_. This app has no account/login system at all — Splitwise connect is an optional Settings-screen data integration, not a way to log into BudgetMyBS itself — so the guideline shouldn't apply. Still, add a one-line note to App Review saying exactly that; reviewers sometimes flag third-party OAuth reflexively, and preempting the question in the review notes is faster than disputing a rejection after the fact.

_(For what it's worth, the OAuth mechanism itself is done right — `expo-auth-session` with PKCE routes through `ASWebAuthenticationSession` on iOS / Chrome Custom Tabs on Android rather than an embedded WebView, which is exactly the pattern both stores want. That part isn't a risk.)_

## 7. Cross-cutting QA before either submission

- [ ] Full run-through on a physical iOS device and a physical Android device (not just simulators/emulators) — Splitwise OAuth deep-linking and notification permission prompts behave differently on real devices.
- [ ] Test the Splitwise connect → sync → disconnect → reconnect flow end-to-end (given the recent "Phase 11a/11b/16" offline-resilience and disconnect work in git history, this is clearly an active area — make sure it's stable before it's in front of reviewers or beta users).
- [ ] Test with no network connectivity (airplane mode) to confirm the app degrades gracefully rather than crashing — reviewers do test this.
- [ ] Confirm `npm run typecheck` and `npm run lint` are clean.
- [ ] Strip or gate any `console.log`/debug output that might leak tokens or financial data in production builds.
- [ ] Verify deep link scheme (`budgetmybs://`, used for Splitwise OAuth redirect) doesn't collide with another installed app and is registered correctly in both platform configs.

## 8. Submission order (recommended)

1. **Start both developer account registrations today** (§1) — the Google 14-day new-account clock and any Apple Organization D-U-N-S wait are pure calendar time; run them in the background while you do everything else.
2. Finalize bundle IDs + EAS project (§2) — everything downstream depends on this being final.
3. Draft and host privacy policy + terms (§3) — needed as a form field in both consoles before you can even complete app setup.
4. Build + TestFlight internal testing (§4) — validate real-device behavior with your own team first, cheaply and without review delay.
5. Build + Play Internal testing track (§5) — same, in parallel with TestFlight since they don't block each other, and it's what starts the closed-testing clock toward Production access.
6. Fix anything internal/closed testing surfaces.
7. **Resolve the §6 first-rejection risks** — reviewer test story for Splitwise, secret exposure decision, AI disclaimer, iPad support decision, verified Data Safety/Privacy answers — before you submit, not after a rejection forces it.
8. Submit for Apple App Review + submit for Play Production review (once the 14-day closed testing window from step 5 is satisfied).
