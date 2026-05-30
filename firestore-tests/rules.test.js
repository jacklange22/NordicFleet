// Firestore security-rules regression tests, run against the local emulator.
//
//   npm run test:rules
//
// These lock in the CURRENT rules (firestore.rules) before any new
// security-sensitive collections are added. They never touch live Firestore.

const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {doc, setDoc, getDoc} = require('firebase/firestore');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'nordicfleet-rules-test',
    firestore: {
      rules: fs.readFileSync(
        path.resolve(__dirname, '../firestore.rules'),
        'utf8',
      ),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const asAlice = () => testEnv.authenticatedContext('alice').firestore();
const asBob = () => testEnv.authenticatedContext('bob').firestore();
const asCoach = () => testEnv.authenticatedContext('coach').firestore();
const asAnon = () => testEnv.unauthenticatedContext().firestore();
const seed = fn => testEnv.withSecurityRulesDisabled(ctx => fn(ctx.firestore()));

describe('users', () => {
  it('unauthenticated cannot read a user doc', async () => {
    await seed(db =>
      setDoc(doc(db, 'users/alice'), {email: 'a@b.com', role: 'athlete'}),
    );
    await assertFails(getDoc(doc(asAnon(), 'users/alice')));
  });

  it('owner can read and write own profile', async () => {
    await assertSucceeds(
      setDoc(doc(asAlice(), 'users/alice'), {email: 'a@b.com', role: 'athlete'}),
    );
    await assertSucceeds(getDoc(doc(asAlice(), 'users/alice')));
  });

  it('a user cannot read another user private (athlete) doc', async () => {
    await seed(db =>
      setDoc(doc(db, 'users/alice'), {email: 'a@b.com', role: 'athlete'}),
    );
    await assertFails(getDoc(doc(asBob(), 'users/alice')));
  });

  it('a user cannot write another user profile', async () => {
    await assertFails(setDoc(doc(asBob(), 'users/alice'), {email: 'x'}));
  });
});

describe('athlete subcollections + coach access', () => {
  beforeEach(async () => {
    await seed(async db => {
      await setDoc(doc(db, 'users/alice'), {
        email: 'a@b.com',
        role: 'athlete',
        coachId: 'coach',
      });
      await setDoc(doc(db, 'users/alice/skis/s1'), {name: 'Ski'});
      await setDoc(doc(db, 'users/alice/waxLogs/w1'), {note: 'wax'});
      await setDoc(doc(db, 'users/alice/testLogs/t1'), {note: 'test'});
    });
  });

  it('owner reads own ski', async () => {
    await assertSucceeds(getDoc(doc(asAlice(), 'users/alice/skis/s1')));
  });

  it('linked coach CAN READ athlete ski / waxLog / testLog', async () => {
    await assertSucceeds(getDoc(doc(asCoach(), 'users/alice/skis/s1')));
    await assertSucceeds(getDoc(doc(asCoach(), 'users/alice/waxLogs/w1')));
    await assertSucceeds(getDoc(doc(asCoach(), 'users/alice/testLogs/t1')));
  });

  it('linked coach CANNOT WRITE athlete ski / waxLog / testLog', async () => {
    await assertFails(
      setDoc(doc(asCoach(), 'users/alice/skis/s1'), {name: 'Hacked'}),
    );
    await assertFails(
      setDoc(doc(asCoach(), 'users/alice/waxLogs/w1'), {note: 'x'}),
    );
    await assertFails(
      setDoc(doc(asCoach(), 'users/alice/testLogs/t1'), {note: 'x'}),
    );
  });

  it('an unrelated user cannot read athlete data', async () => {
    await assertFails(getDoc(doc(asBob(), 'users/alice/skis/s1')));
  });
});

describe('messages', () => {
  beforeEach(async () => {
    await seed(async db => {
      await setDoc(doc(db, 'users/alice'), {
        email: 'a',
        role: 'athlete',
        coachId: 'coach',
      });
      await setDoc(doc(db, 'messages/m1'), {
        fromUid: 'coach',
        toUid: 'alice',
        body: 'hi',
        read: false,
      });
    });
  });

  it('only sender and recipient can read a message', async () => {
    await assertSucceeds(getDoc(doc(asAlice(), 'messages/m1'))); // recipient
    await assertSucceeds(getDoc(doc(asCoach(), 'messages/m1'))); // sender
    await assertFails(getDoc(doc(asBob(), 'messages/m1'))); // other
  });
});

describe('marketingSignups', () => {
  it('anyone can create a valid signup but clients cannot read them', async () => {
    await assertSucceeds(
      setDoc(doc(asAnon(), 'marketingSignups/x1'), {
        email: 'a@b.com',
        source: 'home',
        role: 'athlete',
        createdAt: new Date(),
      }),
    );
    await assertFails(getDoc(doc(asAnon(), 'marketingSignups/x1')));
  });

  it('rejects a signup with extra keys', async () => {
    await assertFails(
      setDoc(doc(asAnon(), 'marketingSignups/x2'), {
        email: 'a@b.com',
        source: 'home',
        role: 'athlete',
        createdAt: new Date(),
        evil: true,
      }),
    );
  });
});
