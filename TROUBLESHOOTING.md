# Troubleshooting Guide

Common issues and their solutions for the Interview Preparation Platform.

## Table of Contents
- [Setup Issues](#setup-issues)
- [Database Issues](#database-issues)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Authentication Issues](#authentication-issues)
- [Development Issues](#development-issues)

---

## Setup Issues

### Issue: "Node.js not found" or "npm not found"

**Symptoms:**
```bash
'node' is not recognized as an internal or external command
```

**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install Node.js (includes npm)
3. Restart your terminal
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

---

### Issue: "PostgreSQL not found"

**Symptoms:**
```bash
'psql' is not recognized as an internal or external command
```

**Solution:**

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run installer
3. Remember the password you set for `postgres` user
4. Add to PATH: `C:\Program Files\PostgreSQL\14\bin`

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

---

### Issue: "npm install fails with permission errors"

**Solution:**

**Windows:**
- Run terminal as Administrator

**macOS/Linux:**
```bash
# Don't use sudo, fix npm permissions instead
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

---

## Database Issues

### Issue: "Database 'interview_prep' does not exist"

**Symptoms:**
```
Error: database "interview_prep" does not exist
```

**Solution:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE interview_prep;

# Verify
\l

# Exit
\q
```

---

### Issue: "Password authentication failed for user 'postgres'"

**Symptoms:**
```
Error: password authentication failed for user "postgres"
```

**Solution:**
1. Check your `.env` file in backend directory
2. Ensure `DB_PASSWORD` matches your PostgreSQL password
3. If you forgot password:

**Windows/macOS/Linux:**
```bash
# Login as postgres user
psql -U postgres

# Change password
ALTER USER postgres PASSWORD 'new_password';
```

Update your `.env`:
```env
DB_PASSWORD=new_password
```

---

### Issue: "Connection refused - PostgreSQL not running"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

**Windows:**
- Open Services (`services.msc`)
- Find "postgresql-x64-14"
- Start the service

**macOS:**
```bash
brew services start postgresql@14
```

**Linux:**
```bash
sudo systemctl start postgresql
```

Verify it's running:
```bash
psql -U postgres -c "SELECT version();"
```

---

### Issue: "Database tables not found"

**Symptoms:**
```
Error: relation "users" does not exist
```

**Solution:**
```bash
cd backend

# Drop and recreate all tables
npm run init-db

# Add sample data
npm run seed
```

---

## Backend Issues

### Issue: "Port 5000 already in use"

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**

**Option 1: Change the port**
Edit `backend/.env`:
```env
PORT=5001
```

**Option 2: Kill the process using port 5000**

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

---

### Issue: "Module not found" errors

**Symptoms:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
cd backend
rm -rf node_modules
rm package-lock.json
npm install
```

---

### Issue: "JWT token errors"

**Symptoms:**
```
Error: jwt malformed
Error: jwt expired
```

**Solution:**
1. Clear browser localStorage
2. Re-login to get new token
3. Check `JWT_SECRET` in `.env` hasn't changed
4. Verify token expiration time in `.env`:
   ```env
   JWT_EXPIRE=7d
   ```

---

## Frontend Issues

### Issue: "Port 3000 already in use"

**Symptoms:**
```
Port 3000 is in use
```

**Solution:**

Vite will automatically suggest next available port. Press `y` to use it.

Or manually change port in `frontend/vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 3001
  }
})
```

---

### Issue: "Cannot connect to backend API"

**Symptoms:**
```
Network Error
Failed to fetch
```

**Solution:**

1. Verify backend is running:
   ```bash
   curl http://localhost:5000/api/health
   ```

2. Check CORS settings in `backend/src/server.js`:
   ```javascript
   cors({
     origin: 'http://localhost:3000'
   })
   ```

3. Check API URL in frontend:
   - Create `frontend/.env`:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```

---

### Issue: "White screen / Blank page"

**Symptoms:**
- Page loads but nothing displays
- Console shows errors

**Solution:**

1. Check browser console (F12) for errors
2. Clear browser cache
3. Delete `node_modules` and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```
4. Rebuild:
   ```bash
   npm run dev
   ```

---

### Issue: "Tailwind styles not working"

**Symptoms:**
- Components have no styling
- Everything looks plain

**Solution:**

1. Verify `tailwind.config.js` content paths:
   ```javascript
   content: [
     "./index.html",
     "./src/**/*.{js,ts,jsx,tsx}",
   ]
   ```

2. Ensure `index.css` imports Tailwind:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. Restart dev server

---

## Authentication Issues

### Issue: "Token not persisting / User logged out on refresh"

**Symptoms:**
- User logs in successfully
- After refresh, user is logged out

**Solution:**

1. Check browser localStorage:
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Verify `auth-storage` key exists

2. Verify Zustand persist configuration in `src/store/store.js`

3. Clear localStorage and login again

---

### Issue: "Cannot register new user"

**Symptoms:**
```
Error: User already exists
```

**Solution:**

1. Try different email/username
2. Or delete existing user:
   ```sql
   psql -U postgres -d interview_prep
   DELETE FROM users WHERE email = 'test@example.com';
   ```

---

### Issue: "Unauthorized errors after login"

**Symptoms:**
```
Error: 401 Unauthorized
Error: Invalid or expired token
```

**Solution:**

1. Verify token is being sent:
   - Open DevTools → Network
   - Click on API request
   - Check Headers → Authorization: Bearer <token>

2. Check API interceptor in `frontend/src/services/api.js`:
   ```javascript
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

3. Re-login to get fresh token

---

## Development Issues

### Issue: "Hot reload not working"

**Symptoms:**
- Changes don't reflect without manual refresh

**Solution:**

**Frontend:**
- Verify Vite config
- Restart dev server
- Clear browser cache

**Backend:**
- Ensure nodemon is installed
- Check `package.json`:
  ```json
  "dev": "nodemon src/server.js"
  ```
- Restart server

---

### Issue: "CORS errors in development"

**Symptoms:**
```
Access to fetch blocked by CORS policy
```

**Solution:**

1. Verify CORS configuration in `backend/src/server.js`:
   ```javascript
   app.use(cors({
     origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
     credentials: true
   }));
   ```

2. Check `.env`:
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

3. Use Vite proxy in `frontend/vite.config.js`:
   ```javascript
   server: {
     proxy: {
       '/api': 'http://localhost:5000'
     }
   }
   ```

---

### Issue: "Database connection pool errors"

**Symptoms:**
```
Error: Timeout acquiring client from pool
```

**Solution:**

1. Close idle connections
2. Restart PostgreSQL
3. Check connection pool settings in `backend/src/config/database.js`:
   ```javascript
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000
   });
   ```

---

## Performance Issues

### Issue: "Slow page loads"

**Solutions:**

1. Check database query performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM lessons WHERE slug = 'example';
   ```

2. Add indexes if missing:
   ```sql
   CREATE INDEX idx_lessons_slug ON lessons(slug);
   ```

3. Implement caching (Redis) in future

---

### Issue: "High memory usage"

**Solutions:**

1. Restart servers
2. Close unused database connections
3. Clear browser cache
4. Monitor Node.js memory:
   ```bash
   node --max-old-space-size=4096 src/server.js
   ```

---

## Getting Help

If you're still stuck:

1. **Check logs:**
   - Backend: Check terminal where `npm run dev` is running
   - Frontend: Check browser console (F12)
   - Database: Check PostgreSQL logs

2. **Enable verbose logging:**
   ```javascript
   // In backend
   console.log('Debug info:', variable);
   ```

3. **Test API directly:**
   ```bash
   # Test health endpoint
   curl http://localhost:5000/api/health

   # Test login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

4. **Check GitHub issues:**
   - Search for similar problems
   - Create new issue with:
     - Error message
     - Steps to reproduce
     - Environment details

5. **Contact support:**
   - Provide error logs
   - Describe what you tried
   - Include environment details (OS, Node version, etc.)

---

## Debug Checklist

When troubleshooting, verify:

- [ ] Node.js and npm are installed
- [ ] PostgreSQL is installed and running
- [ ] Database `interview_prep` exists
- [ ] `.env` file exists with correct credentials
- [ ] Dependencies installed (`node_modules` exists)
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] No firewall blocking ports
- [ ] Browser allows localStorage
- [ ] Network connection is stable

---

**Still having issues?** Create a detailed bug report with:
- Operating System
- Node.js version (`node --version`)
- PostgreSQL version (`psql --version`)
- Complete error message
- Steps to reproduce
