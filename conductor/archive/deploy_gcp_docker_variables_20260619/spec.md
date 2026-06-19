# Specification: Deploy GCP Docker Variables

## Overview
This track focuses on configuring the deployment of the Serve-it application to Google Cloud Run, utilizing Docker. The objective is to pass the existing GitHub environment secrets (from the `live` environment) to the Docker container or Cloud Run service during the automated CI/CD deployment process.

## Target Architecture
- **Hosting:** Google Cloud Run (containerized deployment).
- **Secrets Management:** Environment variables are already configured as environment secrets in the GitHub `live` environment. They will be injected via the GitHub Actions CI/CD pipeline during deployment.

## Functional Requirements
- Configure the GitHub Actions CI/CD workflow to map the `live` environment secrets and securely inject them into the Docker build or directly to the Google Cloud Run deployment command.
- The targeted variables include Database credentials (Postgres), Authentication secrets (NextAuth), Storage credentials (Supabase), and all other core application secrets required for runtime.
- Update the deployment scripts or GitHub Actions YAML file (`.github/workflows/*`) to consume the GitHub `live` environment secrets.

## Non-Functional Requirements
- **Security:** Secrets must not be exposed in build logs or hardcoded anywhere in the codebase.
- **Automation:** The CI/CD pipeline should automate the deployment process, passing the necessary flags/variables seamlessly.

## Acceptance Criteria
- [ ] The GitHub Actions workflow is updated to reference the `live` environment and pass its secrets to the Cloud Run deployment process.
- [ ] The deployment succeeds without manual intervention.
- [ ] The Cloud Run service correctly accesses the database, authentication, and storage services using the injected secrets.
- [ ] No secrets are exposed in code or build logs.

## Out of Scope
- Creating new secrets (they are already set up).
- Migrating the database to a new provider.
- Changes to the core application logic.
