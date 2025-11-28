# Deployment Guide

## Prerequisites

- GitHub account
- MongoDB Atlas account (free tier is fine)
- Vercel account (free tier is fine)

## Step 1: Set Up MongoDB Atlas

1. **Create a MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account (M0 free tier is sufficient)

2. **Create a Cluster**
   - Create a new cluster (free tier M0)
   - Choose your preferred cloud provider and region
   - Wait for the cluster to be created (~3-5 minutes)

3. **Set Up Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password (save this!)
   - Set privileges to "Atlas admin" (or "Read and write to any database")
   - Click "Add User"

4. **Set Up Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add Vercel's IP ranges or keep "Anywhere" for simplicity
   - Click "Confirm"

5. **Get Your Connection String**
   - Go to "Database" > Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)
   - Replace `<password>` with your database user password
   - Replace `<database>` with a database name (e.g., `kanban-fitness`)

## Step 1.5: Test Connection with MongoDB Compass (Optional but Recommended)

**Using MongoDB Compass to Test Your Connection:**

1. **Download MongoDB Compass**
   - Download from: https://www.mongodb.com/try/download/compass
   - Install the application

2. **Connect Using Compass**
   - Open MongoDB Compass
   - In Atlas, go to "Database" > "Connect" > "Connect using MongoDB Compass"
   - Copy the connection string shown
   - Paste it into Compass and replace `<password>` with your actual password
   - Click "Connect"

3. **Verify Connection**
   - Once connected, you should see your cluster
   - Create a database (e.g., `kanban-fitness`) if it doesn't exist
   - You can browse collections and verify everything works

4. **Get Connection String for Your App**
   - The connection string format is the same as what Compass uses
   - From Atlas: "Connect" > "Connect your application" 
   - Or use the same string from Compass, just ensure it includes the database name:
     ```
     mongodb+srv://username:password@cluster.mongodb.net/kanban-fitness?retryWrites=true&w=majority
     ```

**Benefits of Using Compass:**
- ✅ Test your connection before configuring the app
- ✅ View and manage your data visually
- ✅ Verify collections are created correctly
- ✅ Debug any connection issues
- ✅ Browse your kanban and fitness data easily

## Step 2: Configure Environment Variables

1. **Local Development**
   - Open `.env.local` file (already created)
   - Replace the `MONGODB_URI` value with your actual connection string
   - Example:
     ```
     MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/kanban-fitness?retryWrites=true&w=majority
     ```

2. **Test Locally**
   - Run `npm run dev`
   - The app should start on http://localhost:6767
   - Check the browser console for any errors
   - The app will work with localStorage if MongoDB isn't configured yet

## Step 3: Push to GitHub

1. **Initialize Git Repository** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit - mobile responsive with MongoDB integration"
   ```

2. **Create GitHub Repository**
   - Go to https://github.com/new
   - Create a new repository (e.g., "kanban-fitness")
   - Do NOT initialize with README, .gitignore, or license

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 4: Deploy to Vercel

1. **Import Project**
   - Go to https://vercel.com
   - Sign up/login with your GitHub account
   - Click "Add New" > "Project"
   - Import your GitHub repository

2. **Configure Environment Variables in Vercel**
   - In the project settings, go to "Environment Variables"
   - Add `MONGODB_URI` with your MongoDB connection string
   - Set it for Production, Preview, and Development environments
   - Click "Save"

3. **Deploy**
   - Vercel will auto-detect Next.js
   - Click "Deploy"
   - Wait for the build to complete (~2-3 minutes)

4. **Access Your App**
   - Once deployed, Vercel will provide a URL like: `https://your-app.vercel.app`
   - Your app is now live and accessible from any device!

## Step 5: Migrate Existing Data (Optional)

If you have existing data in localStorage:

1. **One-Time Migration**
   - The app will automatically try to sync localStorage data to MongoDB when you first load it
   - Or you can manually trigger migration using the migration utility
   - Data will be preserved in localStorage as backup

## Step 6: Mobile Access

1. **Install as PWA (Progressive Web App)**
   - On mobile, open the app in your browser
   - Look for "Add to Home Screen" or "Install App" prompt
   - The app will work like a native app

2. **Access from Any Device**
   - Simply open the Vercel URL on any device
   - All your data will sync automatically across devices

## Troubleshooting

### MongoDB Connection Issues
- Verify your connection string is correct
- Check that your IP address is whitelisted in MongoDB Atlas
- Ensure your database user password is correctly URL-encoded in the connection string

### Build Errors on Vercel
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Verify MongoDB connection string format

### Data Not Syncing
- Check browser console for errors
- Verify MongoDB connection is working (check Network tab)
- Ensure you're online (offline mode uses localStorage only)

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes (for cloud sync) |
| `NEXT_PUBLIC_APP_URL` | Your app's URL (auto-detected in production) | No |

## Notes

- The app works with **localStorage only** if MongoDB is not configured
- Data syncs automatically every 30 seconds when online
- Changes are saved locally immediately, then synced to cloud in background
- Offline mode is fully supported with localStorage fallback

## Verifying Database Sync

### Quick Verification

1. **Check Sync Status Indicator**
   - Look at the bottom-left corner of your screen
   - Green checkmark = Synced ✅
   - Spinning icon = Syncing in progress 🔄
   - Red alert = Sync error ⚠️
   - Click the refresh button for manual sync

2. **Verify in MongoDB Compass**
   - Open MongoDB Compass
   - Connect to your cluster
   - Browse your database
   - Check collections:
     - `kanbandata` - Your kanban tasks
     - `fitnessdata` - Your fitness entries
   - Compare document counts with your app

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Application > Local Storage
   - Look for:
     - `last-sync-kanban` - Last kanban sync timestamp
     - `last-sync-fitness` - Last fitness sync timestamp

### Detailed Sync Information

See **SYNC_GUIDE.md** for comprehensive sync verification instructions, troubleshooting, and best practices.

