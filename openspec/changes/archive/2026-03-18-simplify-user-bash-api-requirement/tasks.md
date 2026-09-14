## 1. Extension simplification

- [x] 1.1 Update `index.ts` to import and use Pi's exported
      `createLocalBashOperations()` for `user_bash` execution
- [x] 1.2 Remove the duplicated local `createLocalBashOperations()` and
      `killProcessTree()` helpers from `index.ts`
- [x] 1.3 Verify the existing rewrite and fallback behavior remains unchanged
      for agent `bash` tool calls and user `!<cmd>` commands

## 2. Documentation and release communication

- [x] 2.1 Update `README.md` to state that `pi-rtk` requires Pi v0.60.0 or later
      and explain the dependency on Pi's exported `createLocalBashOperations()`
      helper
- [x] 2.2 Update `CHANGELOG.md` for the next release with a breaking-change
      entry that announces the new minimum supported Pi version in Common
      Changelog style
- [x] 2.3 Verify the changelog wording clearly directs users on Pi versions
      earlier than v0.60.0 to remain on the previous `pi-rtk` release until they
      upgrade Pi
