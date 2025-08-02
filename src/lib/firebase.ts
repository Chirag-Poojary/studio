import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyCXjqSbfgilMF9LqvFdhLw7te_j7dhMktY",
  authDomain: "v-attendance-fcc06.firebaseapp.com",
  projectId: "v-attendance-fcc06",
  storageBucket: "v-attendance-fcc06.firebasestorage.app",
  messagingSenderId: "415391567793",
  appId: "1:415391567793:web:36adc476ffb2374e703790",
  measurementId: "G-2YP2T5LWMJ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);