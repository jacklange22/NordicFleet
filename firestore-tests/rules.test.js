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
const {doc, setDoc, getDoc, updateDoc} = require('firebase/firestore');

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

describe('coach permission (on the athlete user doc)', () => {
  beforeEach(async () => {
    await seed(db =>
      setDoc(doc(db, 'users/alice'), {
        email: 'a@b.com',
        role: 'athlete',
        coachId: 'coach',
        coachPermission: 'comment',
      }),
    );
  });

  it('the athlete can set their own coachPermission', async () => {
    await assertSucceeds(
      updateDoc(doc(asAlice(), 'users/alice'), {coachPermission: 'view'}),
    );
  });

  it('the linked coach can READ the permission but CANNOT raise it', async () => {
    await assertSucceeds(getDoc(doc(asCoach(), 'users/alice')));
    await assertFails(
      updateDoc(doc(asCoach(), 'users/alice'), {coachPermission: 'edit'}),
    );
  });

  it('an unrelated user cannot read or change the permission', async () => {
    await assertFails(getDoc(doc(asBob(), 'users/alice')));
    await assertFails(
      updateDoc(doc(asBob(), 'users/alice'), {coachPermission: 'edit'}),
    );
  });
});

describe('edit access (update) — ship-edit confidence', () => {
  beforeEach(async () => {
    await seed(async db => {
      await setDoc(doc(db, 'users/alice'), {
        email: 'a@b.com',
        role: 'athlete',
        coachId: 'coach',
      });
      await setDoc(doc(db, 'users/alice/skis/s1'), {name: 'Ski', flex: 70});
      await setDoc(doc(db, 'users/alice/waxLogs/w1'), {
        skiId: 's1',
        notes: 'old',
      });
      await setDoc(doc(db, 'users/alice/testLogs/t1'), {
        skiId: 's1',
        glideRating: 5,
      });
    });
  });

  it('owner CAN update own ski / waxLog / testLog', async () => {
    await assertSucceeds(
      updateDoc(doc(asAlice(), 'users/alice/skis/s1'), {flex: 80}),
    );
    await assertSucceeds(
      updateDoc(doc(asAlice(), 'users/alice/waxLogs/w1'), {notes: 'new'}),
    );
    await assertSucceeds(
      updateDoc(doc(asAlice(), 'users/alice/testLogs/t1'), {glideRating: 9}),
    );
  });

  it('linked coach CANNOT update athlete ski / waxLog / testLog', async () => {
    await assertFails(
      updateDoc(doc(asCoach(), 'users/alice/skis/s1'), {flex: 99}),
    );
    await assertFails(
      updateDoc(doc(asCoach(), 'users/alice/waxLogs/w1'), {notes: 'x'}),
    );
    await assertFails(
      updateDoc(doc(asCoach(), 'users/alice/testLogs/t1'), {glideRating: 1}),
    );
  });

  it('an unrelated user CANNOT update athlete data', async () => {
    await assertFails(
      updateDoc(doc(asBob(), 'users/alice/skis/s1'), {flex: 1}),
    );
    await assertFails(
      updateDoc(doc(asBob(), 'users/alice/waxLogs/w1'), {notes: 'x'}),
    );
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

describe('athleteInvites', () => {
  beforeEach(async () => {
    await seed(db =>
      setDoc(doc(db, 'athleteInvites/inv1'), {
        coachUid: 'coach',
        coachName: 'Coach',
        email: 'a@b.com',
        token: 'tok1',
        status: 'pending',
      }),
    );
  });

  it('a coach can create an invite they own, starting pending', async () => {
    await assertSucceeds(
      setDoc(doc(asCoach(), 'athleteInvites/inv2'), {
        coachUid: 'coach',
        email: 'x@y.com',
        token: 't2',
        status: 'pending',
      }),
    );
  });

  it('rejects a non-pending invite or one owned by someone else', async () => {
    await assertFails(
      setDoc(doc(asCoach(), 'athleteInvites/inv3'), {
        coachUid: 'coach',
        email: 'x@y.com',
        token: 't3',
        status: 'accepted',
      }),
    );
    await assertFails(
      setDoc(doc(asCoach(), 'athleteInvites/inv4'), {
        coachUid: 'someone-else',
        email: 'x@y.com',
        token: 't4',
        status: 'pending',
      }),
    );
  });

  it('only the owning coach can read an invite (no enumeration)', async () => {
    await assertSucceeds(getDoc(doc(asCoach(), 'athleteInvites/inv1')));
    await assertFails(getDoc(doc(asBob(), 'athleteInvites/inv1')));
    await assertFails(getDoc(doc(asAnon(), 'athleteInvites/inv1')));
  });

  it('the owning coach can revoke; others cannot update', async () => {
    await assertSucceeds(
      updateDoc(doc(asCoach(), 'athleteInvites/inv1'), {status: 'revoked'}),
    );
    await assertFails(
      updateDoc(doc(asBob(), 'athleteInvites/inv1'), {status: 'revoked'}),
    );
  });
});

describe('fleetSuggestions', () => {
  const newSuggestion = (overrides = {}) => ({
    coachUid: 'coach',
    athleteUid: 'alice',
    targetType: 'ski',
    targetId: 'ski1',
    suggestedChanges: {flex: 80},
    comment: 'try',
    status: 'pending',
    ...overrides,
  });

  beforeEach(async () => {
    await seed(async db => {
      await setDoc(doc(db, 'users/alice'), {
        email: 'a',
        role: 'athlete',
        coachId: 'coach',
        coachPermission: 'comment',
      });
      await setDoc(doc(db, 'fleetSuggestions/s1'), newSuggestion());
    });
  });

  it('a comment coach can create a suggestion', async () => {
    await assertSucceeds(
      setDoc(doc(asCoach(), 'fleetSuggestions/s2'), newSuggestion()),
    );
  });

  it('a view-only coach cannot create a suggestion', async () => {
    await seed(db =>
      setDoc(doc(db, 'users/alice'), {
        email: 'a',
        role: 'athlete',
        coachId: 'coach',
        coachPermission: 'view',
      }),
    );
    await assertFails(
      setDoc(doc(asCoach(), 'fleetSuggestions/s3'), newSuggestion()),
    );
  });

  it('the coach cannot accept/reject - only the athlete can', async () => {
    await assertFails(
      updateDoc(doc(asCoach(), 'fleetSuggestions/s1'), {status: 'accepted'}),
    );
    await assertSucceeds(
      updateDoc(doc(asAlice(), 'fleetSuggestions/s1'), {status: 'accepted'}),
    );
  });

  it('both parties can read; an unrelated user cannot', async () => {
    await assertSucceeds(getDoc(doc(asCoach(), 'fleetSuggestions/s1')));
    await assertSucceeds(getDoc(doc(asAlice(), 'fleetSuggestions/s1')));
    await assertFails(getDoc(doc(asBob(), 'fleetSuggestions/s1')));
  });

  it('a coach cannot forge a suggestion as another coach / for a non-athlete', async () => {
    await assertFails(
      setDoc(
        doc(asCoach(), 'fleetSuggestions/s4'),
        newSuggestion({coachUid: 'someone-else'}),
      ),
    );
    await assertFails(
      setDoc(doc(asBob(), 'fleetSuggestions/s5'), newSuggestion({coachUid: 'bob'})),
    );
  });

  it('rejects an unknown targetType', async () => {
    await assertFails(
      setDoc(
        doc(asCoach(), 'fleetSuggestions/s6'),
        newSuggestion({targetType: 'profile'}),
      ),
    );
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
