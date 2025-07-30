// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCQGW7chezqctoYhiwxgjo5PW7Se1Qzg0",
  authDomain: "testm3-e309b.firebaseapp.com",
  databaseURL: "https://testm3-e309b-default-rtdb.firebaseio.com",
  projectId: "testm3-e309b",
  storageBucket: "testm3-e309b.firebasestorage.app",
  messagingSenderId: "959816245190",
  appId: "1:959816245190:web:fe5643df3a62e217315cc7",
  measurementId: "G-CY7TD2M4P6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make db and storage globally available
const db = firebase.firestore();
const storage = firebase.storage();
