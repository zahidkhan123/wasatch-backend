import admin from "firebase-admin";
import serviceAccount from "../config/wastecollection-ae79b-firebase-adminsdk-fbsvc-d14d79d6e8.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;
