import { createSignal, createEffect } from 'solid-js';
import { Btn } from '../comps/Form';
import { Footer, Header } from '../comps/Base';
import { url_params, PrivChat } from '../utils/main';
import { L } from '../utils/languages';

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
    <meta property="og:title" content="Chànà - Private Chat Invitation" />
    <meta property="og:description" content="Chànà- Anonymous Encrypted Chat"/>
    <meta property="og:image" content="/preview.jpg"/>
    <meta property="og:url" content=""/>

    <meta name="twitter:card" content="summary"/>
    <meta name="twitter:title" content="Chànà - Private Chat Invitation"/>
    <meta name="twitter:description" content="Anonymous Relay Chat"/>
    <div class="page_block">
      <div>
        <h3>{L('share_tit')}</h3>
        <h5>{L('share_body', {nick: params.get('nick')})} </h5>
      </div>
      <Btn bind={()=>decide(1)} name={L('accept')} class="inv_agree"/>
      <Btn bind={()=>decide(0)} name={L('decline')} class="inv_decline"/>
    </div>
    <Footer/>
    </>
  );
}
export default PrivShare;
