## **1. Build the app**

From the project root (e.g. D:\file web):

npm run build

- This runs **Vite** and outputs the production build to the **dist** folder (as in your firebase.json).

---

## **2. Deploy to Firebase Hosting**

npx firebase deploy --only hosting

- Deploys only the **hosting** target (your dist folder).

- Your site will be at:

https://<your-project-id>.[web.app](http://web.app) and/or your custom domain if configured.

---

## **3. (Optional) Deploy everything**

To deploy hosting plus Firestore rules, Storage rules, and Functions:

npx firebase deploy

  
