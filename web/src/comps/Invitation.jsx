import { b64_u8 } from "../utils/app";
import { nick_name } from "../utils/main";
import { room, update_priv_chat } from "../stores/chat";
import { inv_track_sign } from "./ChatHelper";
import { Btn } from "../comps/Form";
import { L } from "../utils/languages";

export default function Invitation(props){
  let inv = room();
  const tracking = async (state) => {
    let it = await inv_track_sign(b64_u8(inv.kid), nick_name(), state); //inform partner
    if(props.on_track) props.on_track({InviteTracking: it}); //notify partner
    await update_priv_chat(inv.kid, state);
  };
  return (
    <>
    <div class="invite">
      { inv.state == 5 && <>
        <span>{L('inv_track_s5', {nick: inv.nick})}</span> &nbsp;
        <Btn bind={() => {
          if(confirm(L('inv_cancel_confirm'))) {
            tracking(4)
          }
        }}  name={L('inv_cancel')} class="inv_decline"/>
      </>}
    </div>
    </>
  )
}
