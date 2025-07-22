# Deploy Flask API to Railway

## Steps:

1. **Create a Railway account** at https://railway.app
2. **Create a new project** and connect your GitHub repository
3. **Add environment variables** in Railway dashboard:
   - `PORT=5000`
   - `FLASK_ENV=production`

4. **Create a Procfile** in your project root:
   ```
   web: python app.py
   ```

5. **Update app.py** for production:
   ```python
   import os
   
   if __name__ == '__main__':
       port = int(os.environ.get('PORT', 5000))
       app.run(debug=False, host='0.0.0.0', port=port)
   ```

6. **Deploy** - Railway will automatically deploy your Flask API

7. **Update frontend API URL**:
   - Get your Railway app URL (e.g., `https://your-app.railway.app`)
   - Update the API calls in your React app to use this URL instead of localhost

## Alternative: Heroku, Render, or DigitalOcean

You can also deploy to:
- **Heroku** (has free tier limitations)
- **Render** (free tier available)
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**