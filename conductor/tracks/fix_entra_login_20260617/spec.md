# Specification: Fix Entra ID (Azure AD) Login Account Linkage Bug

## Overview
When a user attempts to log in using Azure AD (Entra ID), NextAuth's token callback retrieves OAuth parameters including `ext_expires_in` (Azure AD-specific parameter). Since next-auth's Prisma adapter passes the token properties directly to Prisma, and `ext_expires_in` is not defined in the `Account` model of the database schema, Prisma throws a validation error, preventing users from logging in.

This track updates the database schema to include `ext_expires_in` and runs a database migration to resolve this validation error.

## Functional Requirements
1. **Schema Update**:
   - Add `ext_expires_in Int?` to the `Account` model in `prisma/schema.prisma`.
2. **Database Migration**:
   - Generate and apply a Prisma migration to update the database schema.

## Acceptance Criteria
- Prisma schema includes `ext_expires_in Int?` field on `Account` model.
- A new migration file is created and successfully applied to the database.
- Login with azure-ad does not fail due to the `ext_expires_in` validation error.
