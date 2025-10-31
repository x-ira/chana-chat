import './App.css';
import { Router, Route } from "@solidjs/router";
import Chat from './views/Chat';
import PrivShare from './views/PrivShare';
import Setting from './views/Setting';
import Share from './views/Share';

function App() {
  return ( 
    <Router>
      <Route path="/" component={Share} />
      <Route path="/chat" component={Chat} />
      <Route path="/setting" component={Setting} />
      <Route path="/priv_share" component={PrivShare} />
    </Router>
  );
}
export default App;
