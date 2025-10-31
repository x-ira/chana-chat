import { createSignal, createEffect } from 'solid-js';
import { Btn } from '../comps/Form';
import { Footer, Header } from '../comps/Base';
import { url_params, PrivChat } from '../utils/main';

function PrivShare() {
  let params = url_params();
  let nick = params.get('nick');
  let skid = params.get('skid');
  let pub_key = params.get('pub_key');
  
  const decide = (o) => { //always re-create the chat, onMount() is a bad idea
    window.location = `/chat?nick=${nick}&skid=${skid}&pub_key=${pub_key}&decide=${o}`;
  }
  return (
    <>
    <Header />
    <meta property="og:title" content="Arc Private Chat Invitation" />
    <meta property="og:description" content="Anonymous Relay Chat"/>
    <meta property="og:image" content="/preview.jpg"/>
    <meta property="og:url" content=""/>

    <meta name="twitter:card" content="summary"/>
    <meta name="twitter:title" content="Arc Private Chat Invitation"/>
    <meta name="twitter:description" content="Anonymous Relay Chat"/>
    <div class="page_block">
      <div>
        <h3>~ Anonymous Private Chat Invitation ~</h3>
        <h5>You are invited to start a private chat with {params.get('nick')} </h5>
      </div>
      <Btn bind={()=>decide(1)} name="Accept" class="inv_agree"/>
      <Btn bind={()=>decide(0)} name="Decline" class="inv_decline"/>
    </div>
    <Footer/>
    </>
  );
}
export default PrivShare;
