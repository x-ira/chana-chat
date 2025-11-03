import { createSignal, onMount, Switch, Match } from 'solid-js';
import { Btn } from '../comps/Form';
import { Footer, Header } from '../comps/Base';
import { url_params, PrivChat, InvKey, nick_name, ecdh_exchange } from '../utils/main';
import { L } from '../utils/languages';
import { b64_std, b64_u8, b64_url_u8, u8_b64 } from '../utils/app';
import { priv_chat, save_priv_chat, update_priv_chat } from '../stores/chat';
import { set } from 'idb-keyval';
import { engagement_sign, inv_track_sign } from '../comps/ChatHelper';
import { useNavigate } from '@solidjs/router';

function PrivShare() {
  let params = url_params();
  let by_nick = params.get('nick');
  let skid = params.get('skid');
  let skid_std = b64_std(skid);
  let pk = params.get('pub_key');
  const [used, $used] = createSignal(false);
  const navigate = useNavigate();
  
  onMount(async ()=>{
    if(await InvKey.is_existed(pk)) {
      $used(true);
    }
  });
  //always re-create the chat, if is fresh invitation
  const decide = async o => {
    let kid = b64_u8(skid_std);
    let pub_key = b64_url_u8(pk); //tracker
    let nick = nick_name();
    if(o == 0) {
      let it = await inv_track_sign(kid, nick, 2, pub_key); //inform partner, declined
      await set('inv_decide', {InviteTracking:it} , meta);
      return navigate(`/`);
    }
    if(priv_chat(skid_std)) {
      await update_priv_chat(skid_std, 4); //remove chat before re-creatation
    }
    let eng = await engagement_sign(skid_std, kid, pub_key, nick); //always allow invite
    let rmk = await ecdh_exchange(skid_std, pub_key, true);
    await save_priv_chat({
      kid: skid_std, nick: by_nick, state: 5, type: 1, rmk:u8_b64(rmk), ts: eng.ts
    });
    await InvKey.save(pk);
    await set('inv_decide', {Engagement: eng}, meta);
    navigate(`/chat`);
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
      <h5>{L('share_tit')}</h5>
      <p>
      <Switch>
        <Match when={skid_std == dsa.skid}>{L('inv_self')}</Match>
        <Match when={used()}>{L('inv_used')}</Match>
        <Match when={!used()}>
          <p>{L('share_body', {nick: params.get('nick')})} </p>
          <Btn bind={async ()=>await decide(1)} name={L('accept')} class="inv_agree"/>
          <Btn bind={async ()=>await decide(0)} name={L('decline')} class="inv_decline"/>
      </Match>
      </Switch>
      </p>
    </div>
    <Footer/>
    </>
  );
}
export default PrivShare;
