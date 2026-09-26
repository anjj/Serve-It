# Specification: Temporary Demo Share

## Overview
Prospective clients must be able to experience the core value of Serve-it without sign-up.

## Business Requirements
- Anonymous 1-hour live link.
- No recovery or dashboard interface for anonymous uploaders.
- Size limit of 2 MB.
- Server-side extension check (.html/.htm).
- Rate limit of 5 uploads per IP per hour.
- Global active files limit of 500 files.
- Serves demo links unauthenticated with private caching and noindex robots tags.
- Background sweep + lazy deletion on expired links.
