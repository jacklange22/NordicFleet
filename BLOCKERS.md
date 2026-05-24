# Blockers

Items requiring user action before the app will run.

## Environment

1. **Node / npm not installed** in this autonomous environment. The brief required `npm install` after editing `package.json`. I could not run it. **Action required:** run `npm install` from `/Users/jacklange/NordicFleet`. After that, `npm test` and `npm run lint` should both work. The `package.json` has been updated to add `@react-native-firebase/auth`, `@react-native-firebase/firestore`, `@react-native-async-storage/async-storage`, `@testing-library/react-native`, and `@testing-library/jest-native`, and to remove `expo` and `@react-native-community/viewpager`.

2. **iOS pods not installed.** After `npm install`, run:
   ```
   cd ios && bundle install && bundle exec pod install
   ```
   This is required because new native modules (`@react-native-firebase/auth`, `@react-native-firebase/firestore`, `@react-native-async-storage/async-storage`) need iOS pods.

3. **Xcode required.** Install Xcode from the App Store, accept the license, and open a project once so it provisions properly.

## Firebase

4. **Enable Email/Password auth** in the Firebase console for project `nordicfleet-11e67`:
   - Navigate to Authentication → Sign-in method → Email/Password → Enable.

5. **Create the Firestore database** (production mode) in the Firebase console:
   - Navigate to Firestore Database → Create database → Production mode → pick a region (us-central1 is fine).

6. **Deploy Firestore security rules** (file `firestore.rules` was written to the project root):
   ```
   firebase deploy --only firestore:rules
   ```
   Alternatively, paste the contents of `firestore.rules` into the Firebase console under Firestore → Rules → Publish.

