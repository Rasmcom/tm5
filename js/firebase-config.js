// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdUQnZDjFUKK3kwV2eaHzO-QVklo8WU2g",
  authDomain: "test5-27a50.firebaseapp.com",
  projectId: "test5-27a50",
  storageBucket: "test5-27a50.appspot.com", // Corrected to appspot.com for compat library
  messagingSenderId: "980332928757",
  appId: "1:980332928757:web:56b15e7044dae053522fbc",
  measurementId: "G-CH3R9F53XG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make db and storage globally available
const db = firebase.firestore();
const storage = firebase.storage();
