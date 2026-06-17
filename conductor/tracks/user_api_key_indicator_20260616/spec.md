# Specification: User API Key Indicator in Admin Panel

## Overview
When administrators view users in the Admin panel, they currently cannot identify if a user has already had an API key generated. This track adds a visual indicator (a small green badge with a key icon reading "Key Generated") next to the user's name if they have one or more API keys.

## Functional Requirements
1. **User Query Extension:**
   - Update the GET handler `/api/admin/users` to include user API key relation details (`apiKeys: { select: { id: true } }`).
2. **Frontend UI Update:**
   - In `/admin/users` page, display a small green badge with a `Key` icon and the text "Key Generated" next to the user's name if `u.apiKeys` contains one or more entries.
   - The badge should dynamically update after an API key is generated and saved.

## Acceptance Criteria
- `/api/admin/users` response returns `apiKeys` property for each user.
- `/admin/users` page displays the green key badge next to users who have generated API keys.
- Unit/integration tests are updated to verify the behavior.
