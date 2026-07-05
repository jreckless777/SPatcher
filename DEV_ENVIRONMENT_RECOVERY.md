# Dev Environment Recovery Checklist

Because the AI Studio sandbox environment may re-provision or reset (e.g., losing background processes, installed system packages, and `.env` files not committed to version control), please follow this checklist to restore the local development environment for this project.

## 1. Verify and Restore Environment Variables
Check if `functions/.env` exists. If not, recreate it with the necessary API keys (e.g., `ALCHEMY_API_KEY`).
```bash
echo "ALCHEMY_API_KEY=your_api_key_here" > functions/.env
```
*Note: The `.env` file is in `.gitignore` and will not persist across sandbox resets.*

## 2. Verify System Dependencies (Java)
The Firebase Firestore Emulator requires Java. Check if it's installed:
```bash
java -version
```
If it's missing (e.g., `java: not found`), install it:
```bash
apt-get update && apt-get install -y default-jre
```

## 3. Start Background Processes
Start the background processes in the following order:

**A. Firebase Emulators (Firestore & Functions)**
```bash
npx firebase emulators:start --only firestore,functions > emulator.log 2>&1 &
```
*Wait a few seconds and ensure they are running on ports 8080/8081 (Firestore) and 5001 (Functions).*

**B. Worker Dev Shim Server**
Since `wrangler dev` encounters sandbox limitations (`spawn EFAULT`), we use a custom Node.js shim.
```bash
npm run dev:worker-shim > worker-shim.log 2>&1 &
```
*Ensure it is listening on port 8787.*

**C. Frontend Dev Server**
If the Vite dev server is not running, start it:
```bash
npm run dev
```

## 4. Verify Health
Before running any tests, confirm the ports are actively listening:
- **8080 / 8081**: Firestore Emulator
- **5001**: Functions Emulator
- **8787**: Worker Shim Server
- **3000**: Vite Frontend

Check the logs (`emulator.log` and `worker-shim.log`) to verify that the environment variables were loaded correctly.

---
**Important Note:** Do not assume `.env` files or background processes will persist between sessions. Always perform a quick check at the start of a new session.
