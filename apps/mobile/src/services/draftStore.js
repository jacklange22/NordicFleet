// In-memory edit drafts.
//
// Leaving an edit screen via the bottom nav (or back) should not silently
// lose unsaved work. Instead of a destructive "Discard changes?" prompt, the
// edit screens autosave their in-progress state here, keyed by the record
// being edited, and restore it when the screen is re-opened. The draft is
// cleared after a successful Save.
//
// Scope: local, in-memory - it survives unmount/remount within an app
// session (the "tap a tab, come back" case). It does NOT survive a full app
// restart; persisting to AsyncStorage is a future upgrade.

const drafts = new Map();

/** Draft key for a wax-log edit. */
export const waxDraftKey = logId => (logId ? `wax:${logId}` : null);

/** Draft key for a test-log edit. */
export const testDraftKey = logId => (logId ? `test:${logId}` : null);

export const getDraft = key => (key ? drafts.get(key) : undefined);

export const setDraft = (key, value) => {
  if (key) {
    drafts.set(key, value);
  }
};

export const clearDraft = key => {
  if (key) {
    drafts.delete(key);
  }
};

// Test helper.
export const __resetDrafts = () => {
  drafts.clear();
};
