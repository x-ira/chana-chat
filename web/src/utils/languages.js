import Invitation from "../comps/Invitation";

export const LANGUAGES = [
  ['en', 'English'],
  ['zh', '简体中文']
];
export function local() {
  return localStorage.getItem('lang') ?? 'en';
}
export function L(k, opt) {
  let loc = local();
  let prop = lang[local()][k];
  return typeof prop == 'function' ? prop(opt) : prop;
}
export const lang = {
  en: {
    //setting:
    language: 'Language',
    your_nick: 'Your nick name',
    new_nick: 'New nick name',
    web_notify: 'Web Notification',
    lock: 'Lock',
    set_lock_pin: 'Set lock PIN',
    set: 'Set',
    clear: 'Clear',
    enable: 'Enable',
    not_support: 'Not Supported',
    done: 'Done',
    privacy: 'Privacy',
    clear_chat: 'Clear All Chats',
    clear_chat_confirm: 'All chats history will be erased, Continue?',
    expire_invitation: 'Expire all chat invitations',
    expire_invitation_confirm: 'All chat invitations will be expired, Continue?',
    //navigator:
    site_tit: 'Chànà- क्षण',
    site_sub_tit: 'Anonymous Encrypted Chat',
    invitation: 'Invitation',
    chat: 'Chat',
    setting: 'Setting',
    //chat:
    send: 'Send',
    slt_img: 'Select image(s)',
    slt_file: 'Select file(s)',
    img: o =>`${o.num} image(s) selected`,
    file: o =>`${o.num} file(s) selected`,
    media_not_support: 'Oopts, Media device not supported.',
    no_chat_tip: `You need <a href='/' >invite</a> someone to start a chat.`,
    //invitation:
    lnk_copied: 'Invitation link has copied to clipboard.',
    inv_lnk: 'Copy & Share this invitation',
    create_inv: 'Create Invitation',
    inv_tit: 'Private Chat Invitation',
    inv_txt: 'From: <Chànà - क्षण - Anonymous Encrypted Chat>',
    accept: 'Accept',
    decline: 'Decline',
    inv_cancel: 'Cancel Chat',
    inv_cancel_confirm: 'If cancel this chat，re-invitation is required to reach each other, continue？',
    share_tit: '~ Anonymous Private Chat Invitation ~',
    share_body: o => `You are invited to start a private chat with ${o.nick}.`,
    inv_track_s5: o => `Waiting for <${o.nick}> to join this private chat.`,
  },
  zh: {
    //setting:
    language: '语言',
    your_nick: '您的昵称',
    new_nick: '新昵称',
    web_notify: '网页通知',
    lock: '锁定',
    set_lock_pin: '设置锁定PIN码',
    set: '设置',
    clear: '清除',
    enable: '启用',
    not_support: '不支持',
    done: '完成',
    privacy: '隐私',
    clear_chat: '清除聊天数据',
    clear_chat_confirm: '所有的聊天历史都将被删除，是否继续？',
    expire_invitation: '过期所有的聊天邀请',
    expire_invitation_confirm: '所有的聊天邀请都将失效，是否继续？',
    //navigator
    site_tit: '刹那- क्षण',
    site_sub_tit: '匿名加密聊天',
    invitation: '邀请',
    chat: '聊天',
    setting: '设置',
    //chat:
    send: '发送',
    slt_img: '选择图片',
    slt_file: '选择文件',
    img: o =>`已选择${o.num}张图片`,
    file: o =>`已选择${o.num}份文件`,
    media_not_support: '媒体设备不支持此功能',
    no_chat_tip: `请<a href='/' >邀请</a> 某人以开启聊天.`,
    //invitation:
    lnk_copied: '邀请链接已复制到剪贴板.',
    inv_lnk: '复制并分享此邀请链接',
    create_inv: '创建邀请',
    inv_tit: '聊天邀请',
    inv_txt: '来自：<刹那(Chànà) - 匿名加密聊天App>',
    accept: '同意',
    decline: '拒绝',
    inv_cancel: '取消聊天',
    inv_cancel_confirm: '取消此次聊天，下次聊天需重新邀请，是否继续？',
    share_tit: '~ 匿名加密聊天邀请 ~',
    share_body: o => `您收到来自${o.nick}的私聊邀请.`,
    inv_track_s5: o => `等待<${o.nick}>上线后开启聊天.`,
  }
};
