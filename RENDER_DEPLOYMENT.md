# Deploying GitHub Garden to Render

This guide will help you deploy GitHub Garden to Render for automatic execution every two days.

## Prerequisites

1. A GitHub account
2. A GitHub personal access token with `repo`, `workflow`, and `user` scopes
3. A Render account (sign up at [render.com](https://render.com) if you don't have one)

## Deployment Steps

### 1. Fork or Clone the Repository

Make sure you have a copy of the GitHub Garden repository in your GitHub account.

### 2. Create a New Web Service on Render

1. Log in to your Render dashboard
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service with the following settings:
   - **Name**: GitHub Garden (or any name you prefer)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run render`

### 3. Set Environment Variables

In the Render dashboard, add the following environment variables:

- `GITHUB_USERNAME`: Your GitHub username
- `GITHUB_EMAIL`: Your GitHub email address
- `GITHUB_TOKEN`: Your GitHub personal access token
- `RENDER`: Set to `true`

### 4. Deploy the Service

Click "Create Web Service" to deploy GitHub Garden to Render.

## How It Works

Once deployed, GitHub Garden will:

1. Run immediately upon deployment
2. Automatically run every two days
3. Check for missing contributions from January to December
4. Make between 18 and 50 commits per day to fill in gaps

## Monitoring

You can monitor the execution of GitHub Garden in the Render logs. Each run will show:

- When the script started
- How many days were processed
- The results of the contribution filling process

## Troubleshooting

If you encounter issues:

1. Check the Render logs for error messages
2. Verify your GitHub token has the correct permissions
3. Ensure your environment variables are set correctly

## Notes

- The script is designed to run in a headless environment on Render
- Progress bars and animations are disabled in the Render deployment mode
- The script will only make commits for days with no contributions