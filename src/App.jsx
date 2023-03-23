import styles from './App.module.css';
import Chart from "./Chart";
import ghlogo from "/github-mark.png";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {createSignal} from "solid-js";
import CoalitionSelect from "./CoalitionSelect";
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
// const _ = getAnalytics(app);

function GithubLink() {
    return <a href={"https://github.com/fedorst/parliament-vote-adjacency-viz" }>
        <img src={ghlogo} alt={"A github logo hyperlink leading to the github repo."} width="50px" height="50px"/>
    </a>
}

function App() {
    const [selectedCoalition, selectCoalition] = createSignal("52");
    return (
    <div class={styles.App}>
        <div style={{"margin-top": "14px", display: "flex", "align-items": "flex-start", "justify-content": "space-evenly"}}>
        <h2>MP voting behavior comparison</h2> <CoalitionSelect selectedCoalition={selectedCoalition} selectCoalition={selectCoalition}/> <GithubLink/>
        </div>
        <Chart selectedCoalition={selectedCoalition}/>
        <br/>>
    </div>
  );
}

export default App;
