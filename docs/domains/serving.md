# Domain: Short URL Document Serving

This domain controls the routing, authorization, and rendering of uploaded HTML documents to end-users via personalized short URLs.

---

## 1. How It Works (Non-Technical Summary)
The application serves documents via simple, human-friendly URLs: `/s/[customer_slug]/[file_slug]`. When someone visits this URL, the system verifies their identity and validates that they have permission to access the workspace. Once authorized, it retrieves the original HTML document from Supabase storage and streams it directly to the browser.

---

## 2. Serving & Delivery Architecture

```
   [User Browser request to /s/acme/project-docs]
                        |
            Is user authenticated?
                +------(No)------> [Redirect to Sign-In]
                |
              (Yes)
                v
         Is user Admin?
            +------(Yes)------> [Proceed to Download]
            |
           (No)
            v
     Check membership in workspace "acme"
            |
       Is member?
            +------(No)------> [403 Access Denied]
            |
          (Yes)
            v
   [Supabase Storage] -> Download file blob via storagePath
            |
   Extract HTML text content from blob
            |
   Return HTTP Response with "text/html" Headers
```

---

## 3. Technical Implementation & Business Rules

### Core Components
- **Dynamic App Router**: `/s/[customer_slug]/[file_slug]/route.ts` (Handles `GET` requests).
- **Storage Service Utility**: `downloadFile` function in [storage.ts](file:///home/andres.julian/github/serve-it/src/lib/storage.ts).

### HTTP Headers and Caching Policies
To ensure security and up-to-date document serving, the route returns the HTML with the following headers:
- `Content-Type: text/html; charset=utf-8` (Guarantees proper document rendering).
- `Cache-Control: private, max-age=0, must-revalidate` (Forces browsers to re-authorize request every time, preventing local cache leaks).
- `X-Content-Type-Options: nosniff` (Standard security header enforcing strict MIME checks).

### Security Resolution
Standard users must belong to the workspace associated with the `customer_slug` to view the document. Platform admins bypass workspace association checks and can view any served document.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `302 Found / Redirect`   | Missing active NextAuth session. | Redirects user to `/auth/signin`. |
| `403 Access Denied`      | Authenticated user is not a member of this workspace. | Log in with an authorized account. |
| `404 Workspace not found`| No Customer exists with the provided `customer_slug`. | Check the URL spelling. |
| `404 File not found`     | The document slug does not exist in this workspace. | Check the file slug spelling. |
| `500 Error serving file` | Supabase download failure or connection error. | Verify Supabase credentials and health. |
