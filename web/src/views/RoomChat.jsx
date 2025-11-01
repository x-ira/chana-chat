import { createEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import WebSocketClient from '../utils/ws';
import _ from '../utils/notification';
import { Time,get,upload_files, b64_u8, b64_url, u8_b64, b64_url_u8, b64_std } from '../utils/app';
import { Cipher, PrivChat, break_time, ecdh_exchange, expire_ecdh, msg_room, nick_name, url_params } from '../utils/main';
import { room, rmk, save_priv_chat, update_priv_chat, priv_chat, room_id, remark_priv_chat } from '../stores/chat';
import { set, get as find, setMany, del, keys, delMany } from 'idb-keyval';
import { nanoid } from 'nanoid';
import { Btn, Slt, ImgSlt, Lnk, FileSlt } from '../comps/Form';
import { engagement_sign, engagement_verify, inv_sign, inv_track_sign, inv_track_verify, inv_verify, m_io, me } from '../comps/ChatHelper';
import Notifier from '../comps/Notifier';
import Invitation from '../comps/Invitation';
import Voice from '../comps/Voice';
import MediaMsg from '../comps/MediaMsg';
import Command from '../comps/Command';
import { L } from "../utils/languages";

function RoomChat(props) {
  let nick = nick_name();
  let [rest_len, $rest_len] = createSignal(false);
  let [slt_imgs, $slt_imgs] = createSignal();
  let [slt_files, $slt_files] = createSignal();
  let [voi, $voi] = createSignal();
  let [msg_kind, $msg_kind] = createSignal('Txt');
  let [txt_cmd, $txt_cmd] = createSignal(null);
  let [notify_msg, $notify_msg] = createSignal(); 
  let [inv_msg, $inv_msg] = createSignal(); 
  let [conn_state, $conn_state] = createSignal(); 
  let [msgs, $msgs] = createStore([]);
  let [cmd_output, $cmd_output] = createSignal();
  let blob_urls = [];
  let kid = dsa.kid;
  let skid = dsa.skid;
  let params = url_params();
  let msg_block; //el
  let wsc;
  let endpoint = `/ws/${nick}/k/${b64_url(dsa.verify_key)}`;

  const engagement = async ()=> {
    if(params.get('skid')) { // try attend a priv-chat engagement
      let decide = params.get('decide');
      let skid = b64_std(params.get('skid'));
      let kid = b64_u8(skid);
      let by_nick = params.get('nick');
      let pub_key = b64_url_u8(params.get('pub_key')); //tracker
      if(decide == 0) {
        let it = await inv_track_sign(kid, nick, 2, pub_key); //inform partner, declined
        return wsc.emit({InviteTracking:it});
      }
      let eng = await engagement_sign(skid, kid, pub_key, nick); //always allow invite
      let rmk = await ecdh_exchange(skid, pub_key, true);
      save_priv_chat({
        kid: skid, nick: by_nick, state: 5, type: 1, rmk:u8_b64(rmk), ts: eng.ts
      });
      wsc.emit({Engagement: eng});
    }
  }
  const init_wsc = () =>{
    wsc = new WebSocketClient(endpoint);
    wsc.on('#connected', async ()=>{ //refresh room after (re)connected
     $conn_state();
     await engagement();
    });
    wsc.on('#reconnecting', ({attempt}) => {
      $conn_state('Try to connect the server...', attempt);
    });
    wsc.on('#reconnect_failed', () => {
      wsc.close();
      $conn_state('Fail to connect. Refresh the page to start over');
    });
    wsc.on('msg', async ws_msg => { //register once
      // console.log('recv msg', ws_msg);
      if(ws_msg.PrivChat) {
        let msg = ws_msg.PrivChat.msg;
        let priv_src = u8_b64(ws_msg.PrivChat.msg.kid);
        let priv_dist = u8_b64(ws_msg.PrivChat.kid);
        let src = priv_src; //for convenience
        let msg_rm = msg_room(priv_dist, priv_src);

        msg.cont = rmk(msg_rm).dec_u8(msg.cont);

        if (document.visibilityState === 'hidden') {
           notify.show('Arc-Chat',`A private ${msg.kind} msg from ${msg.nick}`);
        }
        let pc = priv_chat()
        find(msg_rm).then((r = [])=>{
          r.push(msg);
          set(msg_rm, r);
        });
        if(src == room_id() || (priv_src == skid && priv_dist == room_id())) { //自发自收
          $msgs([...msgs, msg]);
        }else if(u8_b64(msg.kid) != skid){  //try notify if not sender, support multiple devices
          $notify_msg({src, msg, type: 1});
        }
      }else if(ws_msg.Media) { // for priv-chat only currently
        let media = ws_msg.Media;
        let by_kid = u8_b64(media.by_kid);
        let key = [by_kid, media.id]; // no need cal msg_room, sender not send the media via ws
        media.file = rmk(by_kid).dec_blob(media.data, media.id, media.cont_type);
        delete media.data;
        set(key, media).catch(e=>console.error(e));
      }else if(ws_msg.Engagement) {
        let eng = ws_msg.Engagement; 
        if(!engagement_verify(eng)) return; // verify sign
        let rmk = await ecdh_exchange(eng.pub_key, eng.by_pub_key, true);
        let state = 3; // missing or expired pub_key
        if(rmk) { 
          state = 9;
          let by_skid = u8_b64(eng.by_kid);
          save_priv_chat({
            kid: by_skid, nick: eng.by_nick, state, type: 1, rmk:u8_b64(rmk), ts: eng.ts
          });
          if (document.visibilityState === 'hidden') {
             notify.show('Arc-Chat',`${eng.by_nick} has accepted the Priv-Chat invitation.`);
          }
        }
        let it = await inv_track_sign(eng.by_kid, eng.by_nick, state); //inform partner, expired Or success
        wsc.emit({InviteTracking:it});
      }else if(ws_msg.InviteTracking) {
        let it = ws_msg.InviteTracking;
        if(!inv_track_verify(it)) return; // verify track sign
        let cont;
        if(it.state == 2) {
          cont = `${it.by_nick} has declined your Priv-Chat invitation.`;
          if(it.tracker) {
            await expire_ecdh(u8_b64(it.tracker));
          }
        }
        if(it.state == 3) cont = `Priv-Chat invitation from ${it.by_nick} is expired.`;
        if(it.state == 4) cont = `${it.by_nick} has cancelled the Priv-Chat invitation.`;
        if(it.state == 9) cont = `${it.by_nick} has accepted your Priv-Chat invitation.`;
        if(cont) {
         notify.show('Arc-Chat', cont);
        }
        update_priv_chat(u8_b64(it.by_kid), it.state);
      }else if(ws_msg.Rsp) {
        let rsp = ws_msg.Rsp;
        let output = '';
        if(rsp.Output) output = rsp.Output;
        else if(rsp == 'Offline') output = `${room().nick} is offline, message(s) will be delivered when user is online.`;
        $cmd_output(output);
      }
    });
  }
  const history_msgs = () => { //only for priv-chats
    if(!room_id()) return ; //decline priv-chat case
    find(room_id()).then((his_msgs=[]) =>{
      let rest = rest_len() == undefined ? his_msgs.length:rest_len();
      if(rest == 0) return;
      let bat = his_msgs.slice(Math.max(rest-10, 0), rest);
      $rest_len(rest-bat.length);
      $msgs([...bat, ...msgs]);
    });
  }
  const clean_room = ()=> {
    $msgs([]); //clear store before load latest msgs
    $rest_len(); 
    $cmd_output();
    blob_urls.forEach(src=>URL.revokeObjectURL(src)); blob_urls = []; //release blob obj
  }
  const refresh_room = () => {
    clean_room();
    history_msgs();
  }
  const chat_msg = (kind, cont, wisper) => { // parepared, No cont
    let msg = {nick, kind, ts: Time.ts(), kid, cont: rmk().enc_u8(cont), wisper };
    return room().type == 0 ? {Chat: {room: room().id, msg}} : {PrivChat: {kid: b64_u8(room().kid), msg}};
  }
  const handle_input_msg = (cmd, params, send_at_once) => {
    $txt_cmd({cmd, params});
    if(send_at_once) { send_msg(); }
  }
  const clear_priv_history = async ()=> {
    keys().then(async keys => {
      let media_conts = keys.filter(([msg_room, _])=> msg_room == room_id());
      await delMany(media_conts);
    })
    await del(room_id());
  }
  const cmd_filter = (cmd_suggs) => cmd_suggs.filter(c=> c.scope == 2 || c.scope == room().type);
  const cmd_msg = async () => {
    if(!txt_cmd()) return [];
    let {cmd, params} = txt_cmd();
    let new_msg;
    switch(cmd) {
      case 'chat':
        new_msg = txt_msg(params);
        break;
      case 'remark':
        remark_priv_chat(room().kid, params.alias);
        break;
      case 'clear': 
        await clear_priv_history();
        clean_room();
        break;
      case 'leave':  
        await clear_priv_history();
        update_priv_chat(room_id(),4);
        clean_room();
        break;
      case 'help':
      default :
        $cmd_output(`
          Command Usages:<br>
            &nbsp;/remark + [msg] : set a alias for this chat. <br>
            &nbsp;/leave : leave the Priv-Chat & clear the chat history. <br>
            &nbsp;/clear : clear the Priv-Chat history. <br>
            &nbsp;/help : print this message.<br>
        `);
    };
    $txt_cmd(null); //clear
    return [new_msg];
  }
  const txt_msg = (cont, wisper) =>{
    return !cont ? [] : chat_msg('Txt', cont, wisper);
  }
  const blob_conts = async (blobs) => {
    let srcs = [];
    let medias = [];
    for(const file of blobs) {
      let data = await rmk().enc_file_u8(file);
      let id = file.name?`${nanoid(7)}-${file.name}` : nanoid(12); //hash may reduce duplicate
      let cont_type = file.type;
      let media = { kid: b64_u8(room().kid), by_kid: kid, id, cont_type, data};
      wsc.emit({Media:media});
      srcs.push(id);
      media.file = file;
      delete media.data;
      medias.push([[room().kid,id] , media]); //key: []
    }
    setMany(medias).catch(e=> console.err(e)); //store for sender
    return srcs;
  }
  const img_msgs = async () =>{
    if(!slt_imgs()) return;
    let new_msgs = [];
    let conts = await blob_conts(slt_imgs());
    for(const cont of conts) {
      let msg = chat_msg('Img', cont);
      new_msgs.push(msg);
    }
    $slt_imgs([]); //reset
    return new_msgs;
  }
  const file_msgs = async () =>{
    if(!slt_files()) return;
    let new_msgs = [];
    let conts = await blob_conts(slt_files());
    for(const cont of conts) {
      let msg = chat_msg('File', cont);
      new_msgs.push(msg);
    }
    $slt_files([]); //reset
    return new_msgs;
  }
  const voi_msg = async () =>{
    if(!voi()) return;
    let cont = (await blob_conts([voi()]))[0]; // Don't make stupid mistakes anymore.   (await fn())[0]
    let msg = chat_msg('Voi',cont);
    $voi(null); //reset
    return [msg]; //for consitence
  }
  const send_msg = async () => {
    let new_msgs = [];
    if(msg_kind() == 'Txt') {
      new_msgs = await cmd_msg();
    }else if(msg_kind() == 'Img'){
      new_msgs = await img_msgs();
    }else if(msg_kind() == 'File'){
      new_msgs = await file_msgs();
    }else if(msg_kind() == 'Voi'){
      new_msgs = await voi_msg();
    }
    if(!new_msgs || new_msgs.length == 0) { return }
    new_msgs.forEach(ws_msg=>{
      wsc.emit(ws_msg);
    });
  }
  onMount(()=>{
    init_wsc();
    if(notify.isSupported()) {
      notify.requestPermission();
    }
  });
  onCleanup(() =>{
    if(wsc) wsc.close();
  });
  createEffect((rmk) =>{
    if(!room()) return;
    if(room().rmk != rmk) { //rmk change means room changed!!
      refresh_room();
    }
    return room().rmk;
  }, room().rmk);
  createEffect(() =>{
    if(msgs && msgs.length > 5) {
      msg_block.scrollTop = msg_block.scrollHeight;
    }
  });
   return (
     <>
    <Switch>
      <Match when={!room()}></Match>
      <Match when={room().state < 9} >
        <Invitation on_track={it=>wsc.emit(it)}/>
      </Match>
      <Match when={room().state >= 9} >
        { conn_state() && 
        <div class="conn_state">{conn_state}</div>
        }
        <div class="msg_block" ref={msg_block}>
        <Show when={rest_len()} >
          <div class="info"><Lnk bind={history_msgs} name={`~ More History (${rest_len()}) ~`} /></div>
        </Show>
        <For each={msgs}>{ (m,i) =>
          <>
            <div class="msg"> 
              <Show when={u8_b64(m.kid) != skid } >{m.nick}: </Show>
              <Switch>
                <Match when={m.kind == 'Txt'} >
                   <div class={`${m_io(m)} txt`}><span class="m_cont">{m.cont}</span></div>
                </Match>
                <Match when={m.kind != 'Txt'} >
                  <MediaMsg m={m} blob_urls={blob_urls} />
                </Match>
              </Switch>
            </div>
            <div class="info">
              <Show when={break_time(m.ts, i(), msgs)} fallback={<>&nbsp;</>}>
                <span>{Time.iso(m.ts)}</span>
              </Show>
            </div>
          </>
       }</For>
      {cmd_output() && <div class="act_msg cmd_output"><span class="x_close" onclick={()=>$cmd_output()}>&#x2715;</span><div innerHTML={cmd_output()}/></div>}
      </div>
      <Switch>
         <Match when={msg_kind() == 'Txt'} >
          <i class="i-txt m_kind" on:click={()=>$msg_kind('Img')}></i> 
          <Command on_ready={handle_input_msg} tip="Say something or start a command with / "  class="texting" txt_cmd={txt_cmd}  filter={cmd_filter}/>
        </Match>
        <Match when={msg_kind() == 'Img'} >
          <i class="i-img m_kind" onclick={()=>$msg_kind('File')}></i>
          <ImgSlt bind={[slt_imgs,$slt_imgs]} class="msg_bar"/>
        </Match>
        <Match when={msg_kind() == 'File'} >
          <i class="i-upload m_kind" onclick={()=>$msg_kind('Voi')}></i>
          <FileSlt bind={[slt_files,$slt_files]} class="msg_bar"/>
        </Match>
        <Match when={msg_kind() == 'Voi'} >
          <i class="i-voi m_kind" onclick={()=>$msg_kind('Txt')}></i>
          <Voice bind={[voi, $voi]} />
        </Match>
      </Switch>
      <Btn name={L('send')} bind={send_msg} /> 
    </Match>
  </Switch>
  </>
  );
}
export default RoomChat;
