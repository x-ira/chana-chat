import { createSignal, createEffect } from 'solid-js';
import RoomChat from './RoomChat';
import Topbar from '../comps/Topbar';
import { Footer, Header } from '../comps/Base';

function Chat() {
  return (
    <>
      <Header/>
      <Topbar 
        isOpen={true}
        onToggle={(isOpen) => {}}
      />
      <div>
         <RoomChat />
      </div>
     <Footer/>
    </>
  );
}
export default Chat;
