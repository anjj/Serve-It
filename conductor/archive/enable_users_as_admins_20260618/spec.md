# Specification: Enable Users as Admins

## Overview
This track introduces the ability to promote existing users to Platform-wide Super Admins (`isAdmin`). This feature will add a simple mechanism in the existing users interface to toggle the administrator status of a user. 

## Functional Requirements
- **Admin Toggle UI:** Add a button/toggle in the current user management view to promote a user to an administrator.
- **Admin Demotion:** Allow an existing admin to demote another admin back to a regular user.
- **Backend API:** Create or update an API endpoint (e.g., Server Action or API route) to handle the `isAdmin` state toggle securely.
- **Authorization:** Only current users with `isAdmin` privileges can promote or demote other users.

## Non-Functional Requirements
- **Security:** Ensure the promotion/demotion endpoint is heavily protected and verifies the caller's admin status.
- **UI Feedback:** Provide clear visual feedback (e.g., success toasts, state updates) when a user's admin status is changed.
- **Testing:** Comprehensive tests for the new UI components and backend logic must be added to the current testing suite to ensure functionality and authorization rules are strictly enforced.

## Acceptance Criteria
- [ ] An existing admin can see a "Promote to Admin" (or similar) button next to regular users in the users list.
- [ ] Clicking the button successfully updates the user's `isAdmin` status in the database.
- [ ] An existing admin can demote another admin using a similar mechanism.
- [ ] Non-admin users cannot access the promotion/demotion functionality via UI or direct API calls.
- [ ] The change is reflected immediately in the UI without a full page reload.
- [ ] Unit and integration tests cover the new promotion/demotion logic and authorization checks.

## Out of Scope
- Creating new global admin dashboards or analytics views.
- Workspace-level admin roles (this focuses strictly on the platform-wide `isAdmin` flag).
