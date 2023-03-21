import styles from './App.module.css';
import Chart from "./Chart";
import ghlogo from "/github-mark.png";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: "AIzaSyBFj6DZshvKBMPr6BO4AsycyjLh2SBAe2k",
    authDomain: "fedorst-parlviz.firebaseapp.com",
    projectId: "fedorst-parlviz",
    storageBucket: "fedorst-parlviz.appspot.com",
    messagingSenderId: "920081075488",
    appId: "1:920081075488:web:419b8aec20dabb168d9b45",
    measurementId: "G-N4B9EQWXS0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const _ = getAnalytics(app);

function App() {
  return (
    <div class={styles.App}>
        <header>
            <h2>MP voting behavior comparison</h2>
        </header>
        <Chart/>
        <br />
        <footer>
            <a href={"https://github.com/fedorst" }>
                <img src={ghlogo} alt={"A github logo hyperlink leading to my github page."} width="50px" height="50px"/>
            </a>
        </footer>
    </div>
  );
}

export default App;
