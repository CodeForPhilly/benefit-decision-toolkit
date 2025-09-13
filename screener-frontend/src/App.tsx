import { Router, Route } from "@solidjs/router";
import "./App.css";
import Home from "./Home";
import Screener from "./Screener";

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/screener/:screenerId" component={Screener} />
    </Router>
  );
}

export default App;
