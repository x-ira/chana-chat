import { createSignal } from 'solid-js';
import {Header, Footer} from '../comps/Base';
import { b64_url, get, u8_b64, u8_b64_url } from '../utils/app';
import {extract_urls, get_ecdh, nick_name} from '../utils/main';
import { L } from '../utils/languages';
import { Lnk } from '../comps/Form';

function Share() {
  let [msg, $msg] = createSignal();
  const init_chat_inv = async() => {
    $msg();
    let ecdh = await get_ecdh();
    let pub_key = u8_b64_url(ecdh.pub_key);
    let skid = b64_url(dsa.skid);
    let url = `${location.href}priv_share?nick=${nick_name()}&skid=${skid}&pub_key=${pub_key}`;
    if (navigator.share) { // 原生分享 API (移动端)
      try{
        await navigator.share({
          title: L('inv_tit'),
          text: L('inv_txt'),
          url,
        });
      }catch(e) { //fallback
        clipboard_or_disp(url);
      }
    } else { //fallback
      clipboard_or_disp(url);
    }
  };
  const clipboard_or_disp = (url) => {
    if(navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        $msg(L('lnk_copied'));
      });
    }else{
      $msg(L('inv_lnk') + `: ${url}`);
    }
  }
  const open_copied_inv = () => {
    if(navigator.clipboard) {
      navigator.clipboard.readText().then(txt => {
        let urls = extract_urls(txt);
        if(urls.length > 0) {
          location = urls[0];
        }else{
          $msg(L('invalid_inv_lnk'));
        }
      });
    }
  }
  return (
    <>
      <Header/>
      <div class="page_block" >
        <h5>~ # {L('invitation')} # ~</h5>
        <p>
        <Lnk name={L('share')} bind={async ()=> await init_chat_inv()} class="navi"/> {L('share_inv_tip')}
        </p>
        <p>
        <Lnk name={L('open')} bind={async (e)=> await open_copied_inv(e)} class="navi"/> {L('open_inv_tip')}
        </p>
        { msg() && <div class="act_msg">{msg}</div> }
      </div>
      <Footer/>
    </>
  )
}
export default Share;
