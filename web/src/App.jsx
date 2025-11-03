import './App.css';
import { Router, Route } from "@solidjs/router";
import Chat from './views/Chat';
import PrivChatInv from './views/Engagement';
import Setting from './views/Setting';
import Share from './views/Share';
import Lock from './views/Lock';

function App() {
  return ( 
    <Router>
      <Route path="/" component={Share} />
      <Route path="/chat" component={Chat} />
      <Route path="/setting" component={Setting} />
      <Route path="/lock" component={Lock} />
      <Route path="/invite" component={PrivChatInv} />
    </Router>
  );
}
export default App;
