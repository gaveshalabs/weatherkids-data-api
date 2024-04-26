# Deploying the project to Firebase Functions

Github actions are configured through `firebase-deploy.yml` to deploy dev and prod environments to firebase.

Service account authentication is used to authenticate Github with Firebase (GCP) because Workload Identity Federation is not yet supported by Firebase API.

## Instructions
1. Create a Google Cloud Service Account with following permissions.
    - Cloud Functions Developer
    - Cloud Scheduler Admin
    - Service Account User
2. Create service account key
3. Copy the JSON and update Github secret `GITHUBDEPLOY_GCP_SERVICE_ACCOUNT`


For future references:
 - [Workload Identity Federation: Howto](https://github.com/google-github-actions/auth?tab=readme-ov-file)
 - [Using WIF from Github actions - notes](https://medium.com/@bbeesley/notes-on-workload-identity-federation-from-github-actions-to-google-cloud-platform-7a818da2c33e)