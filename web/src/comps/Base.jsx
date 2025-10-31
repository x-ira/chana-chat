import './Topnav.css';
import { A, useNavigate } from "@solidjs/router";
import { L } from "../utils/languages";
import { Match, Show,Switch,createEffect,createResource,createSignal } from "solid-js";
import { Locker } from "../utils/main";
import { is_open, is_mobile } from "../stores/chat";
import { hash_b64 } from "xira-crypto-wasm";

function menu() {
  var x = document.getElementById("top_nav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}
function Header(){
  let [show_lock, $show_lock] = createSignal(false);
  let [locker] = createResource(async () =>await Locker.load());
  const navi = useNavigate();
  createEffect(()=>{
    if(locker()) {
      if(locker().locked) {
        navi('/lock');
      }else{
        $show_lock(true);
      }
    }
  });
  return (
    <>
    <header class="header">
      <div class="site_tit"> {L('site_tit')} </div>
      <div class="site_sub_tit"> {L('site_sub_tit')} </div>
      <nav class="topnav" id="top_nav">
        <A href="/" target="_self" end><i class="i-share"></i> {L('invitation')} </A>
        <A href="/chat" target="_self"><i class='i-chat'></i> {L('chat')} </A> 
        <A href="/setting" target="_self"><i class="i-setting"></i> {L('setting')}</A>
        <Show when={show_lock()} >
        <A href="/lock" target="_self"><i class='i-lock'></i> {L('lock')}</A>
        </Show>
        <a href="javascript:void(0);" class="icon" onclick={menu}>
        ☰
      </a>
    </nav>
    </header>
   </>
  )
}
function Footer(){
  //ms-ac-cc-rev
  return ( 
    <footer><i class="i-bolt"></i> --. --.. -- -.-. .--- -.- -. ..-. -..- --- .. -....- --... -....- .---- .----</footer>
  )
}
export {Header, Footer}
