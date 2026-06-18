# Deployment Guide: Google Cloud Run

This guide provides instructions on how to deploy **Serve-it** to Google Cloud Run using GitHub Actions.

## 🏗️ Google Cloud Resources Needed

To deploy this application, you will need the following resources in Google Cloud:

1.  **Google Cloud Project**: A project with billing enabled.
2.  **Artifact Registry**: A Docker repository to host the application images.
3.  **Cloud Run**: The serverless platform where the application will run.
4.  **Cloud SQL (PostgreSQL)**: To host the application database.
5.  **Service Account**: A dedicated service account for GitHub Actions with the following roles:
    *   `roles/run.admin`
    *   `roles/iam.serviceAccountUser`
    *   `roles/artifactregistry.writer`
6.  **Workload Identity Federation**: To securely authenticate GitHub Actions with Google Cloud without using long-lived service account keys.

## 🔐 GitHub Secrets & Variables

Configure the following in your GitHub repository's **Settings > Secrets and variables > Actions**.

### Variables (`vars`)

| Name | Description | Example |
| :--- | :--- | :--- |
| `GOOGLE_PROJECT_ID` | Your Google Cloud Project ID | `my-project-123` |
| `GOOGLE_PROJECT_NUMBER` | Your Google Cloud Project Number | `1234567890` |
| `GOOGLE_REGION` | Deployment region | `us-central1` |
| `GOOGLE_ARTIFACT_REPO` | Name of your Artifact Registry repo | `serve-it-repo` |
| `GOOGLE_SERVICE_ACCOUNT` | Email of the deployment service account | `deploy@my-project.iam.gserviceaccount.com` |
| `NEXTAUTH_URL` | The public URL of your deployment | `https://serve-it-abc.a.run.app` |
| `AZURE_AD_TENANT_ID` | (Optional) Microsoft Entra ID Tenant ID | `common` or your-tenant-id |
| `SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_STORAGE_BUCKET` | The Supabase storage bucket name | `serve-it` |

### Secrets (`secrets`)

| Name | Description |
| :--- | :--- |
| `DATABASE_URL` | Connection string for Cloud SQL (PostgreSQL) |
| `NEXTAUTH_SECRET` | A random string for encrypting cookies |
| `AZURE_AD_CLIENT_ID` | Microsoft Entra ID Application (client) ID |
| `AZURE_AD_CLIENT_SECRET` | Microsoft Entra ID Client Secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (for backend access) |

## 🚀 Setup Steps

### 1. Enable APIs
Enable the required APIs in your Google Cloud Project:
```bash
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    iamcredentials.googleapis.com \
    sqladmin.googleapis.com
```

### 2. Configure Workload Identity Federation
Follow the [official documentation](https://github.com/google-github-actions/auth#workload-identity-federation) to set up a Workload Identity Pool and Provider for GitHub.
The workflow is configured to expect a pool named `github-pool` and a provider named `github-provider`.

### 3. Create Artifact Registry
Create a Docker repository:
```bash
gcloud artifacts repositories create serve-it-repo \
    --repository-format=docker \
    --location=us-central1
```

### 4. Database Setup
Ensure your Cloud SQL instance is accessible. Since this application uses Prisma, you must provide a standard PostgreSQL connection string in `DATABASE_URL`. If using Cloud SQL Auth Proxy or Private IP, adjust your deployment configuration accordingly.

### 5. Deploying
The deployment is triggered by **creating a new tag** in the repository.
```bash
git tag v1.0.0
git push origin v1.0.0
```
This will trigger the `Google Cloud Run Deployment` workflow, which builds the image, pushes it to the registry, and deploys it to Cloud Run.
