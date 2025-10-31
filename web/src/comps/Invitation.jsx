import { b64_u8, Time } from "../utils/app";
import { Cipher, PrivChat, nick_name } from "../utils/main";
import { priv_chats, room, update_priv_chat } from "../stores/chat";
import { inv_track_sign } from "./ChatHelper";
import { Btn } from "../comps/Form";

export default function Invitation(props){
  let inv = room();
  const tracking = async (state) => {
    let it = await inv_track_sign(b64_u8(inv.kid), nick_name(), state); //inform partner
    if(props.on_track) props.on_track({InviteTracking: it}); //notify partner
    update_priv_chat(inv.kid, state);
  };
  return (
    <>
    <div class="invite">
      { inv.state == 0 && <>
      <span>`{inv.nick}` invites you to join this private chat.</span>
      <Btn bind={() => tracking(9)} name="Accept" class="inv_agree"/>
      <Btn bind={() => tracking(2)} name="Decline" class="inv_decline"/>
        { inv.greeting &&
          <div class="greeting"> ‟ {inv.greeting} ‟</div>
        }
      </>}
      { inv.state == 1 && <>
        <span>Waiting for `{inv.nick}` to agree to join this private chat.</span>
        <Btn bind={() => tracking(4)}  name="Cancel" class="inv_decline"/>
      </>}
    
      { inv.state == 5 && <>
        <span>Waiting for `{inv.nick}` to join this private chat.</span>
        <Btn bind={() => tracking(4)}  name="Cancel" class="inv_decline"/>
      </>}
    </div>
    </>
  )
}
