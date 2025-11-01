import './Topbar.css';
import { createSignal, For, onMount, onCleanup, createEffect, createResource, Switch } from 'solid-js';
import { PrivChat, url_params } from '../utils/main';
import { chg_room, priv_chats, room, set_mobile, is_mobile, is_open, set_open, first_chat, load_room } from '../stores/chat';
import { b64_std } from '../utils/app';
import { L } from '../utils/languages';

function Topbar(props) {
  const [actived, $actived] = createSignal();
  const params = url_params();
  const id = b64_std(params.get('id'));
  let init_chat;
 
  onMount(() => {
    if(id) {
      init_chat = load_room(id);
    }
  });
  createEffect(()=>{
    if(!room() || !room().rmk) {
      chg_room(init_chat ?? first_chat()); //init 1st room
    }
  });
  createEffect(()=>{ //set actived
    if(!room() || !room().rmk) {
      $actived();
    }else if(room().rmk != actived()) { 
      $actived(room().rmk);
    }
  });
  const handleItemClick = (item) => {
    if(!item) return ;
    chg_room(item);
    props.onItemClick?.(item);
  };

  return (
    <Switch>
      <Match when={!room()} >
        <div class="page_block" innerHTML={L('no_chat_tip')} />
      </Match>
      <Match when={room()} >
        <For each={priv_chats()}>
          {(chat) => (
            <div
              class={`topbar-item ${chat.rmk == actived() ? 'active' : ''}`}
              onClick={() => handleItemClick(chat)}
              title={chat.nick}
            >
              <span class="topbar-icon"><i class="i-person"></i></span>
              <span class="topbar-label">{chat.nick}</span>
            </div>
          )}
        </For>
        <hr/>
      </Match>
    </Switch>
  );
}

export default Topbar;
