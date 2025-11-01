import { createSignal, createEffect, createResource, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Pwd, Btn } from '../comps/Form';
import { Locker} from '../utils/main';
import {Header, Footer} from '../comps/Base';
import { L } from '../utils/languages';

function Lock() {
  const [locker] = createResource(async () =>await Locker.load()); 
  let [pin, $pin] = createSignal('');
  let navi = useNavigate();

  const unlock = async ()=>{
    if(locker() && Locker.verify(locker(), pin())) {
      await Locker.set_lock(locker(), false);
      navi('/');
    }
  };
  return (
    <>
    <Header />
    <div class="page_block">
      <form>
      <Pwd name="PIN" bind={$pin}  on_enter={unlock} />
      <Btn name={L('unlock')} bind={unlock} />  &nbsp; 
      </form>
    </div>
    <Footer/>
    </>
  )
}
export default Lock;
