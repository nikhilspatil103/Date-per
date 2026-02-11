# DatePer Deployment Guide

## Prerequisites
- MongoDB Atlas account with connection string
- Cloudinary account with credentials
- GitHub account
- Render.com account (free)

## Step 1: Setup Cloudinary (if not done)
1. Go to https://cloudinary.com/users/register/free
2. Sign up for free account
3. From dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

## Step 2: Prepare Backend for Deployment

### Install Cloudinary
```bash
cd backend
npm install cloudinary
```

### Update .env file
Copy `.env.example` to `.env` and fill in:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dateper
JWT_SECRET=your_random_secret_key_min_32_chars
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Step 3: Push to GitHub
```bash
cd /Users/nikhil.patil/Documents/Date-per/Date-per
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dateper.git
git push -u origin main
```

## Step 4: Deploy to Render

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: dateper-backend
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   - MONGODB_URI
   - JWT_SECRET
   - JWT_EXPIRE
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET

6. Click "Create Web Service"

7. Wait for deployment (5-10 minutes)

8. Copy your deployment URL (e.g., `https://dateper-backend.onrender.com`)

## Step 5: Update Frontend API URLs

Create a config file in your frontend:

**File: `Date-per/config/api.ts`**
```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.102:3000'  // Local development
  : 'https://your-app.onrender.com';  // Production

export default API_URL;
```

Then replace all `http://192.168.1.102:3000` with `API_URL` in:
- services/auth.ts
- services/websocket.ts
- All component files

## Step 6: Test Deployment

1. Open your Render URL in browser
2. You should see: `{"message":"DatePer API is running"}`
3. Test login endpoint: `https://your-app.onrender.com/auth/login`

## Step 7: Update Mobile App

1. Update API_URL in frontend
2. Rebuild the app
3. Test on multiple devices

## Notes

- **Free tier limitations**:
  - Render: Sleeps after 15 min inactivity (cold start ~30s)
  - MongoDB Atlas: 512MB storage
  - Cloudinary: 25GB bandwidth/month

- **Custom domain** (optional):
  - Buy domain from Namecheap/GoDaddy
  - Add to Render settings

- **HTTPS**: Automatically provided by Render

## Troubleshooting

- **Deployment fails**: Check build logs in Render dashboard
- **Can't connect**: Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- **Images not uploading**: Check Cloudinary credentials in Render env vars
