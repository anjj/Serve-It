# Implementation Plan: Enable Users as Admins

## Phase 1: Backend API for Admin Toggling
- [x] Task: Implement server action/API for toggling admin status 5dc21a4
    - [ ] Write tests: Create failing tests for the new `toggleAdminStatus` server action ensuring only admins can call it, and it correctly updates the database.
    - [ ] Implement: Develop the `toggleAdminStatus` logic (verify session, verify `isAdmin`, update user record).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backend API for Admin Toggling' (Protocol in workflow.md)

## Phase 2: UI Implementation for Admin Toggling
- [ ] Task: Add admin toggle to Users UI
    - [ ] Write tests: Create failing component tests for the users list to verify the toggle button appears only for admins and displays the correct state.
    - [ ] Implement: Update the user list component to include the toggle button, wire it up to the server action, and implement optimistic UI updates or revalidation.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Implementation for Admin Toggling' (Protocol in workflow.md)
