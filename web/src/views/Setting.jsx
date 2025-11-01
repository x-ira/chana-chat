import { createResource, createSignal, Show } from "solid-js";
import { get,post} from '../utils/app';
import { Locker, nick_name } from '../utils/main';
import { LANGUAGES, local, L } from "../utils/languages";
import { Txt, Pwd, Btn, Slt } from "../comps/Form";
import { clear, del } from "idb-keyval";
import { Footer, Header } from "../comps/Base";

function Setting(){
  let [lock_pin, $lock_pin] = createSignal('');
  let [nick_now, $nick_now] = createSignal(nick_name());
  let [nick_new, $nick_new] = createSignal('');
  let [lang, $lang] = createSignal(local());
  let [msg, $msg] = createSignal('');
  return (
    <>
    <Header/>
    <div class="page_block">
      <form>
      <div>
        <p>{L('your_nick')}: &nbsp; {nick_now()} </p>
        <Txt name={L('new_nick')} bind={[nick_new, $nick_new]} tip="Nick name for all chats" />
        <Btn name={L('set')} bind={()=>{
            localStorage.setItem('nick', nick_new());
            $nick_now(nick_new());
            $nick_new('');
            $msg(L('done'));
        }} /> 
      </div>

      <div>
        <Slt name={L('language')} options={LANGUAGES} bind={[lang, $lang]}  opt_disp={opt=>opt[1]}  opt_val={opt=>opt[0]} class="room" />
        <Btn name={L('set')} bind={()=>{
            localStorage.setItem('lang', lang());
            location = '/setting';
        }} /> 
      </div>
    
      <div>
        <label>{L('web_notify')}:</label>
        <Btn name={L('enable')} bind={()=>{
          if(notify.isSupported()) {
            notify.requestPermission();
            $msg(L('done'));
          }else{
            $msg(L('not_support'));
          }
        }} /> 
      </div>
    
      <div>
        <Pwd name={L('set_lock_pin')} bind={$lock_pin} tip="PIN for app"/>
        <Btn name={L('set')} bind={async ()=>{
          if(!lock_pin()) return $msg(L('input_required'));
          if(await Locker.init(lock_pin())){
            location = '/setting';
          }
        }} /> 
        <Btn name={L('clear')} bind={()=>{
          del('locker', meta).then(r=>location = '/setting');
        }} />
      </div>

      <div>
        <label>{L('privacy')}:</label>
        <Btn name={L('clear_chat')} bind={()=>{
          if(confirm(L('clear_chat_confirm'))) {
            clear();
            del('priv_chats', meta).then(r=>$msg(L('done')));
          }
        }} />
        <Btn name={L('expire_invitation')} bind={()=>{
          if(confirm(L('expire_invitation_confirm'))) {
            clear();
            del('ecdhs', meta).then(r=>$msg(L('done')));
          }
        }} />
      </div>
      {msg() && <div class="act_msg">{msg}</div>}
      </form>
    </div>
    <Footer/>
    </>
  )  
}
export default Setting; 
