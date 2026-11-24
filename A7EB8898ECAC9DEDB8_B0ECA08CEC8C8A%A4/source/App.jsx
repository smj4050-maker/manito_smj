import minimePoseAtlas from './minime-motion-poses.js';
import { createCrowd, stepCrowd, poseFrame, ACTION_LABELS, getCrowdAppearance, isRoomVisible } from './house-motion.mjs';
import { ROOM_BACKGROUND, BARE_TREE } from './room-background.js';
import { AVATAR_ATLASES } from './avatars.js';
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, linkWithCredential, EmailAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, query, orderBy, limit, onSnapshot, getDocsFromServer, startAfter, getDoc, getDocFromServer, runTransaction, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Gift, MessageCircle, Snowflake, Users, ArrowRight, AlertCircle, LogOut, Music, Heart, Settings, Lock, Plus, Trash2, Edit2 } from 'lucide-react';

// 관리자 비밀번호나 직원 참여 링크는 소스 코드에 저장하지 않습니다.
const appId = 'manito-xmas-app';
const ADMIN_LOGIN_NAME = '방장';
const ADMIN_EMAIL = 'admin@manito.invalid';
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCgEmWxPuI3fEFRAlirb769wXtzn_UTbtk',
  authDomain: 'maniddo-efc9f.firebaseapp.com',
  projectId: 'maniddo-efc9f',
  storageBucket: 'maniddo-efc9f.firebasestorage.app',
  messagingSenderId: '234522768261',
  appId: '1:234522768261:web:5030877f9f7866b7be4aec'
};
let app, auth, db, initializationError;
try {
  app = getApps().find(existing => existing.options.projectId === FIREBASE_CONFIG.projectId)
    || initializeApp(FIREBASE_CONFIG, getApps().length ? 'manito-production' : undefined);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) { initializationError = error; }

const dataDoc = name => doc(db, 'artifacts', appId, 'data', `manito_${name}`);
const inviteDoc = id => doc(db, 'artifacts', appId, 'invites', id);
const accountDoc = uid => doc(db, 'artifacts', appId, 'accounts', uid);
const loginDoc = key => doc(db, 'artifacts', appId, 'logins', key);
const profileDoc = id => doc(db, 'artifacts', appId, 'profiles', id);
const profilesCollection = () => collection(db, 'artifacts', appId, 'profiles');
const eventsCollection = roundId => collection(db, 'artifacts', appId, 'rounds', roundId, 'events');
const HINTS = [
  { icon: '🎁', label: '비밀' }, { icon: '☕️', label: '마실것' },
  { icon: '🍫', label: '단거' }, { icon: '🧦', label: '따뜻한거' }, { icon: '🎫', label: '티켓' }
];
const AVATAR_OPTIONS = [
  {id:'mini-01',label:'산타 소년',shirt:'#bd3548',trim:'#fff2d8',hair:'#6f4434',style:'hat',skin:'#f3c49e'},
  {id:'mini-02',label:'산타 소녀',shirt:'#c64e67',trim:'#fff2d8',hair:'#694333',style:'long-hat',skin:'#f3c49e'},
  {id:'mini-03',label:'초록 니트',shirt:'#3e806b',trim:'#f3d177',hair:'#805031',style:'short',skin:'#e6b48c'},
  {id:'mini-04',label:'겨울 요정',shirt:'#799eb1',trim:'#f5e8cf',hair:'#4b4141',style:'bob',skin:'#f3c49e'},
  {id:'mini-05',label:'꼬마 루돌프',shirt:'#af7b4d',trim:'#ead0a1',hair:'#603c2f',style:'antler',skin:'#e6b48c'},
  {id:'mini-06',label:'빨간 머플러',shirt:'#526d98',trim:'#ce5264',hair:'#37333b',style:'short',skin:'#ce946f'},
  {id:'mini-07',label:'분홍 리본',shirt:'#d78a9f',trim:'#fff0d6',hair:'#6c423d',style:'ribbon',skin:'#f3c49e'},
  {id:'mini-08',label:'노랑 카디건',shirt:'#d8b364',trim:'#f5e7b5',hair:'#584630',style:'glasses',skin:'#e5b38e'},
  {id:'mini-09',label:'민트 코트',shirt:'#75a79c',trim:'#e9e4c9',hair:'#aa7548',style:'long',skin:'#f3c49e'},
  {id:'mini-10',label:'보라 니트',shirt:'#8c78ab',trim:'#e6c6df',hair:'#443940',style:'bun',skin:'#bd825f'},
  {id:'mini-11',label:'눈꽃 후드',shirt:'#e4e6df',trim:'#729fae',hair:'#5f4636',style:'hood',skin:'#e5b38e'},
  {id:'mini-12',label:'체크 셔츠',shirt:'#a44e56',trim:'#e9c6a1',hair:'#b0874b',style:'curly',skin:'#f3c49e'},
  {id:'mini-13',label:'파랑 안경',shirt:'#7995b4',trim:'#d7e1d8',hair:'#464047',style:'glasses',skin:'#ce946f'},
  {id:'mini-14',label:'복숭아 니트',shirt:'#d49b88',trim:'#fff0d0',hair:'#563c33',style:'braids',skin:'#e5b38e'},
  {id:'mini-15',label:'크리스마스 요정',shirt:'#628459',trim:'#d7b15f',hair:'#b56f41',style:'elf',skin:'#f3c49e'},
  {id:'mini-16',label:'버건디 목도리'},
  {id:'mini-17',label:'파랑 비니'},
  {id:'mini-18',label:'구리빛 곱슬'},
  {id:'mini-19',label:'아이보리 안경'},
  {id:'mini-20',label:'차콜 후드'},
  {id:'mini-21',label:'초록빛 실버'},
  {id:'mini-22',label:'분홍빛 실버'},
  {id:'mini-23',label:'주황 머플러'},
  {id:'mini-24',label:'자주빛 코트'},
  {id:'mini-25',label:'줄무늬 안경'},
  {id:'mini-26',label:'파랑 양갈래'},
  {id:'mini-27',label:'금발 안경'},
  {id:'mini-28',label:'빨강 비니'},
  {id:'mini-29',label:'빨강 카디건'},
  {id:'mini-30',label:'세이지 수염'}
];
const AVATARS = AVATAR_OPTIONS.map(option => option.id);
const LEGACY_AVATARS = ['🎅', '🤶', '🦌', '⛄', '🧝', '🐧', '🐻', '🐰'];
const legacyAvatarMap = {'🎅':'mini-01','🤶':'mini-02','🦌':'mini-05','⛄':'mini-11','🧝':'mini-15','🐧':'mini-06','🐻':'mini-08','🐰':'mini-07'};
const resolveAvatar = avatar => AVATARS.includes(avatar) ? avatar : legacyAvatarMap[avatar] || 'mini-01';
const validAvatar = avatar => AVATARS.includes(avatar) || LEGACY_AVATARS.includes(avatar);
const giftOpens = () => { const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const date = Object.fromEntries(parts.map(part => [part.type,part.value])); return `${date.year}-${date.month}-${date.day}` >= '2026-12-20'; };
const koreaDay = () => Math.floor((Date.now() + 9 * 60 * 60 * 1000) / 86400000);
const visitStatDoc = key => doc(db, 'artifacts', appId, 'visitStats', key);
const pageViewDoc = id => doc(db, 'artifacts', appId, 'pageViews', id);
const isRecord = value => !!value && typeof value === 'object' && !Array.isArray(value);
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const makeId = () => crypto.randomUUID();
const readStorage = key => {try{return window.localStorage.getItem(key);}catch{return null;}};
const writeStorage = (key,value) => {try{window.localStorage.setItem(key,value);}catch{}};
const drawStorageKey = (name,roundId) => `manito:${FIREBASE_CONFIG.projectId}:${appId}:secure:draw:${encodeURIComponent(name)}:${roundId}`;
const hasProfile = profile => typeof profile?.nickname === 'string' && !!profile.nickname.trim() && validAvatar(profile.avatar);
const rosterFingerprint = list => JSON.stringify(list.map(m => [m.id, m.name, m.department, m.inviteId, m.nameKey, m.loginEmail]));
const sameNames = (a, b) => JSON.stringify(a.map(m => m.name).sort()) === JSON.stringify(b.map(m => m.name).sort());
const isValidPairs = pairs => isRecord(pairs) && Object.keys(pairs).length >= 2 &&
  new Set(Object.values(pairs)).size === Object.keys(pairs).length &&
  Object.keys(pairs).every(name => typeof pairs[name] === 'string' && pairs[name] !== name && hasOwn(pairs, pairs[name]));
const profilesForRound = (profiles, config) => Object.fromEntries(Object.entries(profiles).map(([name, profile]) => [name, {
  ...profile, _hasMinime:hasProfile(profile), nickname: profile.nickname || name, avatar: profile.avatar || '🎅',
  giftSubmitted: !!profile.giftSubmitted && profile.giftRoundId === config?.roundId
}]));
const connectionMessage = error => {
  if (error?.code === 'permission-denied') return '접근 권한을 확인해주세요. 방장은 관리자 계정으로, 직원은 본인의 이름과 4자리 번호로 접속해주세요.';
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(error?.code)) return '이름과 번호를 확인해주세요. 방장은 관리자 번호를 확인해주세요.';
  if (error?.code === 'auth/operation-not-allowed') return 'Firebase 로그인 방법에서 익명과 이메일/비밀번호를 사용 설정해주세요.';
  if (error?.code === 'auth/too-many-requests') return '로그인 시도가 많습니다. 잠시 후 다시 시도해주세요.';
  return error?.message || '서버 연결을 확인하고 다시 시도해주세요.';
};
const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), value => value.toString(16).padStart(2, '0')).join('');
const hashToken = async token => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), value => value.toString(16).padStart(2, '0')).join('');

async function normalizeMembers(list, previous, resetId) {
  if (!Array.isArray(list) || list.length > 150) throw new Error('구성원은 최대 150명까지 등록할 수 있습니다.');
  const names = new Set(), ids = new Set();
  return Promise.all(list.map(async member => {
    const name = typeof member?.name === 'string' ? member.name.trim() : '';
    if (name === ADMIN_LOGIN_NAME) throw new Error('방장은 관리자 로그인 이름입니다. 참가 명단에서는 다른 이름을 사용해주세요.');
    const id = typeof member?.id === 'string' && member.id ? member.id : makeId();
    if (!name || name.length > 60 || names.has(name) || ids.has(id)) throw new Error('이름은 1~60자로 입력하고, 동명이인은 숫자 등으로 구분해주세요.');
    if (id.includes('/')) throw new Error('구성원 식별번호가 올바르지 않습니다.');
    names.add(name); ids.add(id);
    const old = previous.find(item => item.id === id);
    const shouldReset = resetId instanceof Set ? resetId.has(id) : resetId === id;
    const entryToken = old?.name === name && !shouldReset && old.entryToken ? old.entryToken : randomToken();
    const inviteId = await hashToken(entryToken);
    return { id, name, department: String(member.department || '').trim() || '미분류', entryToken, inviteId,
      nameKey: await hashToken(name), loginEmail: `u-${inviteId.slice(0,40)}@manito.invalid` };
  }));
}

const MAX_PHOTO_URL = 220000;
const photosCollection = () => collection(db,'artifacts',appId,'photos');
async function preparePhoto(file) {
  if(file.size>15*1024*1024)throw new Error('15MB 이하의 사진을 골라주세요.');
  if(!file.type.startsWith('image/') || file.type==='image/svg+xml')throw new Error('JPG, PNG 등 사진 파일을 골라주세요.');
  const url=URL.createObjectURL(file), image=new Image();
  try {
    image.src=url;await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('사진을 열 수 없습니다. JPG 또는 PNG 사진으로 다시 골라주세요.'));});
    let scale=Math.min(1,960/Math.max(image.naturalWidth,image.naturalHeight)),quality=.78;
    const canvas=document.createElement('canvas');
    for(let attempt=0;attempt<8;attempt++){
      canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      const context=canvas.getContext('2d');if(!context)throw new Error('사진을 처리할 수 없습니다. 다른 브라우저에서 다시 시도해주세요.');
      context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
      const result=canvas.toDataURL('image/jpeg',quality);
      if(result.length<=MAX_PHOTO_URL && result.startsWith('data:image/jpeg;base64,'))return result;
      scale*=.82;quality=Math.max(.48,quality-.06);
    }
    throw new Error('사진 용량을 줄일 수 없습니다. 더 작은 사진을 골라주세요.');
  }finally{URL.revokeObjectURL(url);}
}

const TREE_COLORS=['#e77882','#ebc86c','#82b68d','#88b6d8','#b69bd0','#fff2cf'];
const TREE_KINDS=['star','ball','bow','bell','gift','snow'];
const treeCollection=()=>collection(db,'artifacts',appId,'treeNotes');
let youtubeApiPromise;
function loadYouTubeApi() {
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(youtubeApiPromise)return youtubeApiPromise;
  youtubeApiPromise=new Promise((resolve,reject)=>{
    const previous=window.onYouTubeIframeAPIReady;
    const timeout=setTimeout(()=>{youtubeApiPromise=null;reject(new Error('음악 연결이 늦어지고 있어요. 재생 버튼을 다시 눌러주세요.'));},20000);
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);try{previous?.();}catch{}resolve(window.YT);};
    let script=document.getElementById('manito-youtube-api');
    if(script)script.remove();
    script=document.createElement('script');script.id='manito-youtube-api';script.src='https://www.youtube.com/iframe_api';script.async=true;
    script.onerror=()=>{clearTimeout(timeout);youtubeApiPromise=null;script.remove();reject(new Error('음악에 연결할 수 없어요. 인터넷 연결 후 다시 눌러주세요.'));};
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}
function useYouTubeBgm() {
  const [phase,setPhase]=useState('idle'),[notice,setNotice]=useState('');
  const player=useRef(null),pending=useRef(null),host=useRef(null),wanted=useRef(false),alive=useRef(true),ready=useRef(false);
  const dispose=()=>{ready.current=false;try{player.current?.destroy();}catch{}player.current=null;pending.current=null;host.current?.remove();host.current=null;};
  const ensurePlayer=()=>{
    if(ready.current&&player.current)return Promise.resolve(player.current);
    if(pending.current)return pending.current;
    pending.current=loadYouTubeApi().then(YT=>new Promise((resolve,reject)=>{
      if(!alive.current){reject(new Error('음악 재생이 종료되었습니다.'));return;}
      const container=document.createElement('div');container.className='bgm-audio-host';container.setAttribute('aria-hidden','true');
      Object.assign(container.style,{position:'fixed',left:'-10000px',top:'0',width:'200px',height:'200px',opacity:'0',pointerEvents:'none'});
      const frame=document.createElement('iframe');frame.id=`manito-bgm-${crypto.randomUUID()}`;frame.width='200';frame.height='200';frame.title='울장복 BGM';frame.tabIndex=-1;
      frame.allow='autoplay; encrypted-media';frame.referrerPolicy='strict-origin-when-cross-origin';
      frame.src=`https://www.youtube.com/embed/q-ZFpbrokMg?enablejsapi=1&autoplay=1&controls=0&playsinline=1&loop=1&playlist=q-ZFpbrokMg&rel=0&origin=${encodeURIComponent(window.location.origin)}`;
      container.appendChild(frame);document.body.appendChild(container);host.current=container;
      const timer=setTimeout(()=>{dispose();reject(new Error('음악을 불러오지 못했어요. 재생을 다시 눌러주세요.'));},20000);
      player.current=new YT.Player(frame.id,{events:{
        onReady:event=>{clearTimeout(timer);ready.current=true;if(!alive.current)return;resolve(event.target);},
        onStateChange:event=>{
          if(!alive.current)return;
          if(event.data===1){setPhase('playing');setNotice('');}
          else if(event.data===2){setPhase('paused');}
          else if(event.data===0&&wanted.current){event.target.seekTo(0,true);event.target.playVideo();}
        },
        onAutoplayBlocked:()=>{if(alive.current&&wanted.current){wanted.current=false;setPhase('blocked');setNotice('화면을 누르거나 재생 버튼을 눌러주세요.');}},
        onError:()=>{clearTimeout(timer);wanted.current=false;const error=new Error('음악을 불러올 수 없어요. 재생을 다시 눌러주세요.');if(alive.current){setPhase('error');setNotice(error.message);}dispose();reject(error);}
      }});
    }));
    return pending.current;
  };
  const start=async()=>{
    wanted.current=true;setPhase('loading');setNotice('');
    try{
      // With a ready iframe, send the request inside the user's tap handler.
      const instance=ready.current&&player.current?player.current:await ensurePlayer();
      if(!alive.current||!wanted.current)return;
      instance.setVolume(55);instance.unMute();instance.playVideo();
    }catch(error){dispose();wanted.current=false;if(alive.current){setPhase('error');setNotice(error.message);}}
  };
  const toggle=()=>{
    if(phase==='playing'){
      wanted.current=false;player.current?.pauseVideo?.();setPhase('paused');setNotice('');
      return;
    }
    start();
  };
  useEffect(()=>{
    alive.current=true;
    start();
    return()=>{alive.current=false;wanted.current=false;dispose();};
  },[]);
  useEffect(()=>{
    if(phase!=='blocked')return;
    const resume=event=>{
      if(event.target instanceof Element&&event.target.closest('[data-bgm-toggle]'))return;
      document.removeEventListener('click',resume,true);
      start();
    };
    document.addEventListener('click',resume,true);
    return()=>document.removeEventListener('click',resume,true);
  },[phase]);
  return {phase,notice,toggle};
}

export default function App() {
  const [user, setUser] = useState(null);
  const [publicConfig, setPublicConfig] = useState({ hasDraw: false, isRevealed: false, roundId: '' });
  const [revealedPairs, setRevealedPairs] = useState({});
  const [session, setSession] = useState(null);
  const approvedSession=useRef(null);
  const roomEntryAttempt=useRef('');
  const [assignment, setAssignment] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [visitStats, setVisitStats] = useState({today:null,total:null});
  const [visitDay, setVisitDay] = useState(koreaDay);
  const pageViewId = useRef(null);
  if (!pageViewId.current) pageViewId.current = makeId();
  const viewCounted = useRef(false);
  const viewCounting = useRef(Promise.resolve());
  const [authReady, setAuthReady] = useState(false);
  const [configReady, setConfigReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [assignmentReady, setAssignmentReady] = useState(false);
  const [profilesReady, setProfilesReady] = useState(false);
  const [membersReady, setMembersReady] = useState(false);
  const [viewState, setViewState] = useState('login');
  const [activeTab,setActiveTab]=useState('home');
  const [guestbookIncoming,setGuestbookIncoming]=useState(false);
  const [readState,setReadState]=useState({photosAt:0,guestbookAt:0});
  const [readReady,setReadReady]=useState(false);
  const [latestPhotoAt,setLatestPhotoAt]=useState(0);
  const readAttempts=useRef(new Set());
  const [presentationOpen,setPresentationOpen]=useState(false);
  const [photoPosts,setPhotoPosts]=useState([]);
  const [treePosts,setTreePosts]=useState([]);
  const [photosReady,setPhotosReady]=useState(false);
  const [photoLimit,setPhotoLimit]=useState(30);
  const [drawStage,setDrawStage] = useState('idle');
  const drawTimer = useRef(null);
  const migratedDraw = useRef('');
  const drawSeenTask=useRef(null);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [messageInput, setMessageInput] = useState('');
  const [selectedHint, setSelectedHint] = useState('🎁');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const pendingActions = useRef(new Set());
  const identityRef = useRef('');
  const isAdmin = !!user && user.email === ADMIN_EMAIL && !user.isAnonymous;
  const roundId = publicConfig.roundId || '';
  const myName = assignment?.name || '';
  const isLoggedIn = !!user && !user.isAnonymous && !isAdmin && !!session && !!assignment?.active &&
    publicConfig.hasDraw && assignment.roundId === roundId && !!assignment.targetName;
  const identity = `${user?.uid || ''}\n${myName}\n${roundId}`;
  identityRef.current = identity;
  const config = { ...publicConfig, pairs: isAdmin || publicConfig.isRevealed ? revealedPairs : null };
  const loading = !authReady || (!!user && !configReady) ||
    (!!user && !isAdmin && (!sessionReady || (!!session && !assignmentReady))) ||
    (isAdmin && !membersReady) || ((isAdmin || isLoggedIn) && !profilesReady);
  const showModal = (title, message, type = 'info') => setModal({ show: true, title, message, type });
  const fail = error => showModal('오류', connectionMessage(error), 'error');
  const bgm=useYouTubeBgm();
  const dataReady = !!user && configReady;
  const clearDrawTimer = () => {if(drawTimer.current!==null)clearTimeout(drawTimer.current);drawTimer.current=null;};

  useEffect(() => {
    if (!auth || !db) { setAuthReady(true); fail(initializationError); return; }
    let stopped = false, signingIn = false;
    const unsubscribe = onAuthStateChanged(auth, current => {
      if (stopped) return;
      setUser(current); setAuthReady(!!current);
      if (!current && !signingIn) {
        signingIn = true;
        signInAnonymously(auth).catch(error => { if (!stopped) { setAuthReady(true); fail(error); } }).finally(() => { signingIn = false; });
      }
    }, error => { if (!stopped) { setAuthReady(true); fail(error); } });
    return () => { stopped = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    setConfigReady(false); setPublicConfig({ hasDraw: false, isRevealed: false, roundId: '' });
    if (!user) return;
    return onSnapshot(dataDoc('settings_config'), snapshot => {
      setPublicConfig(snapshot.exists() ? snapshot.data() : { hasDraw: false, isRevealed: false, roundId: '' });
      setConfigReady(true);
    }, error => { setConfigReady(true); fail(error); });
  }, [user?.uid]);

  useEffect(() => {
    const timer = setInterval(() => setVisitDay(koreaDay()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setVisitStats({today:null,total:null});
    if (!user) return;
    const totalStop = onSnapshot(visitStatDoc('total'), snap => setVisitStats(old => ({...old,total:snap.exists() ? snap.data().count : 0})), () => setVisitStats(old => ({...old,total:null})));
    const dayStop = onSnapshot(visitStatDoc(`day-${visitDay}`), snap => setVisitStats(old => ({...old,today:snap.exists() ? snap.data().count : 0})), () => setVisitStats(old => ({...old,today:null})));
    return () => {totalStop();dayStop();};
  }, [user?.uid, visitDay]);

  useEffect(() => {
    if (!user || viewCounted.current) return;
    // 인증 계정이 익명→직원으로 바뀌어도 같은 페이지 열기는 한 번만 셉니다.
    // 개인 식별 정보 없이 집계하며 캐릭터의 접속 여부와는 연동하지 않습니다.
    viewCounting.current = viewCounting.current.catch(() => {}).then(async () => {
      if (viewCounted.current) return;
      await runTransaction(db, async transaction => {
        const page = await transaction.get(pageViewDoc(pageViewId.current));
        if (page.exists()) return;
        const day = koreaDay();
        const [total, today] = await Promise.all([transaction.get(visitStatDoc('total')), transaction.get(visitStatDoc(`day-${day}`))]);
        transaction.set(pageViewDoc(pageViewId.current), {day,at:serverTimestamp()});
        transaction.set(visitStatDoc('total'), {count:(total.exists() ? total.data().count : 0)+1,lastViewId:pageViewId.current});
        transaction.set(visitStatDoc(`day-${day}`), {count:(today.exists() ? today.data().count : 0)+1,lastViewId:pageViewId.current});
      });
      viewCounted.current = true;
    }).catch(() => { /* 규칙 교체 전에는 집계 표시를 비워두고 앱은 계속 이용합니다. */ });
  }, [user?.uid]);

  useEffect(() => {
    setSession(null); setSessionReady(false); setAssignment(null); setRevealedPairs({});
    setPresentationOpen(isAdmin);
    setViewState(isAdmin ? 'admin' : 'login');
    // 저장된 계정은 Firebase 인증 UID에만 연결됩니다. 이름만 바꿔 다른 계정으로 전환할 수 없습니다.
    if (!user || user.isAnonymous || isAdmin) { setSessionReady(true); return; }
    if(approvedSession.current?.uid===user.uid){setSession(approvedSession.current.data);setSessionReady(true);}
    return onSnapshot(accountDoc(user.uid), { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) return;
      approvedSession.current=null;
      setSession(snapshot.exists() ? snapshot.data() : null); setSessionReady(true);
    },
      error => { setSessionReady(true); fail(error); });
  }, [user?.uid, user?.isAnonymous, isAdmin]);

  useEffect(() => {
    setAssignment(null); setAssignmentReady(false);
    if (!user || isAdmin || !session?.inviteId) { setAssignmentReady(true); return; }
    return onSnapshot(inviteDoc(session.inviteId), {includeMetadataChanges:true}, snapshot => { if(snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)return; setAssignment(snapshot.exists() ? snapshot.data() : null); setAssignmentReady(true); },
      error => { setAssignmentReady(true); setAssignment(null); fail(error); });
  }, [user?.uid, isAdmin, session?.inviteId]);

  useEffect(() => {
    setMembers([]); setMembersReady(false);
    if (!isAdmin) { setMembersReady(true); return; }
    return onSnapshot(dataDoc('settings_members'), snapshot => { setMembers(snapshot.exists() ? snapshot.data().list || [] : []); setMembersReady(true); },
      error => { setMembersReady(true); fail(error); });
  }, [user?.uid, isAdmin]);

  useEffect(() => {
    setProfiles({}); setProfilesReady(false);
    if (!isAdmin && !isLoggedIn) { setProfilesReady(true); return; }
    return onSnapshot(query(profilesCollection(), limit(200)), snapshot => {
      setProfiles(Object.fromEntries(snapshot.docs.map(item => ({...item.data(), _memberId:item.id})).filter(item => typeof item.name === 'string').map(item => [item.name, item])));
      setProfilesReady(true);
    }, error => { setProfilesReady(true); fail(error); });
  }, [user?.uid, isAdmin, isLoggedIn, roundId]);

  useEffect(()=>{
    if(!isLoggedIn){roomEntryAttempt.current='';return;}
    if(!profilesReady)return;
    if(!hasProfile(profiles[myName])){roomEntryAttempt.current='';return;}
    const key=`${user.uid}:${assignment.memberId}`;
    if(roomEntryAttempt.current===key)return;
    roomEntryAttempt.current=key;
    setDoc(profileDoc(assignment.memberId),{roomEnteredAt:serverTimestamp()},{merge:true}).catch(error=>{
      showModal('미니룸 입장 확인','미니룸 표시 시간을 저장하지 못했어요. 동봉한 최신 Firestore 규칙을 게시한 후 다시 접속해주세요.','error');
    });
  },[isLoggedIn,user?.uid,assignment?.memberId,profilesReady,profiles,myName]);

  useEffect(()=>{
    setTreePosts([]);if(!isAdmin&&!isLoggedIn)return;
    return onSnapshot(query(treeCollection(),limit(200)),snap=>setTreePosts(snap.docs.map(item=>({...item.data(),memberId:item.id}))),fail);
  },[user?.uid,isAdmin,isLoggedIn]);

  useEffect(()=>{
    setReadReady(false);setReadState({photosAt:0,guestbookAt:0});
    if(!user || (!isAdmin&&!isLoggedIn))return;
    return onSnapshot(doc(db,'artifacts',appId,'readStates',user.uid),snap=>{
      const data=snap.exists()?snap.data({serverTimestamps:'estimate'}):{};
      setReadState({photosAt:data.photosAt?.toMillis?.()||0,guestbookAt:data.guestbookAt?.toMillis?.()||0});setReadReady(true);
    },()=>setReadReady(true));
  },[user?.uid,isAdmin,isLoggedIn]);
  useEffect(()=>{
    setLatestPhotoAt(0);if(!isAdmin&&!isLoggedIn)return;
    return onSnapshot(query(photosCollection(),orderBy('createdAt','desc'),limit(1)),snap=>{
      const latest=snap.docs[0];if(latest?.metadata.hasPendingWrites)return;
      setLatestPhotoAt(latest?.data().createdAt?.toMillis?.()||0);
    },()=>setLatestPhotoAt(0));
  },[user?.uid,isAdmin,isLoggedIn]);
  const latestGuestAt=events.reduce((latest,event)=>Math.max(latest,event.timestamp||0),0);
  const latestVisiblePhotoAt=photoPosts.reduce((latest,post)=>Math.max(latest,post.createdAt||0),0);
  useEffect(()=>{
    if(!readReady || (!isAdmin&&!isLoggedIn) || !['photos','guestbook'].includes(activeTab))return;
    if(activeTab==='photos'&&!photosReady)return;
    const key=activeTab==='photos'?'photosAt':'guestbookAt',stamp=activeTab==='photos'?latestVisiblePhotoAt:latestGuestAt;
    if(!stamp || readState[key]>=stamp)return;
    const attempt=`${user.uid}:${key}:${stamp}`;if(readAttempts.current.has(attempt))return;
    readAttempts.current.add(attempt);
    setDoc(doc(db,'artifacts',appId,'readStates',user.uid),{[key]:serverTimestamp()},{merge:true}).catch(()=>readAttempts.current.delete(attempt));
  },[user?.uid,isAdmin,isLoggedIn,activeTab,readReady,readState,photosReady,latestGuestAt,latestVisiblePhotoAt]);

  useEffect(()=>{
    setPhotoPosts([]);setPhotosReady(false);
    if(activeTab!=='photos' || (isAdmin?presentationOpen:!isLoggedIn))return;
    return onSnapshot(query(photosCollection(),orderBy('createdAt','desc'),limit(photoLimit)),snap=>{
      setPhotoPosts(snap.docs.map(item=>{const post=item.data({serverTimestamps:'estimate'});return {...post,id:item.id,createdAt:post.createdAt?.toMillis?.()||0};}));setPhotosReady(true);
    },error=>{setPhotosReady(true);fail(error);});
  },[user?.uid,isAdmin,isLoggedIn,activeTab,photoLimit,presentationOpen]);

  useEffect(() => {
    setEvents([]);
    if (!roundId || (!isAdmin && !isLoggedIn)) return;
    return onSnapshot(query(eventsCollection(roundId), orderBy('timestamp', 'desc'), limit(300)), snapshot => {
      setEvents(snapshot.docs.map(item => { const event = item.data(); return { ...event, id: item.id, timestamp: event.timestamp?.toMillis?.() || 0 }; }));
    }, fail);
  }, [user?.uid, isAdmin, isLoggedIn, roundId]);

  useEffect(() => {
    setRevealedPairs({});
    if (!user || (!isAdmin && !(isLoggedIn && publicConfig.isRevealed))) return;
    if (isAdmin) return onSnapshot(dataDoc('reveal'), snapshot => setRevealedPairs(snapshot.exists() ? snapshot.data().pairs || {} : {}), fail);
    let active = true;
    getDoc(dataDoc('reveal')).then(snapshot => {
      if (active) setRevealedPairs(snapshot.exists() ? snapshot.data().pairs || {} : {});
    }).catch(error => { if (active && error.code !== 'permission-denied') fail(error); });
    return () => { active = false; };
  }, [user?.uid, isAdmin, isLoggedIn, publicConfig.isRevealed, roundId]);

  useEffect(() => {
    clearDrawTimer();setDrawStage('idle');setActiveTab('home');setPhotoLimit(30);setShowMessageModal(false);setShowProfileEditor(false);setMessageInput('');
    return clearDrawTimer;
  }, [identity]);

  useEffect(() => {
    if (loading) return;
    if (isAdmin) { setViewState('admin'); return; }
    if (!isLoggedIn) { setViewState('login'); return; }
    if (!hasProfile(profiles[myName])) {clearDrawTimer();setDrawStage('idle');setActiveTab('home');setShowProfileEditor(false);setViewState('profileSetup');}
    else if (drawStage === 'revealed') return;
    else if (profiles[myName]?.drawSeenRoundId === roundId || (!hasOwn(profiles[myName],'drawSeenRoundId') && readStorage(drawStorageKey(myName,roundId)) === 'true')) setViewState('dashboard');
    else setViewState('draw');
  }, [loading, isAdmin, isLoggedIn, profiles, myName, roundId,drawStage]);

  const getMyTarget = () => isLoggedIn ? assignment.targetName : null;
  const getMySanta = () => publicConfig.isRevealed ? Object.keys(revealedPairs).find(name => revealedPairs[name] === myName) : null;
  const runAction = async (key, action, adminOnly = false) => {
    if (pendingActions.current.has(key)) return false;
    if (!user || !dataReady) { showModal('연결 확인', '서버 연결 후 다시 시도해주세요.', 'error'); return false; }
    if (adminOnly && !isAdmin) { showModal('알림', '방장 인증이 필요합니다.', 'error'); return false; }
    pendingActions.current.add(key);
    try { return await action() !== false; } catch (error) { fail(error); return false; }
    finally { pendingActions.current.delete(key); }
  };
  const requireParticipant = current => {
    if (!isLoggedIn || !current?.hasDraw || current.roundId !== roundId) throw new Error('배정이 변경되었습니다. 본인의 이름과 번호로 다시 입장해주세요.');
  };
  const handleAdminAuth = async () => runAction('admin-auth', async () => {
    if (!adminPwd) throw new Error('관리자 비밀번호를 입력해주세요.');
    // 화면에서는 기존의 네 자리 번호만 입력합니다. 검증은 Firebase가 수행합니다.
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, `manito-${adminPwd}`);
    setAdminPwd(''); setShowAdminAuth(false);
  });

  const saveMembers = async (newList, resetId) => {
    const normalized = await normalizeMembers(newList, members, resetId);
    const changed = !sameNames(members, normalized);
    if (changed && publicConfig.hasDraw && !window.confirm('구성원 이름이나 인원을 변경하면 현재 배정이 해제됩니다. 변경 후 다시 뽑아주세요. 계속할까요?')) return false;
    await runTransaction(db, async transaction => {
      const [membersSnap, configSnap, revealSnap] = await Promise.all([transaction.get(dataDoc('settings_members')), transaction.get(dataDoc('settings_config')), transaction.get(dataDoc('reveal'))]);
      const oldMembers = membersSnap.exists() ? membersSnap.data().list || [] : [];
      const current = configSnap.exists() ? configSnap.data() : {};
      if (rosterFingerprint(oldMembers) !== rosterFingerprint(members) || (current.roundId || '') !== roundId) throw new Error('다른 창에서 명단이 변경되었습니다. 최신 상태에서 다시 시도해주세요.');
      const oldKeys = await Promise.all(oldMembers.map(async m => m.nameKey || await hashToken(m.name)));
      const loginSnaps = await Promise.all(oldKeys.map(key => transaction.get(loginDoc(key))));
      const oldLogins = new Map(oldMembers.map((m,i) => [m.id, { key: oldKeys[i], data: loginSnaps[i].exists() ? loginSnaps[i].data() : null }]));
      // 모든 읽기를 끝낸 뒤 작성합니다. 번호 초기화 시 배정과 활동 내역은 보존합니다.
      for (const old of oldMembers) {
        const next = normalized.find(item => item.id === old.id);
        if (!next || old.inviteId !== next.inviteId) {
          if (old.inviteId) transaction.set(inviteDoc(old.inviteId), { active: false }, { merge: true });
          const previous = oldLogins.get(old.id);
          if (previous?.data?.ownerUid) transaction.delete(accountDoc(previous.data.ownerUid));
          transaction.delete(loginDoc(previous.key));
          if (!next) transaction.delete(profileDoc(old.id));
        }
      }
      for (const member of normalized) {
        const old = oldMembers.find(item => item.id === member.id);
        const oldLogin = oldLogins.get(member.id)?.data;
        const rotated = !old || old.inviteId !== member.inviteId;
        const targetName = revealSnap.data()?.pairs?.[member.name] || '';
        const target = normalized.find(item => item.name === targetName);
        let assignmentData = {};
        if (changed) assignmentData = { targetId: '', targetName: '', targetDepartment: '', roundId: '' };
        else if (target && current.hasDraw) {
          assignmentData = { targetDepartment: target.department };
          if (rotated) Object.assign(assignmentData, { targetId: target.id, targetName: target.name, roundId });
        }
        transaction.set(inviteDoc(member.inviteId), { memberId: member.id, name: member.name, active: true, ...assignmentData }, { merge: true });
        transaction.set(loginDoc(member.nameKey), { name: member.name, memberId: member.id, inviteId: member.inviteId,
          email: member.loginEmail, ownerUid: !rotated && oldLogin?.email === member.loginEmail ? oldLogin.ownerUid || '' : '' });
        if (old && old.name !== member.name) transaction.set(profileDoc(member.id), { name: member.name }, { merge: true });
      }
      transaction.set(dataDoc('settings_members'), { list: normalized });
      if (changed || !configSnap.exists()) {
        transaction.set(dataDoc('settings_config'), { hasDraw: false, isRevealed: false, roundId: makeId() });
        transaction.set(dataDoc('reveal'), { pairs: {} });
      }
    });
  };
  const handleUpdateMembers = newList => runAction('admin', () => saveMembers(newList), true);
  const handleResetPin = id => runAction('admin', async () => {
    const member = members.find(m => m.id === id);
    if (!member || !window.confirm(`${member.name}님의 번호를 초기화할까요? 기존 번호는 사용할 수 없고, 공통 주소에서 새 번호를 등록해야 합니다.`)) return false;
    await saveMembers(members, id);
    showModal('번호 초기화', `${member.name}님이 공통 주소에서 '처음 등록'을 눌러 새 번호를 정하면 됩니다. 배정과 활동 내역은 유지됩니다.`);
  }, true);
  const handleResetMinime=id=>runAction('admin',async()=>{
    const member=members.find(item=>item.id===id);if(!member)throw new Error('구성원을 확인해주세요.');
    if(!window.confirm(`${member.name}님의 미니미를 초기화할까요? 캐릭터·별명 선택과 첫 뽑기 확인부터 다시 진행합니다. 로그인 번호와 마니또 배정은 유지됩니다.`))return false;
    await runTransaction(db,async transaction=>{
      const [setting,snapshot]=await Promise.all([transaction.get(dataDoc('settings_config')),transaction.get(profileDoc(id))]);
      if(setting.exists()&&setting.data().roundId!==roundId)throw new Error('배정 회차가 변경되었습니다. 최신 상태를 확인해주세요.');
      const previous=snapshot.exists()?snapshot.data():{};
      transaction.set(profileDoc(id),{name:member.name,nickname:'',avatar:'',drawSeenRoundId:'',giftSubmitted:previous.giftSubmitted===true,giftRoundId:previous.giftRoundId||roundId});
    });
    showModal('미니미 초기화',`${member.name}님이 같은 이름과 번호로 로그인하면 캐릭터·별명부터 다시 정할 수 있습니다.`);
  },true);
  const handleResetAllMinimes=()=>runAction('admin-bulk-minime',async()=>{
    if(!members.length)throw new Error('초기화할 구성원이 없습니다.');
    await runTransaction(db,async transaction=>{
      const configSnap=await transaction.get(dataDoc('settings_config'));
      if(configSnap.exists()&&configSnap.data().roundId!==roundId)throw new Error('배정 회차가 변경되었습니다. 새로고침 후 다시 진행해주세요.');
      const snaps=await Promise.all(members.map(m=>transaction.get(profileDoc(m.id))));
      members.forEach((m,index)=>{
        const previous=snaps[index].exists()?snaps[index].data():{};
        transaction.set(profileDoc(m.id),{name:m.name,nickname:'',avatar:'',drawSeenRoundId:'',giftSubmitted:previous.giftSubmitted===true,giftRoundId:previous.giftRoundId||roundId});
      });
    });
    showModal('전체 미니미 초기화 완료',`${members.length}명의 미니미와 별명이 초기화되었습니다. 각자 기존 번호로 로그인하여 다시 선택할 수 있습니다.`);
  },true);
  const handleResetAllPins=()=>runAction('admin-bulk-pin',async()=>{
    if(!members.length)throw new Error('초기화할 구성원이 없습니다.');
    if(members.length>90)throw new Error('전체 번호 초기화는 한 번에 최대 90명까지 지원합니다.');
    await saveMembers(members,new Set(members.map(member=>member.id)));
    showModal('전체 비밀번호 초기화 완료',`${members.length}명의 번호를 초기화했습니다. 모두 공통 주소에서 '처음 등록'으로 새 4자리 번호를 정해주세요.`);
  },true);
  const migrationAttempt = useRef('');
  useEffect(() => {
    if (!isAdmin || !membersReady || !configReady || !members.length || members.every(m => m.nameKey && m.loginEmail)) return;
    const key = rosterFingerprint(members);
    if (migrationAttempt.current === key) return;
    migrationAttempt.current = key;
    handleUpdateMembers(members);
  }, [isAdmin, membersReady, configReady, members]);

  const departmentSyncRound = useRef('');
  useEffect(() => {
    if (!isAdmin || !membersReady || !configReady || !publicConfig.hasDraw || !roundId || !members.length) return;
    if (departmentSyncRound.current === roundId) return;
    departmentSyncRound.current = roundId;
    runTransaction(db, async transaction => {
      const [configSnap, membersSnap] = await Promise.all([
        transaction.get(dataDoc('settings_config')),
        transaction.get(dataDoc('settings_members'))
      ]);
      const current = configSnap.data();
      if (!current?.hasDraw || current.roundId !== roundId) return;
      const roster = membersSnap.data()?.list || [];
      const byId = new Map(roster.map(member => [member.id, member]));
      const invitations = await Promise.all(roster.filter(member => member.inviteId)
        .map(member => transaction.get(inviteDoc(member.inviteId))));
      for (const invitation of invitations) {
        const data = invitation.data();
        if (!data?.active || data.roundId !== roundId) continue;
        const target = byId.get(data.targetId) || roster.find(member => member.name === data.targetName);
        const department = String(target?.department || '').trim();
        if (department && data.targetDepartment !== department) {
          transaction.update(invitation.ref, { targetDepartment: department });
        }
      }
    }).catch(error => {
      if (departmentSyncRound.current === roundId) departmentSyncRound.current = '';
      fail(error);
    });
  }, [isAdmin, membersReady, configReady, publicConfig.hasDraw, roundId, members]);

  const handleAdminSetup = async () => runAction('admin', async () => {
    if (members.some(m => !m.nameKey || !m.loginEmail)) throw new Error('명단의 로그인 설정 중입니다. 잠시 후 다시 눌러주세요.');
    const normalized = await normalizeMembers(members.filter(member => member.name.trim() !== ADMIN_LOGIN_NAME), members);
    if (normalized.length < 2) throw new Error('최소 2명 이상의 구성원을 등록해주세요.');
    if (publicConfig.hasDraw && !window.confirm('다시 배정하면 기존 배정과 선물 준비 현황이 초기화됩니다. 다시 배정할까요?')) return false;
    const shuffled = [...normalized];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const values = new Uint32Array(1); const range = i + 1; const bound = Math.floor(0x100000000 / range) * range;
      do { crypto.getRandomValues(values); } while (values[0] >= bound);
      const j = values[0] % range; [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const pairs = Object.fromEntries(shuffled.map((member, i) => [member.name, shuffled[(i + 1) % shuffled.length].name]));
    const newRoundId = makeId();
    await runTransaction(db, async transaction => {
      const [membersSnap, configSnap] = await Promise.all([transaction.get(dataDoc('settings_members')), transaction.get(dataDoc('settings_config'))]);
      const currentMembers = membersSnap.exists() ? membersSnap.data().list || [] : [];
      const current = configSnap.exists() ? configSnap.data() : {};
      if (rosterFingerprint(currentMembers) !== rosterFingerprint(members) || (current.roundId || '') !== roundId) throw new Error('명단이나 배정이 변경되었습니다. 최신 상태에서 다시 실행해주세요.');
      for (let i = 0; i < shuffled.length; i++) {
        const member = shuffled[i], target = shuffled[(i + 1) % shuffled.length];
        transaction.set(inviteDoc(member.inviteId), { memberId: member.id, name: member.name, active: true, targetId: target.id, targetName: target.name, targetDepartment: target.department, roundId: newRoundId });
        transaction.set(profileDoc(member.id), { name: member.name, giftSubmitted: false, giftRoundId: newRoundId }, { merge: true });
      }
      transaction.set(dataDoc('settings_members'), { list: members });
      transaction.set(dataDoc('reveal'), { pairs });
      transaction.set(dataDoc('settings_config'), { hasDraw: true, isRevealed: false, roundId: newRoundId });
    });
    showModal('성공!', `${normalized.length}명의 마니또 배정이 완료되었습니다! 모두에게 같은 사이트 주소를 알려주세요. 직원은 '처음 등록'에서 본인 이름과 4자리 번호를 정하면 됩니다.`);
  }, true);

  const handleLogin = async (name, pin, confirmation, registering) => runAction('login', async () => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('이름을 입력해주세요.');
    if (!/^\d{4}$/.test(pin)) throw new Error('번호는 숫자 4자리로 입력해주세요.');
    if (cleanName === ADMIN_LOGIN_NAME) {
      if (registering) throw new Error('방장은 로그인 탭에서 입장해주세요.');
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, `manito-${pin}`);
      return;
    }
    if (registering && pin !== confirmation) throw new Error('두 번 입력한 번호가 다릅니다. 다시 확인해주세요.');
    if (!publicConfig.hasDraw) throw new Error('아직 방장이 마니또 설정을 완료하지 않았습니다. 기다려주세요!');
    const nameKey = await hashToken(cleanName), lookup = await getDocFromServer(loginDoc(nameKey));
    if (!lookup.exists() || lookup.data().name !== cleanName) throw new Error('등록된 직원 이름이 아닙니다. 이름을 확인하거나 방장에게 문의해주세요.');
    const directory = lookup.data();
    let establishedAccount;
    // Firebase에는 실제 인증 계정만 저장합니다. DB나 브라우저에 번호를 저장하지 않습니다.
    // 고정 접두사는 Firebase의 최소 길이 형식을 맞추며, 번호 자체의 강도를 늘리지는 않습니다.
    const password = `manito-pin:${pin}`;
    if (!registering) {
      if (!directory.ownerUid) throw new Error("처음 방문한 이름입니다. '처음 등록'에서 번호를 정해주세요.");
      const signed=await signInWithEmailAndPassword(auth, directory.email, password);
      if(signed.user.uid!==directory.ownerUid)throw new Error('계정 연결이 변경되었습니다. 방장에게 번호 초기화를 요청해주세요.');
      establishedAccount={name:cleanName,nameKey,memberId:directory.memberId,inviteId:directory.inviteId};
    } else {
      if (directory.ownerUid) throw new Error('이미 번호가 등록된 이름입니다. 로그인하거나 방장에게 번호 초기화를 요청해주세요.');
      let credential;
      try {
        if(auth.currentUser?.isAnonymous){
          // 임시 방문 계정을 직원 계정으로 전환해, 처음 등록할 때 계정을 두 개 만들지 않습니다.
          try {
            await linkWithCredential(auth.currentUser,EmailAuthProvider.credential(directory.email,password));
            credential=await signInWithEmailAndPassword(auth,directory.email,password);
          } catch(error) {
            if(error.code!=='auth/operation-not-allowed')throw error;
            credential=await createUserWithEmailAndPassword(auth,directory.email,password);
          }
        }else credential=await createUserWithEmailAndPassword(auth,directory.email,password);
      }
      catch (error) {
        if (!['auth/email-already-in-use','auth/credential-already-in-use'].includes(error.code)) throw error;
        // 계정 생성 직후 통신이 끊긴 경우 같은 번호로 등록을 이어갑니다.
        try { credential = await signInWithEmailAndPassword(auth, directory.email, password); }
        catch { throw new Error('이 이름의 등록이 진행되었거나 번호가 다릅니다. 방장에게 번호 초기화를 요청해주세요.'); }
      }
      const uid = credential.user.uid;
      establishedAccount=await runTransaction(db, async transaction => {
        const [fresh, existing] = await Promise.all([transaction.get(loginDoc(nameKey)), transaction.get(accountDoc(uid))]);
        if (!fresh.exists() || fresh.data().email !== directory.email || (fresh.data().ownerUid && fresh.data().ownerUid !== uid)) throw new Error('이미 등록되었거나 명단이 변경되었습니다. 다시 확인해주세요.');
        if (existing.exists() && existing.data().nameKey !== nameKey) throw new Error('계정 연결을 확인해주세요.');
        const record={name:cleanName,nameKey,memberId:directory.memberId,inviteId:directory.inviteId};
        transaction.set(accountDoc(uid),record);
        transaction.update(loginDoc(nameKey), { ownerUid: uid });
        return record;
      });
    }
    // 가입 트랜잭션이 확정되어도 기존 문서 구독에는 직전의 빈 스냅샷이 남을 수 있습니다.
    // 확정된 계정 연결을 사용하고, 배정은 서버 권한 검사를 거쳐 직접 확인합니다.
    const currentUser=auth.currentUser;
    const assigned=await getDocFromServer(inviteDoc(establishedAccount.inviteId));
    if(auth.currentUser?.uid!==currentUser.uid)return false;
    approvedSession.current={uid:currentUser.uid,data:establishedAccount};
    setUser(currentUser);setSession(establishedAccount);setSessionReady(true);
    setAssignment(assigned.exists()?assigned.data():null);setAssignmentReady(true);
    window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
  });

  async function handleLogout() {
    clearDrawTimer();setDrawStage('idle');approvedSession.current=null;identityRef.current = '';
    setShowMessageModal(false); setMessageInput(''); setSelectedHint('🎁');
    setShowAdminAuth(false); setShowProfileEditor(false); setAdminPwd(''); setViewState('login');
    try { await signOut(auth); } catch (error) { fail(error); }
  }

  const handleProfileSetup = async (nickname, avatar) => runAction('profile', async () => {
    const clean = nickname.trim();
    if (!clean || clean.length > 30 || !AVATARS.includes(avatar)) throw new Error('별명은 1~30자로 입력하고 캐릭터를 선택해주세요.');
    requireParticipant(publicConfig);
    await setDoc(profileDoc(assignment.memberId), { name: myName, nickname: clean, avatar,
      giftSubmitted: !!profilesForRound(profiles, config)[myName]?.giftSubmitted, giftRoundId: roundId,drawSeenRoundId:profiles[myName]?.drawSeenRoundId === roundId ? roundId : '',roomEnteredAt:profiles[myName]?.roomEnteredAt||serverTimestamp() });
  });

  const markDrawSeen = () => {
    if(drawSeenTask.current?.identity===identity)return drawSeenTask.current.promise;
    const task={identity,promise:runAction('draw-seen',async()=>{
      requireParticipant(publicConfig);
      await setDoc(profileDoc(assignment.memberId),{drawSeenRoundId:roundId},{merge:true});
      writeStorage(drawStorageKey(myName,roundId),'true');
    })};
    drawSeenTask.current=task;task.promise.finally(()=>{if(drawSeenTask.current===task)drawSeenTask.current=null;});return task.promise;
  };
  // 이전 버전에서 같은 브라우저에 저장한 확인 기록도 계정으로 옮깁니다.
  useEffect(()=>{
    if(!isLoggedIn || !hasProfile(profiles[myName]) || hasOwn(profiles[myName],'drawSeenRoundId') || readStorage(drawStorageKey(myName,roundId))!=='true')return;
    const key=`${user.uid}:${roundId}`;if(migratedDraw.current===key)return;migratedDraw.current=key;
    markDrawSeen();
  },[isLoggedIn,user?.uid,myName,roundId,profiles]);
  const startDraw = () => {
    if(drawTimer.current!==null || drawStage!=='idle' || !getMyTarget())return;
    const started=identity;setDrawStage('drawing');
    drawTimer.current=setTimeout(()=>{
      drawTimer.current=null;if(identityRef.current!==started)return;
      setDrawStage('revealed');markDrawSeen();
    },window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1950);
  };
  const goDashboard = async()=>{if(drawStage==='revealed' && await markDrawSeen())setViewState('dashboard');};

  const toggleReveal = async () => runAction('admin', async () => {
    const next = !publicConfig.isRevealed;
    if(next&&!window.confirm('마니또 배정 결과를 발표 화면과 참가자 화면에 공개할까요?'))return false;
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(dataDoc('settings_config'));
      const current = snapshot.exists() ? snapshot.data() : {};
      if (!current.hasDraw || current.roundId !== roundId) throw new Error('먼저 배정 상태를 확인해주세요.');
      if(Boolean(current.isRevealed)===next)return;
      transaction.update(dataDoc('settings_config'), { isRevealed: next });
    });
    showModal('알림', `마니또 정체가 ${next ? '공개' : '비공개'} 되었습니다! 🎄`);
  }, true);

  const handleGiftSubmit = async () => runAction('gift', async () => {
    if (!giftOpens()) throw new Error('선물 준비 완료는 2026년 12월 20일(한국시간)부터 제출할 수 있어요.');
    requireParticipant(publicConfig);
    await setDoc(profileDoc(assignment.memberId), { giftSubmitted: true, giftRoundId: roundId }, { merge: true });
    if (identityRef.current === identity) showModal('감사합니다!', '선물 준비가 성공적으로 확인되었습니다. 🎅🎁');
  });

  const handleUndoGift = name => runAction('admin',async()=>{
    const member=members.find(m=>m.name===name);
    if(!member)throw new Error('구성원 명단을 확인해주세요.');
    if(!window.confirm(`${name}님의 선물 준비 완료 표시를 삭제하고 미제출자로 되돌릴까요?`))return false;
    await runTransaction(db,async transaction=>{
      const [current,profile]=await Promise.all([transaction.get(dataDoc('settings_config')),transaction.get(profileDoc(member.id))]);
      if(!current.exists() || current.data().roundId!==roundId)throw new Error('배정 회차가 변경되었습니다. 최신 현황을 확인해주세요.');
      if(!profile.exists())throw new Error('선물 준비 기록을 찾을 수 없습니다.');
      transaction.update(profileDoc(member.id),{giftSubmitted:false,giftRoundId:roundId});
    });
  },true);

  const handleTreeSave=(message,kind,color)=>runAction('tree-save',async()=>{
    if(!isAdmin)requireParticipant(publicConfig);
    const clean=String(message).trim();if(!clean||clean.length>160)throw new Error('크리스마스 한마디를 1~160자로 적어주세요.');
    if(!TREE_KINDS.includes(kind)||!TREE_COLORS.includes(color))throw new Error('장식 모양과 색을 골라주세요.');
    const memberId=isAdmin?'admin':assignment.memberId;
    await setDoc(doc(treeCollection(),memberId),{memberId,uid:user.uid,nickname:isAdmin?'방장':profiles[myName].nickname,message:clean,kind,color,updatedAt:serverTimestamp()});
  });
  const handleTreeDelete=post=>runAction('tree-delete',async()=>{
    if(!isAdmin)requireParticipant(publicConfig);
    if(!isAdmin&&post.memberId!==assignment.memberId)throw new Error('내 장식만 삭제할 수 있습니다.');
    if(!window.confirm('내 트리 장식과 한마디를 삭제할까요?'))return false;
    await deleteDoc(doc(treeCollection(),post.memberId));
  });

  const handlePhotoPost = (text,image) => runAction('photo-post',async()=>{
    if(!isAdmin)requireParticipant(publicConfig);
    const clean=String(text).trim();
    if((!clean&&!image)||clean.length>500)throw new Error('사진이나 1~500자의 글을 입력해주세요.');
    if(image && (!image.startsWith('data:image/jpeg;base64,')||image.length>MAX_PHOTO_URL))throw new Error('사진을 다시 골라주세요.');
    const id=makeId();
    await setDoc(doc(photosCollection(),id),{id,uid:user.uid,memberId:isAdmin?'admin':assignment.memberId,nickname:isAdmin?'방장':profiles[myName].nickname,text:clean,image:image||'',createdAt:serverTimestamp()});
  });
  const handlePhotoDelete = post => runAction('photo-delete',async()=>{
    if(!isAdmin)requireParticipant(publicConfig);
    if(!isAdmin&&post.memberId!==assignment.memberId)throw new Error('본인이 올린 글만 삭제할 수 있습니다.');
    if(!window.confirm('사진첩의 이 글을 삭제할까요?'))return false;
    await deleteDoc(doc(photosCollection(),post.id));
  });

  const postEvent = async (type, text = '', hint = '') => runAction('event', async () => {
    requireParticipant(publicConfig);
    const clean = String(text).trim();
    if (!['activity', 'message'].includes(type)) throw new Error('활동 종류를 확인해주세요.');
    if (type === 'message' && (!clean || clean.length > 1000)) throw new Error('메시지는 1~1,000자로 입력해주세요.');
    const id = makeId(), target = getMyTarget();
    await setDoc(doc(eventsCollection(roundId), id), { id, type, target, targetId: assignment.targetId, text: type === 'message' ? clean : '',
      hint: type === 'message' && HINTS.some(item => item.icon === hint) ? hint : '', timestamp: serverTimestamp(), roundId });
    if (identityRef.current !== identity) return;
    if (type === 'activity') showModal('성공!', `${target}님 자리로 몰래 다녀간 것을 알렸습니다! 🎁`);
    else { setShowMessageModal(false); setMessageInput(''); showModal('성공!', `${target}님 방명록에 익명 메시지를 보냈습니다! 💌`); }
  });


  // === Renders ===
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-center justify-center cyworld-font">
        <div className="animate-spin text-orange-500"><Snowflake size={48} /></div>
      </div>
    );
  }

  const visibleProfiles = profilesForRound(profiles, config);
  const visibleEvents = events.filter(event => event.type !== 'visit' && (!event.roundId ? !config?.roundId : event.roundId === roundId));
  const myProfile = visibleProfiles[myName] || { nickname: myName, avatar: '🎅' };

  return (
    <div data-wide-view={isAdmin&&presentationOpen?'true':undefined} className="h-[100dvh] w-full bg-[#d1d5db] cyworld-font relative overflow-hidden sm:py-4 sm:px-2 bg-[radial-gradient(#9ca3af_1px,transparent_1px)] bg-[size:12px_12px] flex items-center justify-center">
      
      <SpriteDefinitions />
      {/* Cyworld Outer Box - 폰 화면에 꽉 차게 */}
      <div className="mini-home-shell w-full h-full max-w-6xl sm:h-[94vh] bg-[#47a6b8] p-1 sm:p-2 sm:rounded-2xl sm:shadow-2xl sm:border-2 sm:border-slate-500 relative flex flex-col">
        
        {/* Inner White Box */}
        <div className="bg-white sm:border-2 border-dashed border-slate-400 sm:rounded-xl flex-1 flex flex-col relative overflow-hidden">
          
          {/* Top Info Area */}
          <div className="px-3 pt-3 pb-2 border-b-2 border-dashed border-slate-300 flex justify-between items-end text-[10px] sm:text-xs whitespace-nowrap gap-2 font-bold text-slate-500 bg-slate-50 shrink-0">
            <div>
              <span className="text-red-500">TODAY</span> <span data-testid="visit-today">{visitStats.today === null ? '—' : visitStats.today.toLocaleString('ko-KR')}</span> / <span className="text-slate-400">TOTAL</span> <span data-testid="visit-total">{visitStats.total === null ? '—' : visitStats.total.toLocaleString('ko-KR')}</span>
            </div>
            <div className="flex items-center">
              TODAY IS.. <span className="text-orange-500 ml-1 flex items-center">설렘 <Heart size={10} className="ml-1 fill-orange-500" /></span>
            </div>
          </div>

          {/* BGM Player */}
          <div className="bg-slate-100 text-[10px] sm:text-xs py-1 px-3 text-slate-600 flex items-center gap-2 border-b border-solid border-slate-200 shrink-0" data-testid="bgm-bar">
            <Music size={12} className="text-blue-500 shrink-0"/>
            <div className="flex-1 min-w-0 overflow-hidden"><marquee scrollamount="2">🎵 함께 듣는 크리스마스 음악 🎄</marquee></div>
            <button data-bgm-toggle onClick={bgm.toggle} aria-label={bgm.phase==='playing'?'음악 일시정지':'음악 재생'} title={bgm.notice||'클릭해서 음악 재생·일시정지'} className="text-blue-600 border border-slate-300 bg-white rounded-sm px-2 py-0.5 shrink-0">{bgm.phase==='playing'?'Ⅱ 일시정지':bgm.phase==='loading'?'Ⅱ 연결 중…':'▶ 재생'}</button>
            {bgm.notice&&<span className="sr-only" role="status">{bgm.notice}</span>}
          </div>

          {/* Header Title */}
          <header className="flex justify-between items-center px-3 py-2 bg-white shrink-0">
            <div className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center">
              <Gift className="text-red-500 mr-1" size={18} /> 
              울장복의 미니홈피
            </div>
            {(isLoggedIn||isAdmin) && (
              <button onClick={handleLogout} className="text-[10px] sm:text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 border border-slate-300 hover:bg-slate-300">
                로그아웃
              </button>
            )}
          </header>

          {/* Tabs */}
          <div className="flex px-3 space-x-1 mb-1 bg-white shrink-0" role="tablist" aria-label="미니홈피 메뉴">
            {[['home','홈'],['photos','사진첩'],['guestbook','방명록']].map(([tab,label])=><button key={tab} role="tab" aria-label={label} aria-selected={activeTab===tab} disabled={!isAdmin&&viewState!=='dashboard'} onClick={()=>{if(tab==='guestbook')setGuestbookIncoming(false);setActiveTab(tab);}} className={activeTab===tab?'bg-white border-t border-l border-r border-slate-400 rounded-t-lg px-3 py-1 text-xs sm:text-sm font-bold text-blue-600 z-10 -mb-[2px]':'bg-slate-200 border-t border-l border-r border-slate-300 rounded-t-lg px-3 py-1 text-xs sm:text-sm text-slate-500 z-0'}>{label}{((tab==='photos'&&activeTab!=='photos'&&latestPhotoAt>readState.photosAt)||(tab==='guestbook'&&activeTab!=='guestbook'&&latestGuestAt>readState.guestbookAt))&&<span className="tab-new" aria-label={`${label} 새 글`}>NEW</span>}</button>)}
            {isAdmin&&<button type="button" className="ml-auto rounded-t border border-slate-400 bg-[#225746] px-3 py-1 text-xs font-bold text-white sm:text-sm"
              onClick={()=>{setActiveTab('home');setPresentationOpen(value=>!value);}}>
              {presentationOpen?'구성원 관리':'관람 화면으로'}
            </button>}
          </div>

          {/* Dynamic Views (Content Area - 화면에 맞게 스크롤) */}
          <main data-testid="main-scroll" className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 bg-slate-50 border-t-2 border-solid border-slate-400 sm:rounded-b-xl overflow-y-auto custom-scrollbar">
            {isAdmin && activeTab === 'home' && !presentationOpen && (
              <AdminView
                onSetup={handleAdminSetup} 
                isRevealed={config?.isRevealed} 
                onToggleReveal={toggleReveal} 
                onBack={handleLogout}
                config={config}
                profiles={visibleProfiles}
                members={members}
                onUpdateMembers={handleUpdateMembers}
                onResetPin={handleResetPin}
                onResetMinime={handleResetMinime}
                onResetAllMinimes={handleResetAllMinimes}
                onResetAllPins={handleResetAllPins}
                onUndoGift={handleUndoGift}
              />
            )}
            {isAdmin&&presentationOpen&&<PresentationView profiles={visibleProfiles} treePosts={treePosts}
              roundId={roundId}
              hasDraw={publicConfig.hasDraw} revealed={publicConfig.isRevealed}
              pairs={publicConfig.isRevealed?revealedPairs:null} onToggleReveal={toggleReveal}
              activeTab={activeTab}/>}
            {viewState === 'login' && <LoginView onLogin={handleLogin} onGoAdmin={() => setShowAdminAuth(true)} />}
            {viewState === 'profileSetup' && <ProfileSetupView onSetup={handleProfileSetup} />}
            {isLoggedIn && viewState === 'draw' && <DrawView key={identity} target={getMyTarget()} targetDepartment={assignment?.targetDepartment} stage={drawStage} onStart={startDraw} onNext={goDashboard} profiles={visibleProfiles} />}
            {viewState === 'dashboard' && activeTab === 'home' && (
              <DashboardView 
                myName={myName}
                myMemberId={assignment?.memberId}
                incomingReadAt={readState.guestbookAt} onOpenIncoming={()=>{setGuestbookIncoming(true);setActiveTab('guestbook');}}
                treePosts={treePosts} onTreeSave={handleTreeSave} onTreeDelete={handleTreeDelete} 
                target={getMyTarget()}
                targetDepartment={assignment?.targetDepartment}
                mySanta={getMySanta()}
                pairs={config?.pairs}
                isRevealed={config?.isRevealed}
                events={visibleEvents} 
                profiles={visibleProfiles}
                onEditProfile={() => setShowProfileEditor(true)}
                onActivity={() => postEvent('activity')}
                onOpenMessage={() => setShowMessageModal(true)}
                onGiftSubmit={handleGiftSubmit}
              />
            )}
            {((isAdmin&&!presentationOpen)||viewState==='dashboard')&&activeTab==='photos'&&<PhotoChatView posts={photoPosts} ready={photosReady} onPost={handlePhotoPost} onDelete={handlePhotoDelete} onError={fail} myMemberId={assignment?.memberId||'admin'} isAdmin={isAdmin} profiles={visibleProfiles} limitCount={photoLimit} onMore={()=>setPhotoLimit(value=>Math.min(150,value+30))}/>}
            {((isAdmin&&!presentationOpen)||viewState==='dashboard')&&activeTab==='guestbook'&&<GuestbookView key={guestbookIncoming?'incoming':'all'} initialMineOnly={guestbookIncoming} events={visibleEvents} profiles={visibleProfiles} pairs={config.pairs} isRevealed={config.isRevealed} myName={myName} onWrite={isAdmin?null:()=>setShowMessageModal(true)}/>}
          </main>

        </div>
      </div>

      {/* Global Modals */}
      {showProfileEditor && isLoggedIn && <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="내 미니미 바꾸기">
        <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto custom-scrollbar"><ProfileSetupView initialProfile={myProfile} onCancel={()=>setShowProfileEditor(false)} onSetup={async(nickname,avatar)=>{if(await handleProfileSetup(nickname,avatar))setShowProfileEditor(false);}}/></div>
      </div>}
      {showAdminAuth && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in cyworld-font">
          <div className="bg-white border-2 border-slate-800 rounded-none p-1 w-full max-w-sm shadow-xl">
            <div className="border-2 border-dashed border-slate-400 p-6 flex flex-col items-center text-center bg-slate-50">
              <Lock className="text-slate-600 mb-4" size={40} />
              <h3 className="text-lg font-bold mb-2 text-slate-800">방장 인증</h3>
              <p className="text-slate-500 mb-4 text-xs">관리자 비밀번호를 입력해주세요.</p>
              <input 
                type="password" 
                className="w-full border border-slate-300 p-2 mb-4 text-center tracking-widest text-lg outline-none focus:border-slate-500"
                value={adminPwd}
                onChange={(e) => setAdminPwd(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdminAuth(); }}
                autoFocus
              />
              <div className="flex space-x-2 w-full">
                <button 
                  onClick={() => { setShowAdminAuth(false); setAdminPwd(''); }}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 font-bold border border-slate-400 hover:bg-slate-300"
                >
                  취소
                </button>
                <button 
                  onClick={handleAdminAuth}
                  className="flex-1 bg-slate-700 text-white py-2 font-bold border border-slate-900 hover:bg-slate-800"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in cyworld-font">
          <div className="bg-white border-2 border-slate-800 rounded-none p-1 w-full max-w-sm shadow-xl">
            <div className="border-2 border-dashed border-slate-400 p-6 flex flex-col items-center text-center bg-slate-50">
              {modal.type === 'error' ? <AlertCircle className="text-red-500 mb-4" size={40} /> : <Gift className="text-blue-500 mb-4" size={40} />}
              <h3 className="text-lg font-bold mb-2 text-slate-800">{modal.title}</h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">{modal.message}</p>
              <button 
                onClick={() => setModal({ ...modal, show: false })}
                className="w-full bg-slate-700 text-white py-2 font-bold hover:bg-slate-800 border border-slate-900"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input Modal with Hints */}
      {showMessageModal && !modal.show && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in cyworld-font">
          <div className="bg-white border-2 border-slate-800 rounded-none p-1 w-full max-w-sm shadow-xl">
            <div className="border-2 border-dashed border-slate-400 p-4 bg-slate-50">
              <h3 className="text-md font-bold mb-1 text-orange-600 flex items-center">
                <MessageCircle className="mr-2" size={18} /> 일촌평 남기기
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                내 마니또({getMyTarget()})에게 익명으로 메시지와 힌트를 남깁니다.
              </p>
              
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-700 mb-2 block">선물 힌트 이모티콘 🎁</label>
                <div className="flex space-x-2">
                  {HINTS.map(hint => (
                    <button
                      key={hint.label}
                      onClick={() => setSelectedHint(hint.icon)}
                      className={`text-xl p-2 border-2 rounded ${selectedHint === hint.icon ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white'} hover:bg-slate-100 transition`}
                      title={hint.label}
                    >
                      {hint.icon}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full bg-white border border-slate-300 p-2 mb-4 text-sm outline-none focus:border-orange-500 min-h-[80px]"
                placeholder="따뜻한 한마디를 적어주세요!"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 text-sm font-bold border border-slate-400 hover:bg-slate-300"
                >
                  취소
                </button>
                <button 
                  onClick={() => postEvent('message', messageInput, selectedHint)}
                  className="flex-1 bg-orange-500 text-white py-2 text-sm font-bold border border-orange-700 hover:bg-orange-600"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cyworld Font & Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap');
        .cyworld-font {
          font-family: 'Gowun Dodum', sans-serif;
        }
        .animate-wiggle {
          animation: wiggle 0.2s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #9ca3af;
        }

        html { font-size: 16px !important; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
        html, body, #root { width: 100%; margin: 0; min-width: 0; }
        .sprite-definitions { position: absolute; pointer-events: none; }
        .pixel-character { overflow: hidden; pointer-events: none; display: block; image-rendering: pixelated; flex-shrink: 0; }
        .pixel-character * {pointer-events:none;}
        .avatar-preview { width: 40px; height: 60px; }
        .avatar-option .pixel-character { width: 25px; height: 38px; }
        .photo-chat-avatar {width:24px;height:38px;margin-top:4px;}
        .target-avatar { width: 21px; height: 30px; }
        .christmas-room { background: #f6eee4; }
        .tab-new {font-size:8px;line-height:1;margin-left:4px;background:#f97316;color:white;border-radius:3px;padding:2px 3px;vertical-align:middle;}
        .room-floor-label {position:absolute;left:1.5%;font-size:10px;font-weight:bold;color:#795f4e;background:#fff7e8e8;border:1px solid #dcc6a9;padding:2px 6px;border-radius:3px;z-index:1;}
        .room-tree-button {display:block;width:100%;font-size:10px;color:#507558;background:#f4f8ed;border:0;border-bottom:1px solid #d7dccb;padding:5px;}
        .interactive-tree[role="button"] {cursor:pointer;}
        .interactive-tree:focus-visible .bare-tree-image {filter:drop-shadow(0 0 4px #fff2b7);}
        .tree-decoration {pointer-events:none;} .tree-note-hit {position:absolute;width:2.5%;height:auto;aspect-ratio:1;background:transparent;border:0;padding:0;translate:-50% -50%;z-index:1002;cursor:pointer;} .tree-decoration:hover {filter:brightness(1.15);}
        .room-toolbar { display: flex; align-items: center; gap: 10px; height: 32px; padding: 0 10px; color: #695447; font-size: 11px; border-bottom: 1px solid #dfcfbe; background: #fffaf1; }
        .room-count { margin-left: auto; color: #907966; font-size: 10px; white-space: nowrap; }
        .room-edit { border: 1px solid #cdbba7; background: #fff; border-radius: 3px; padding: 2px 7px; color: #806757; font-size: 10px; white-space: nowrap; }
        .room-scroll { overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; touch-action: pan-x pan-y; }
        .room-stage { position: relative; isolation: isolate; z-index:0; width:1000px;height:800px;margin:auto; }
        @media (min-width: 640px) {
          [data-wide-view="true"] { padding:0; }
          [data-wide-view="true"] .mini-home-shell { max-width:none; height:100%; border-radius:0; }
          [data-fit-room="true"], [data-fit-room="true"] .presentation-body {
            flex:1 1 0; min-height:0; display:flex; flex-direction:column;
          }
          [data-fit-room="true"] > :first-child { flex-shrink:0; }
          [data-fit-room="true"] .christmas-room {
            flex:1 1 0; min-height:0; display:flex; flex-direction:column;
          }
          [data-fit-room="true"] .room-toolbar,
          [data-fit-room="true"] .room-tree-button,
          [data-fit-room="true"] .room-caption { flex-shrink:0; }
          [data-fit-room="true"] .room-scroll {
            flex:1 1 0; min-height:0; container-type:size; display:grid; place-items:center; overflow:hidden;
          }
          [data-fit-room="true"] .christmas-room .room-stage {
            width:min(100%,125cqh); height:auto; aspect-ratio:1000 / 800; margin:0;
          }
          [data-fit-room="true"] .room-toolbar .room-edit { display:none; }
        }
        .room-fit .room-stage { width:min(100%,1000px);height:auto;aspect-ratio:1000 / 800; }
        .room-scene {display:block;width:100%;height:100%;background:#f4f0e9;}
        .room-background-layer {opacity:.86;filter:saturate(.90);}
        .resident-body {filter:drop-shadow(0 0 .8px #fffaf0);}
        .room-resident {cursor:pointer;outline:none;}
        .room-resident .world-avatar {width:28px;height:36px;pointer-events:none;}
        .resident-tag {visibility:hidden;}
        .room-resident:hover .resident-tag,.room-resident:focus-visible .resident-tag,.room-resident.is-selected .resident-tag {visibility:visible;}
        .room-resident:focus-visible .resident-hit {stroke:#fff2b7;stroke-width:1;}
        .motion-sheet {display:block;overflow:hidden;pointer-events:none;}
        .fire-tongue,.candle-flame {transform-box:fill-box;transform-origin:center bottom;animation:flame-flicker .9s ease-in-out infinite alternate;}
        .flame-inner {animation-delay:-.4s;animation-duration:.65s;}
        .hearth-glow,.candle-halo {animation:glow-flicker 2.2s ease-in-out infinite alternate;}
        @keyframes flame-flicker {0%{opacity:.65;transform:scale(.9,.86) skewX(-3deg)}100%{opacity:1;transform:scale(1.04,1.07) skewX(3deg)}}
        @keyframes glow-flicker {0%{opacity:.4}100%{opacity:.85}}
        .house-light {animation:room-twinkle 2.6s ease-in-out infinite;}
        .room-caption { display: flex; justify-content: space-between; gap: 8px; padding: 4px 9px; font-size: 9px; color: #9b8572; border-top: 1px solid #e6d8c6; background: #fcf6ed; }
        .room-light,.room-snow { animation: room-twinkle 3s steps(2,end) infinite; }
        .room-flame { animation: room-twinkle .8s steps(2,end) infinite; }
        @keyframes room-stroll { 0%,100% { transform: translate(0,0); } 24% { transform: translate(var(--walk-x),calc(-1 * var(--walk-y))); } 48% { transform: translate(calc(-.3 * var(--walk-x)),var(--walk-y)); } 76% { transform: translate(calc(-1 * var(--walk-x)),0); } }
        @keyframes room-step { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
        @keyframes room-twinkle { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
        @media (min-width: 1024px) { .room-stage { width:1000px;height:800px; } .room-pan-hint { display: none; } }
        @media (max-width: 639px) { .room-toolbar { gap: 6px; font-size: 10px; } .room-count { font-size: 9px; } .room-edit { padding: 2px 5px; font-size: 9px; } .room-caption { font-size: 8px; } .cyworld-font input[type=text], .cyworld-font input[type=password], .cyworld-font textarea { font-size: 16px; } .login-panel { padding: 16px; } .login-panel h2 { font-size: 18px; } .login-panel p { margin-bottom: 12px; } }
        @media (prefers-reduced-motion: reduce) {
          .room-walker,.room-person,.room-light,.room-flame,.room-snow,.house-light,.fire-tongue,
          .candle-flame,.hearth-glow,.candle-halo {animation:none!important;}
        }
      `}} />
    </div>
  );
}

// ================= Components =================

const DEMO_CROWD_SIZE = 80;

function buildDemoCrowdProfiles(members, profiles) {
  const joined=Date.now();
  return Object.fromEntries(Array.from({length:DEMO_CROWD_SIZE},(_,index)=>{
    const staffName=members[index]?.name;
    const name=staffName||`테스트${String(index+1).padStart(2,'0')}`;
    return [`demo-${index+1}`,{_hasMinime:true,_memberId:`demo-${index+1}`,nickname:name,avatar:profiles?.[name]?.avatar||AVATAR_OPTIONS[index%AVATAR_OPTIONS.length].id,roomEnteredAt:joined}];
  }));
}

function AdminView({ onSetup, isRevealed, onToggleReveal, onBack, config, profiles, members, onUpdateMembers, onResetPin, onResetMinime, onResetAllMinimes, onResetAllPins, onUndoGift }) {
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [showSingleAdd, setShowSingleAdd] = useState(false);
  const [singleName, setSingleName] = useState('');
  const [singleDept, setSingleDept] = useState('');
  const [editId, setEditId] = useState(null);
  const [bulkReset,setBulkReset]=useState(null);
  const [resetText,setResetText]=useState('');
  const [resetBusy,setResetBusy]=useState(false);
  const resetPhrase=bulkReset==='pins'?'전체비밀번호초기화':'전체미니미초기화';
  const beginBulkReset=kind=>{setResetText('');setBulkReset(kind);};
  const confirmBulkReset=async()=>{
    if(!bulkReset||resetBusy||resetText.trim()!==resetPhrase)return;
    setResetBusy(true);
    try {
      const reset=bulkReset==='pins'?onResetAllPins:onResetAllMinimes;
      if(await reset())setBulkReset(null);
    } finally {setResetBusy(false);}
  };
  const [crowdTest, setCrowdTest] = useState(false);
  const [motionPreviewOpen,setMotionPreviewOpen]=useState(false);
  const [demoCrowdProfiles,setDemoCrowdProfiles] = useState({});
  
  const allUsers = config?.pairs ? Object.keys(config.pairs) : [];
  const submittedUsers = allUsers.filter(u => profiles?.[u]?.giftSubmitted);
  const pendingUsers = allUsers.filter(u => !profiles?.[u]?.giftSubmitted);

  // 그룹화
  const groupedMembers = members.reduce((acc, m) => {
    const dept = m.department || '미분류';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(m);
    return acc;
  }, Object.create(null));

  const handleBulkAdd = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const newMembers = lines.map(line => {
      const parts = line.split(/\s+/);
      const name = parts.pop();
      const department = parts.join(' ') || '미분류';
      return { id: makeId(), name, department };
    });
    if (!newMembers.length) return;
    if (!await onUpdateMembers([...members, ...newMembers])) return;
    setShowBulkAdd(false);
    setBulkText('');
  };

  const handleSingleSave = async () => {
    if (!singleName.trim()) return;
    if (editId) {
      const updated = members.map(m => m.id === editId ? { ...m, name: singleName.trim(), department: singleDept.trim() || '미분류' } : m);
      if (!await onUpdateMembers(updated)) return;
      setEditId(null);
    } else {
      if (!await onUpdateMembers([...members, { id: makeId(), name: singleName.trim(), department: singleDept || '미분류' }])) return;
    }
    setSingleName('');
    setSingleDept('');
    setShowSingleAdd(false);
  };

  const startEdit = (m) => {
    setEditId(m.id);
    setSingleName(m.name);
    setSingleDept(m.department);
    setShowSingleAdd(false);
    setShowBulkAdd(false);
  };

  const removeMember = async (id) => {
    if (!window.confirm('이 구성원을 삭제할까요?')) return;
    if (await onUpdateMembers(members.filter(m => m.id !== id)) && editId === id) {
      setEditId(null);
      setSingleName('');
      setSingleDept('');
      setShowSingleAdd(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-y-auto custom-scrollbar pr-1 pb-4 bg-[#f8fcf9] -m-2 sm:-m-4 p-2 sm:p-4">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#f8fcf9] pt-2 pb-2 z-10 border-b border-green-100">
        <h2 className="text-lg font-bold text-green-800 flex items-center">
          <Users className="mr-2" size={20} /> 구성원 관리
        </h2>
        <button 
          onClick={onBack}
          className="text-xs bg-white px-3 py-1.5 rounded text-slate-600 border border-slate-300 hover:bg-slate-50 font-bold shadow-sm"
        >
          뒤로가기
        </button>
      </div>


      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3 flex flex-wrap gap-2 items-center justify-between">
        <div><strong className="text-sm text-blue-800">🧪 {DEMO_CROWD_SIZE}명 미니룸 동작 테스트</strong><p className="text-[11px] text-blue-600">구성원 이름으로 미니룸 화면 테스트</p></div>
        <button type="button" onClick={()=>{setDemoCrowdProfiles(buildDemoCrowdProfiles(members,profiles));setCrowdTest(true);}} className="bg-blue-600 text-white font-bold rounded px-4 py-2.5 text-sm">{DEMO_CROWD_SIZE}명 테스트 시작</button>
      </div>
      {crowdTest&&<section className="mb-4 rounded border border-blue-200 bg-white p-2" aria-label={`${DEMO_CROWD_SIZE}명 미니룸 테스트`}>
        <div className="bg-white max-w-6xl w-full mx-auto rounded p-3 flex flex-col min-h-0 max-h-full overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between gap-3 pb-2"><div><strong className="text-sm text-blue-800">🧪 테스트 미니미 {Object.keys(demoCrowdProfiles).length}명</strong><p className="text-[11px] text-slate-500">이름은 미니미를 누르면 보여요.</p></div><button onClick={()=>{setMotionPreviewOpen(false);setCrowdTest(false);setDemoCrowdProfiles({});}} className="bg-slate-800 text-white rounded px-4 py-2 text-sm font-bold shrink-0">테스트 종료 ✕</button></div>
          <details onToggle={event=>setMotionPreviewOpen(event.currentTarget.open)} className="mb-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 shrink-0">
            <summary className="cursor-pointer text-sm font-bold text-amber-950">4프레임 동작 크게 보기</summary>
            {motionPreviewOpen&&<MinimeMotionPreview />}
          </details>
          <ChristmasMiniroom profiles={demoCrowdProfiles} myName="" myMemberId="" onEdit={()=>{}} treePosts={[]} onTreeSave={()=>{}} onTreeDelete={()=>{}} demoMode />
        </div>
      </section>}

      {/* 액션 버튼 */}
      <div className="space-y-2 mb-4 shrink-0">
        <button 
          onClick={() => { setEditId(null); setSingleName(''); setSingleDept(''); setShowSingleAdd(true); setShowBulkAdd(false); }}
          className="w-full py-2.5 border border-green-200 text-green-700 bg-green-50 font-bold text-sm rounded flex justify-center items-center hover:bg-green-100 transition shadow-sm"
        >
          <Plus size={16} className="mr-1" /> 구성원 개별 추가
        </button>
        <button 
          onClick={() => { setShowBulkAdd(!showBulkAdd); setShowSingleAdd(false); }}
          className="w-full py-2.5 border border-green-200 text-green-700 bg-green-50 font-bold text-sm rounded flex justify-center items-center hover:bg-green-100 transition shadow-sm"
        >
          텍스트로 일괄 등록 (여러 명)
        </button>
      </div>

      <section className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded" aria-label="전체 초기화 관리자 전용">
        <p className="text-sm font-extrabold text-amber-900 mb-1">⚠️ 전체 초기화 · 방장 전용</p>
        <p className="text-xs text-amber-800 mb-3">초기화 전 입력 확인이 필요합니다. 마니또 배정과 선물 준비 현황은 유지됩니다.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" onClick={()=>beginBulkReset('minimes')} className="rounded border border-orange-400 bg-white text-orange-800 font-bold px-3 py-3 text-sm hover:bg-orange-100">🎨 전체 미니미 초기화</button>
          <button type="button" onClick={()=>beginBulkReset('pins')} className="rounded border border-red-400 bg-white text-red-700 font-bold px-3 py-3 text-sm hover:bg-red-100">🔑 전체 비밀번호 초기화</button>
        </div>
        <p className="text-[11px] text-amber-900 mt-2">전체 비밀번호 초기화 시 모든 직원이 '처음 등록'을 통해 4자리 번호를 다시 설정해야 합니다.</p>
      </section>

      {bulkReset&&<div className="fixed inset-0 z-[70] bg-black/60 grid place-items-center p-4">
        <form className="w-full max-w-sm rounded bg-white p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-reset-heading"
          onSubmit={event=>{event.preventDefault();confirmBulkReset();}}>
          <h3 id="bulk-reset-heading" className="font-bold text-red-800">{bulkReset==='pins'?'전체 비밀번호 초기화':'전체 미니미 초기화'}</h3>
          <p className="my-2 text-sm text-slate-700">{bulkReset==='pins'
            ? `${members.length}명의 기존 로그인 연결이 해제됩니다. 각자 ‘처음 등록’에서 번호를 다시 정해야 합니다.`
            : `${members.length}명의 미니미와 별명이 지워집니다. 기존 번호로 입장하면 캐릭터와 별명을 다시 고릅니다.`}</p>
          <label className="block text-sm">확인 문구 <strong>{resetPhrase}</strong>
            <input autoFocus autoComplete="off" value={resetText} onChange={event=>setResetText(event.target.value)}
              className="my-2 block w-full border border-slate-300 rounded p-2" disabled={resetBusy}/>
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>setBulkReset(null)} disabled={resetBusy} className="border rounded px-3 py-2">취소</button>
            <button type="submit" disabled={resetText.trim()!==resetPhrase||resetBusy}
              className="rounded bg-red-700 text-white px-3 py-2 disabled:opacity-40">{resetBusy?'처리 중…':'초기화 실행'}</button>
          </div>
        </form>
      </div>}

      {/* 입력 폼 영역 */}
      {showBulkAdd && (
        <div className="border border-green-300 p-3 bg-white mb-4 rounded shadow-sm shrink-0 animate-in fade-in">
          <p className="text-xs text-slate-500 mb-2">한 줄에 한 명씩 <b>"부서명 이름"</b> 형태로 띄어쓰기하여 입력해주세요.<br/>(예: 기획홍보팀 홍길동)</p>
          <textarea 
            className="w-full border border-slate-300 p-2 text-sm min-h-[100px] outline-none focus:border-green-500 rounded"
            placeholder="사무국 이득규&#10;사무국 장은희&#10;소통협력지원과 박유진"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <div className="flex space-x-2 mt-2">
            <button onClick={() => setShowBulkAdd(false)} className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-sm font-bold rounded border border-slate-300">취소</button>
            <button onClick={handleBulkAdd} className="flex-1 py-1.5 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700">일괄 추가</button>
          </div>
        </div>
      )}

      {showSingleAdd && !editId && (
        <div className="border border-green-300 p-3 bg-white mb-4 rounded shadow-sm shrink-0 flex flex-col space-y-2 animate-in fade-in">
          <input 
            type="text" placeholder="부서 (예: 사무국)" className="border border-slate-300 p-2 text-sm rounded outline-none focus:border-green-500"
            value={singleDept} onChange={e => setSingleDept(e.target.value)}
          />
          <input 
            type="text" placeholder="이름 (예: 홍길동)" className="border border-slate-300 p-2 text-sm rounded outline-none focus:border-green-500"
            value={singleName} onChange={e => setSingleName(e.target.value)}
          />
          <div className="flex space-x-2">
            <button onClick={() => setShowSingleAdd(false)} className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-sm font-bold rounded border border-slate-300">취소</button>
            <button onClick={handleSingleSave} className="flex-1 py-1.5 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700">{editId ? '수정 완료' : '추가'}</button>
          </div>
        </div>
      )}

      {/* 요약 */}
      <div className="bg-green-50 border border-green-200 rounded p-3 flex justify-between items-center mb-4 shrink-0 shadow-sm">
        <span className="font-bold text-slate-700 text-sm">전체 구성원</span>
        <span className="font-extrabold text-green-700 text-lg">{members.length}명</span>
      </div>

      {/* 리스트 렌더링 */}
      <div className="flex-1 overflow-visible">
        {Object.entries(groupedMembers).map(([dept, deptMembers]) => (
          <div key={dept} className="mb-4">
            <h3 className="font-bold text-green-700 text-sm mb-2 px-1">{dept} {deptMembers.length}명</h3>
            <div className="space-y-2">
              {deptMembers.map(m => (
                <div key={m.id} className={`bg-white border rounded p-3 shadow-sm ${editId===m.id?'border-green-500 ring-1 ring-green-200':'border-slate-200'}`}>
                <div className="flex justify-between items-center gap-2">
                  <div>
                    <div className="font-extrabold text-slate-800 text-sm">{m.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{m.department}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1 max-w-[72%]">
                    <button onClick={() => onResetMinime(m.id)} className="px-2 py-1 text-xs border border-slate-200 rounded text-orange-600 hover:bg-orange-50">미니미 초기화</button>
                    <button onClick={() => onResetPin(m.id)} className="px-2 py-1 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50">번호 초기화</button>
                    <button onClick={() => startEdit(m)} className="px-2 py-1 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50 flex items-center"><Edit2 size={12} className="mr-1"/> 수정</button>
                    <button onClick={() => removeMember(m.id)} className="px-2 py-1 text-xs border border-slate-200 rounded text-red-500 hover:bg-red-50 flex items-center"><Trash2 size={12} className="mr-1"/> 삭제</button>
                  </div>
                </div>
                {editId===m.id && (
                  <form className="mt-3 p-3 bg-green-50 border border-green-200 rounded space-y-2" onSubmit={event=>{event.preventDefault();handleSingleSave();}}>
                    <p className="text-xs font-bold text-green-800">{m.name}님 정보 수정</p>
                    <label className="block text-xs text-slate-600">소속 부서<input aria-label="소속 부서" className="block w-full mt-1 p-2 border border-slate-300 rounded bg-white text-sm" value={singleDept} onChange={event=>setSingleDept(event.target.value)}/></label>
                    <label className="block text-xs text-slate-600">이름<input aria-label="구성원 이름" className="block w-full mt-1 p-2 border border-slate-300 rounded bg-white text-sm" value={singleName} onChange={event=>setSingleName(event.target.value)} autoFocus/></label>
                    <div className="flex gap-2"><button type="button" className="flex-1 border border-slate-300 rounded bg-white py-2 text-sm" onClick={()=>{setEditId(null);setSingleName('');setSingleDept('');}}>취소</button><button type="submit" className="flex-1 rounded bg-green-600 text-white py-2 font-bold text-sm">수정 저장</button></div>
                    <p className="text-[11px] text-orange-700">※ 이름 변경 시 기존 마니또 배정이 초기화될 수 있으니 저장 전 확인해주세요.</p>
                  </form>
                )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="text-center text-slate-400 py-8 text-sm">등록된 구성원이 없습니다.</div>
        )}
      </div>

      {/* 마니또 뽑기 버튼 */}
      <div className="mt-4 pt-4 border-t border-dashed border-slate-300 shrink-0">
        <button 
          onClick={onSetup}
          disabled={members.length < 2}
          className={`w-full font-bold py-3 text-sm rounded shadow-md transition ${members.length < 2 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 border border-orange-700'}`}
        >
          마니또 랜덤 뽑기 실행 ({members.length}명)
        </button>
      </div>

      {/* 현황 및 공개 */}
      {allUsers.length > 0 && (
        <div className="mt-6 border border-solid border-green-300 p-4 bg-white rounded shadow-sm text-left shrink-0">
          <h2 className="text-md font-bold text-green-800 mb-2 border-b pb-2">🎁 23일 선물 준비 현황</h2>
          <div className="mb-3">
            <span className="text-xs font-bold text-slate-700">미제출자 ({pendingUsers.length}명):</span>
            <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded border border-red-100">
              {pendingUsers.length > 0 ? pendingUsers.join(', ') : '모두 제출 완료!'}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-700">제출 완료자 ({submittedUsers.length}명):</span>
            <div className="text-xs text-green-700 mt-1 bg-green-50 p-2 rounded border border-green-100 flex flex-wrap gap-2">
              {submittedUsers.length > 0 ? submittedUsers.map(name=><span key={name} className="inline-flex items-center gap-1 bg-white border border-green-200 rounded px-2 py-1"><span>{name}</span><button type="button" onClick={()=>onUndoGift(name)} aria-label={`${name} 완료표시 삭제`} className="text-[10px] text-red-500 border-l border-green-100 pl-1.5 hover:text-red-700">삭제</button></span>) : '아직 없습니다.'}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 border border-dashed border-red-300 p-4 bg-red-50 rounded shrink-0 shadow-sm">
        <h2 className="text-md font-bold text-red-700 mb-2">크리스마스 이브 특별 기능 🎄</h2>
        <p className="text-red-500 text-xs mb-4">
          24일이 되면 아래 버튼을 눌러 모든 사람의 마니또를 공개하세요!
        </p>
        <button 
          onClick={onToggleReveal}
          className={`w-full font-bold py-2 rounded transition text-sm shadow-sm ${isRevealed ? 'bg-slate-500 text-white border border-slate-600' : 'bg-red-600 text-white hover:bg-red-700 border border-red-800'}`}
        >
          {isRevealed ? '공개 중지 (다시 숨기기)' : '마니또 정체 일괄 공개하기 📢'}
        </button>
      </div>
    </div>
  );
}

function SpriteDefinitions() {
  return <svg width="0" height="0" className="sprite-definitions" aria-hidden="true"><defs>{AVATAR_ATLASES.map((atlas,index)=><g key={index}><image id={`avatar-atlas-${index}`} href={atlas.url} width={atlas.width} height={atlas.height}/>{atlas.cells.map((cell,cellIndex)=><clipPath key={cellIndex} id={`avatar-clip-${index}-${cellIndex}`} clipPathUnits="userSpaceOnUse"><rect x={cell.x} y={cell.y} width={cell.w} height={cell.h}/></clipPath>)}</g>)}</defs></svg>;
}
function MinimeMotionSheet({ avatar, action, size, elapsed }) {
  const row=AVATARS.indexOf(resolveAvatar(avatar));
  const cell=(action==='sit'?4:0)+poseFrame(action,elapsed);
  return <svg width={size} height={size} viewBox={`${cell*96} ${row*96} 96 96`}
    className="motion-sheet" aria-hidden="true">
    <image href={minimePoseAtlas} width="768" height="2880"/>
  </svg>;
}

function MinimeMotionPreview() {
  const [avatar,setAvatar]=useState('mini-12');
  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{
    const start=performance.now();
    const timer=setInterval(()=>{
      if(!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        setElapsed((performance.now()-start)/1000);
      }
    },45);
    return()=>clearInterval(timer);
  },[]);
  return <div className="pt-2">
    <label className="flex items-center gap-2 text-xs">
      미니미
      <select value={avatar} onChange={event=>setAvatar(event.target.value)} className="rounded border border-amber-200 bg-white px-2 py-1">
        {AVATAR_OPTIONS.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
    <div className="mt-2 grid grid-cols-2 gap-2">{[['walk','걷기'],['sit','앉아서 인사']].map(([action,label])=>
      <div key={action} className="flex flex-col items-center rounded bg-white py-1">
        <MinimeMotionSheet avatar={avatar} action={action} size={88} elapsed={action==='sit'?elapsed%6:elapsed}/>
        <span className="text-[11px] text-slate-600">{label}</span>
      </div>
    )}</div>
  </div>;
}

function PixelCharacter({avatar='mini-01',className='',width,height}) {
  const id=resolveAvatar(avatar),index=AVATARS.indexOf(id),atlas=AVATAR_ATLASES[Math.floor(index/15)],cell=atlas.cells[index%15];
  return <svg width={width} height={height} viewBox={`${cell.x} ${cell.y} ${cell.w} ${cell.h}`} preserveAspectRatio="xMidYMax meet" className={`pixel-character ${className}`} shapeRendering="crispEdges" data-avatar={id} aria-hidden="true"><use href={`#avatar-atlas-${Math.floor(index/15)}`} clipPath={`url(#avatar-clip-${Math.floor(index/15)}-${index%15})`}/></svg>;
}
function ProfileSetupView({onSetup,initialProfile,onCancel}) {
  const [nickname,setNickname]=useState(initialProfile?.nickname||'');
  const [avatar,setAvatar]=useState(resolveAvatar(initialProfile?.avatar));
  const [busy,setBusy]=useState(false);
  const save=async()=>{if(busy)return;setBusy(true);try{await onSetup(nickname,avatar);}finally{setBusy(false);}};
  return <div className="h-full flex flex-col items-center p-2 relative overflow-y-auto custom-scrollbar">
    <div className="border-2 border-dashed border-slate-300 bg-white p-4 sm:p-6 w-full text-center max-w-sm my-auto shrink-0">
      <h2 className="text-lg font-bold text-slate-800 mb-2">{initialProfile?'내 미니미 바꾸기':'미니미 만들기'}</h2>
      <p className="text-slate-500 text-[11px] mb-3">울장복 미니룸에서 함께할 사람 미니미를 골라주세요!</p>
      <div className="mb-3">
        <PixelCharacter avatar={avatar} className="avatar-preview mx-auto mb-1"/>
        <p className="text-[10px] text-slate-500 mb-2">{AVATAR_OPTIONS.find(a=>a.id===avatar)?.label}</p>
        <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="사람 미니미 30종">
          {AVATAR_OPTIONS.map(option=><button key={option.id} type="button" aria-label={option.label} aria-pressed={avatar===option.id} onClick={()=>setAvatar(option.id)} className={`avatar-option p-1 border-2 rounded flex justify-center ${avatar===option.id?'border-orange-500 bg-orange-50':'border-transparent bg-slate-100'}`}><PixelCharacter avatar={option.id}/></button>)}
        </div>
      </div>
      <label htmlFor="minime-nickname" className="mb-1 block text-left text-sm font-bold text-slate-800">마니또 활동용 별명</label>
      <p id="minime-nickname-hint" className="mb-2 rounded border border-orange-300 bg-orange-50 px-3 py-2 text-left text-sm leading-relaxed text-orange-900">
        <strong>본명을 쓰면 마니또 정체가 드러날 수 있어요!</strong><br/>
        꼭 마니또 활동에 사용할 별명을 입력해 주세요.
      </p>
      <input id="minime-nickname" aria-describedby="minime-nickname-hint" type="text" maxLength={30} className="w-full bg-slate-50 border border-slate-300 text-center text-sm p-2 mb-3 outline-none focus:border-blue-500" placeholder="예: 루돌프코, 눈꽃요정" value={nickname} onChange={e=>setNickname(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.nativeEvent.isComposing&&save()}/>
      <button onClick={save} disabled={busy} className="w-full bg-orange-500 text-white font-bold text-sm py-2 border border-orange-700 hover:bg-orange-600 transition">{busy?'저장 중…':initialProfile?'미니미 저장':'미니룸 입장'}</button>
      {onCancel&&<button onClick={onCancel} className="text-xs text-slate-500 mt-3 px-4 py-1">취소</button>}
    </div>
  </div>;
}
function PresentationView({profiles,treePosts,roundId,hasDraw,revealed,pairs,onToggleReveal,activeTab}) {
  const [showResults,setShowResults]=useState(false);
  useEffect(()=>setShowResults(false),[activeTab]);
  const tab=showResults&&revealed?'results':activeTab;
  const [revealBusy,setRevealBusy]=useState(false);
  const reveal=async()=>{
    setRevealBusy(true);
    try {
      if(await onToggleReveal())setShowResults(!revealed);
    } finally {setRevealBusy(false);}
  };
  return <section data-fit-room={tab==='home'?'true':undefined} className="min-w-0 space-y-3" aria-label="방장 관람 화면">
    <div className="flex flex-wrap justify-end gap-2">
      {revealed&&<button type="button" onClick={()=>setShowResults(value=>!value)} className="rounded border bg-white px-3 py-2 text-sm">
        {showResults?'돌아가기':'배정표 보기'}
      </button>}
      <button type="button" disabled={!hasDraw||revealBusy} onClick={reveal}
        className="rounded bg-red-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
        {revealed?'공개 중지':'마니또 공개하기'}
      </button>
    </div>
    <div className="presentation-body w-full">
      {tab==='home'&&<ChristmasMiniroom profiles={profiles} treePosts={treePosts} demoMode/>}
      {tab==='photos'&&<PresentationFeed key="photos" kind="photos" roundId={roundId} profiles={profiles}/>}
      {tab==='results'&&revealed&&<div className="rounded-xl border bg-white p-5">
        <h3 className="mb-4 text-center text-2xl font-bold">마니또 배정표</h3>
        <ul aria-label="왼쪽 사람은 오른쪽 사람의 마니또" className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {Object.entries(pairs||{}).sort(([a],[b])=>a.localeCompare(b,'ko')).map(([giver,recipient])=>
            <li key={giver} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded bg-slate-100 p-3 text-center text-lg">
              <span>{giver}</span><span aria-label="가 챙긴 사람">→</span><strong>{recipient}</strong>
            </li>)}
        </ul>
      </div>}
      {tab==='guestbook'&&<PresentationFeed key={roundId} kind="guestbook" roundId={roundId} profiles={profiles}/>}
    </div>
  </section>;
}

function PresentationFeed({kind,roundId,profiles}) {
  const [posts,setPosts]=useState([]);
  const [cursor,setCursor]=useState(null);
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const isPhoto=kind==='photos';
  const pageSize=30;
  const feed=()=>isPhoto?photosCollection():eventsCollection(roundId);
  const orderedField=isPhoto?'createdAt':'timestamp';
  const readPosts=snapshot=>snapshot.docs.map(item=>{
    const data=item.data({serverTimestamps:'estimate'});
    return {...data,id:item.id,[orderedField]:data[orderedField]?.toMillis?.()||0};
  });
  const latest=useRef([]);
  const loadedOlder=useRef(false);
  useEffect(()=>{
    if(!isPhoto&&!roundId){setReady(true);return;}
    return onSnapshot(query(feed(),orderBy(orderedField,'desc'),limit(pageSize)),snapshot=>{
      const fresh=readPosts(snapshot);
      const previous=latest.current;
      latest.current=fresh;
      setPosts(items=>{
        if(!loadedOlder.current)return fresh;
        const merged=new Map(items.map(post=>[post.id,post]));
        for(const post of [...previous,...fresh])merged.set(post.id,post);
        if(fresh.length<pageSize)for(const change of snapshot.docChanges())if(change.type==='removed')merged.delete(change.doc.id);
        return [...merged.values()].sort((a,b)=>b[orderedField]-a[orderedField]);
      });
      if(!loadedOlder.current)setCursor(snapshot.size===pageSize?snapshot.docs.at(-1):null);
      setReady(true);
    },()=>{setError('글을 불러오지 못했어요. 탭을 다시 열어주세요.');setReady(true);});
  },[kind,roundId]);
  const loadOlder=async()=>{
    if(!cursor||busy)return;
    loadedOlder.current=true;
    setBusy(true);setError('');
    try{
      const snapshot=await getDocsFromServer(query(feed(),orderBy(orderedField,'desc'),startAfter(cursor),limit(pageSize)));
      setPosts(items=>[...new Map([...items,...readPosts(snapshot)].map(post=>[post.id,post])).values()]);
      setCursor(snapshot.size===pageSize?snapshot.docs.at(-1):null);
    }catch{setError('이전 글을 불러오지 못했어요. 다시 눌러주세요.');}
    finally{setBusy(false);}
  };
  return <>
    {error&&<p role="alert" className="py-2 text-sm text-red-700">{error}</p>}
    {isPhoto?<PhotoChatView readOnly posts={posts} ready={ready} profiles={profiles}/>:
      ready?<GuestbookView events={posts.filter(post=>post.type==='message')} profiles={profiles} isRevealed={false}/>:
        <p role="status">방명록을 불러오는 중…</p>}
    {cursor&&<button type="button" onClick={loadOlder} disabled={busy} className="w-full rounded border bg-white py-2 text-sm text-blue-700">
      {busy?'불러오는 중…':'이전 글 더 보기'}
    </button>}
  </>;
}

function ChristmasMiniroom({profiles,myName,myMemberId,onEdit,treePosts,onTreeSave,onTreeDelete,demoMode=false}) {
  const [selected,setSelected]=useState(null),[expanded,setExpanded]=useState(false),[treeOpen,setTreeOpen]=useState(false),[selectedNote,setSelectedNote]=useState(null);
  const [systemReducedMotion,setSystemReducedMotion]=useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false);
  const [playMotion,setPlayMotion]=useState(false);
  const reducedMotion=systemReducedMotion&&!playMotion;
  const scroller=useRef(null),scene=useRef(null),crowd=useRef(null),crowdCanvas=useRef(null);
  const [roomNow,setRoomNow]=useState(Date.now);
  const people=Object.entries(profiles||{}).filter(([,p])=>p._hasMinime===true&&isRoomVisible(p,roomNow)).map(([name,p])=>({...p,name,id:p._memberId||name})).sort((a,b)=>a.id.localeCompare(b.id));
  const appearance=getCrowdAppearance(people.length);
  const canvasMode=people.length>0;
  const crowdSignature=people.map(person=>`${person.id}:${person.avatar}`).join('|');
  useEffect(()=>{const refresh=()=>setRoomNow(Date.now()),timer=setInterval(refresh,10000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[]);
  const notes=[...treePosts].sort((a,b)=>a.memberId.localeCompare(b.memberId));
  useEffect(()=>{const el=scroller.current;if(el)el.scrollLeft=(el.scrollWidth-el.clientWidth)/2;},[expanded]);
  useEffect(()=>{const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!query)return;const changed=()=>setSystemReducedMotion(query.matches);query.addEventListener?.('change',changed);return()=>query.removeEventListener?.('change',changed);},[]);
  useEffect(()=>{
    const svg=scene.current,stage=svg?.querySelector('.house-depth-stage');if(!stage)return;
    const residents=Array.from(stage.querySelectorAll('.room-resident')),ids=residents.map(node=>node.dataset.memberId);
    const signature=[...ids].sort().join('|');
    if(!crowd.current||crowd.current.signature!==signature){crowd.current=createCrowd(ids);crowd.current.signature=signature;}
    const world=crowd.current,byId=new Map(world.agents.map(person=>[person.id,person]));
    const context=crowdCanvas.current?.getContext('2d');
    const atlas=context?new Image():null,tree=context?new Image():null;
    if(atlas){atlas.src=minimePoseAtlas;tree.src=BARE_TREE;}
    const sprites=new Map(people.map(person=>[person.id,AVATARS.indexOf(resolveAvatar(person.avatar))]));
    const mobile=window.matchMedia('(max-width: 639px)');
    const drawSprite=person=>{
      const offset=(person.action==='sit'?4:0)+(reducedMotion?0:poseFrame(person.action,world.time-person.actionStarted,person.tempo));
      const width=44*appearance.scale*(mobile.matches?1.16:1),height=width*650/800;
      // Walking sprites face left in the source atlas.
      const mirror=person.action==='walk'&&person.facing===1;
      if(mirror){
        context.save();
        context.translate(person.x*2,0);
        context.scale(-1,1);
      }
      context.drawImage(atlas,offset*96,sprites.get(person.id)*96,96,96,
        person.x-width/2,person.y-height*41/44,width,height);
      if(mirror)context.restore();
    };
    let frame,last=performance.now(),painted=-Infinity;
    const interval=ids.length>=55?65:ids.length>=35?50:40;
    const draw=now=>{
      if(document.hidden){last=now;frame=requestAnimationFrame(draw);return;}
      if(now-painted>=interval){
        stepCrowd(world,Math.min(.1,(now-last)/1000));
        last=now;painted=now;svg.dataset.motionTime=String(world.time);
        if(context&&atlas.naturalWidth){
          context.clearRect(0,0,1000,650);
          const ordered=[...world.agents].sort((a,b)=>a.y-b.y);
          for(const person of ordered)if(person.y<482)drawSprite(person);
          context.globalCompositeOperation='destination-out';
          if(tree.naturalWidth)context.drawImage(tree,355,240,290,250);
          context.globalCompositeOperation='source-over';
          for(const person of ordered)if(person.y>=482)drawSprite(person);
        }
        residents.forEach(node=>{
          const person=byId.get(node.dataset.memberId);if(!person)return;
          node.setAttribute('transform',`translate(${person.x.toFixed(2)} ${person.y.toFixed(2)})`);
          const action=person.action;
          if(node.dataset.action!==action){node.dataset.action=action;node.querySelector('.resident-status').textContent=ACTION_LABELS[action];}
        });

      }
      frame=requestAnimationFrame(draw);
    };
    draw(performance.now());return()=>cancelAnimationFrame(frame);
  },[crowdSignature,reducedMotion,canvasMode]);
  const ornamentPoint=index=>{
    let row=0,slot=index;while(slot>=row+2){slot-=row+2;row++;}
    const rows=Math.max(11,Math.ceil((-3+Math.sqrt(9+8*notes.length))/2)),span=12+row*88/(rows-1);
    return {x:500-span+slot*span*2/(row+1),y:289+row*149/(rows-1)};
  };
  return <section className={`christmas-room ${expanded?'room-expanded':'room-fit'} border border-slate-300 rounded relative shrink-0 overflow-hidden shadow-inner`} aria-label="울장복 미니룸">
    <div className="room-toolbar"><strong>울장복 미니룸</strong><span className="room-count" aria-label={`방에 있는 미니미 ${people.length}명`}>함께하는 미니미 {people.length}명</span><button onClick={()=>setExpanded(!expanded)} className="room-edit">{expanded?'전체 보기':'확대 보기'}</button>{!demoMode&&<button onClick={onEdit} className="room-edit">내 미니미</button>}</div>
    <button onClick={()=>setTreeOpen(true)} disabled={demoMode} className="room-tree-button">🎄 큰 트리에 크리스마스 한마디 달기 · {notes.length}개의 장식</button>
    <div className="room-scroll custom-scrollbar" ref={scroller} tabIndex={0} aria-label="계단으로 연결된 크리스마스 나무집">
      <div className="room-stage">
        <svg ref={scene} viewBox="0 0 1000 650" className="room-scene connected-house" preserveAspectRatio="none" role="group" aria-label="1층과 2층을 계단으로 오가는 울장복 미니미들">
          <g className="room-background-layer" pointerEvents="none">
          <image href={ROOM_BACKGROUND} width="1000" height="650" preserveAspectRatio="none" pointerEvents="none"/>
          <defs><radialGradient id="fire-warm-glow"><stop stopColor="#ffbd58" stopOpacity=".55"/><stop offset="1" stopColor="#ffae42" stopOpacity="0"/></radialGradient></defs>
          <ellipse className="hearth-glow" cx="817" cy="425" rx="91" ry="64" fill="url(#fire-warm-glow)" pointerEvents="none"/>
          <g className="hearth-flames" transform="translate(818 438)" pointerEvents="none"><path className="fire-tongue" d="M-16 0Q-23-13-12-24Q-11-15-7-18Q-9-35 1-43Q-3-24 8-19Q9-28 13-30Q26-11 17 0Z" fill="#ff8d2588"/><path className="fire-tongue flame-inner" d="M-9 0Q-15-14-5-23Q-5-14 2-28Q6-19 8-15Q16-8 10 0Z" fill="#ffdf8799"/></g>
          {[[754,340],[765,345],[682,150],[361,152]].map(([x,y],index)=><g key={index} transform={`translate(${x} ${y})`} pointerEvents="none"><ellipse className="candle-halo" cy="-6" rx="13" ry="19" fill="url(#fire-warm-glow)" style={{animationDelay:`${index*.3}s`}}/><rect x="-1.5" y="-3" width="3" height="8" fill="#f2d9a2"/><path className="candle-flame" d="M0-12Q-4-6 0-4Q4-6 0-12" fill="#ffda78" style={{animationDelay:`${index*.3}s`}}/></g>)}
          {[[181,70],[287,39],[410,50],[602,51],[790,58],[860,100],[68,135],[931,161],[305,205],[400,216],[500,222],[600,216],[700,210],[805,199]].map(([x,y],index)=><circle key={index} className="house-light" cx={x} cy={y} r={2+index%2} fill="#ffe9a8" pointerEvents="none" style={{animationDelay:`${index*.4}s`}}/>)}
          {!reducedMotion&&Array.from({length:14},(_,index)=><circle key={index} cx={index%2?25+(index*13)%65:930+(index*7)%53} cy="-10" r={1.2+index%3*.4} fill="#ecf8ff" opacity=".8" pointerEvents="none"><animate attributeName="cy" from="-10" to="650" dur={`${13+index%8}s`} begin={`-${index*2}s`} repeatCount="indefinite"/></circle>)}
          </g>
          <g className="house-depth-stage">
          <g className="interactive-tree" data-ornament-count={notes.length}
            role={demoMode?undefined:'button'} tabIndex={demoMode?undefined:0}
            aria-label={demoMode?undefined:`트리에 장식과 한마디 달기. 현재 장식 ${notes.length}개`}
            aria-haspopup={demoMode?undefined:'dialog'} pointerEvents="none"
            onClick={demoMode?undefined:()=>setTreeOpen(true)}
            onKeyDown={demoMode?undefined:event=>{
              if(event.key==='Enter'||event.key===' '){event.preventDefault();setTreeOpen(true);}
            }}>
            <ellipse cx="500" cy="484" rx="126" ry="15" fill="#2d281c44"/>
            <image href={BARE_TREE} x="355" y="240" width="290" height="250" preserveAspectRatio="none"
              className="bare-tree-image" pointerEvents={demoMode?'none':'visiblePainted'}/>
            {notes.map((note,index)=>{const point=ornamentPoint(index);return <g key={note.memberId} className="tree-decoration" transform={`translate(${point.x} ${point.y})`} aria-hidden="true"><TreeOrnament kind={note.kind} color={note.color}/></g>;})}
          </g>
          {people.map(person=>{
            const mine=person.name===myName;
            const width=Math.min(138,Math.max(46,(person.nickname.length+(mine?3:0))*9));
            return <g key={person.id}><g className={`room-resident ${selected===person.id?'is-selected':''}`} data-member-id={person.id} data-stair-route="up-and-down" role="button" tabIndex={0} aria-label={`${person.nickname}의 미니미${mine?' (내 미니미)':''}`} aria-pressed={selected===person.id} onClick={()=>setSelected(selected===person.id?null:person.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(selected===person.id?null:person.id);}}}>
              <title className="resident-status">산책 중</title>
              <g className="resident-visual" transform={`scale(${appearance.scale} ${appearance.scale*650/800})`}>
              <rect x="-14" y="-37" width="28" height="39" fill="transparent" className="resident-hit"/>
              {mine&&<path d="M-3 4H3L0 7Z" fill="#5bac83" pointerEvents="none"/>}
              </g>
              <g className="resident-tag" transform={`translate(0 ${-48*appearance.scale*650/800})`} pointerEvents="none" aria-hidden="true"><rect x={-width/2} width={width} height="16" rx="3" fill="#463026ee" stroke="#fff0ce"/><text y="11.5" textAnchor="middle" fontSize="10" fill="#fff4da">{person.nickname}{mine?' · 나':''}</text></g>
            </g></g>;
          })}
          </g>
        </svg>
        {canvasMode&&<canvas ref={crowdCanvas} aria-hidden="true" width={1000} height={650} className="absolute inset-0 w-full h-full pointer-events-none"/>}
        {!demoMode&&notes.map((note,index)=>{const point=ornamentPoint(index);return <button key={note.memberId} type="button" className="tree-note-hit" aria-label={`${note.nickname}님의 트리 장식`} style={{left:`${point.x/10}%`,top:`${point.y/6.5}%`}} onClick={()=>setSelectedNote(note)}/>;})}
      </div>
    </div>
    {systemReducedMotion&&<button type="button" className="room-edit m-2" aria-pressed={playMotion}
      onClick={()=>setPlayMotion(value=>!value)}>{playMotion?'미니미 모션 끄기':'미니미 모션 켜기'}</button>}
    <div className="room-caption"><span>로그인 후 2시간 동안 함께해요</span><span>{expanded?'↔ 좌우로 밀어보세요':'걷고 쉬고, 인사하며 함께 지내요'}</span></div>
    {treeOpen&&<TreeBoard posts={treePosts} myMemberId={myMemberId} onSave={onTreeSave} onDelete={onTreeDelete} onClose={()=>setTreeOpen(false)}/>}
    {selectedNote&&<div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="트리 한마디 보기"><div className="w-full max-w-xs bg-[#fffaf0] border-2 border-[#b38d70] p-5 rounded"><h3 className="text-sm font-bold text-green-800 mb-3">🎄 {selectedNote.nickname}님의 크리스마스 한마디</h3><p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{selectedNote.message}</p><button onClick={()=>setSelectedNote(null)} className="w-full mt-4 text-xs border border-[#d7bda0] bg-white py-2">닫기</button></div></div>}
  </section>;
}

function LoginView({ onLogin, onGoAdmin }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [registering, setRegistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => { if (busy) return; setBusy(true); try { await onLogin(name, pin, confirmation, registering); } finally { setBusy(false); } };
  return (
    <div className="h-full flex flex-col items-center p-3 relative overflow-y-auto custom-scrollbar">
      <div className="login-panel border-2 border-dashed border-slate-300 bg-white p-8 w-full text-center max-w-sm my-auto shrink-0">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
          <Snowflake className="text-blue-500" size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">미니홈피 입장</h2>
        <p className="text-slate-500 text-xs mb-6">{registering ? '본인 이름으로 처음 사용할 4자리 번호를 정해주세요.' : '본인 이름과 등록한 4자리 번호를 입력해주세요.'}</p>
        
        <div className="flex mb-4 text-xs border border-slate-300">
          <button type="button" disabled={busy} onClick={() => { setRegistering(false); setConfirmation(''); }} className={`w-1/2 py-2 ${!registering ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500'}`}>로그인</button>
          <button type="button" disabled={busy} onClick={() => setRegistering(true)} className={`w-1/2 py-2 border-l border-slate-300 ${registering ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500'}`}>처음 등록</button>
        </div>
        <input
          type="text"
          className="w-full bg-slate-50 border border-slate-300 text-center text-sm p-2 mb-4 outline-none focus:border-blue-500"
          placeholder="이름 입력 (예: 홍길동)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && submit()}
        />
        
        <input type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete={registering ? 'new-password' : 'current-password'} aria-label="4자리 번호"
          className="w-full bg-slate-50 border border-slate-300 text-center text-sm p-2 mb-4 outline-none focus:border-blue-500"
          placeholder="숫자 4자리" value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0,4))} onKeyDown={e => e.key === 'Enter' && submit()} />
        {registering && <input type="password" inputMode="numeric" maxLength={4} autoComplete="new-password" aria-label="번호 다시 입력"
          className="w-full bg-slate-50 border border-slate-300 text-center text-sm p-2 mb-4 outline-none focus:border-blue-500"
          placeholder="번호 다시 입력" value={confirmation} onChange={e => setConfirmation(e.target.value.replace(/[^0-9]/g, '').slice(0,4))} onKeyDown={e => e.key === 'Enter' && submit()} />}
        <button
          disabled={busy}
          onClick={submit}
          className="w-full bg-blue-500 text-white font-bold text-sm py-2 border border-blue-700 hover:bg-blue-600 transition"
        >
          {busy ? '확인 중…' : registering ? '번호 등록하고 입장' : '입장하기'}
        </button>
        <p className="text-[10px] text-slate-400 mt-3">번호를 잊었으면 방장에게 초기화를 요청해주세요.</p>
      </div>
      
      <button 
        onClick={onGoAdmin}
        className="absolute bottom-4 right-4 text-[10px] text-slate-400 hover:text-slate-600 flex items-center"
      >
        <Settings size={10} className="mr-1" /> 방장
      </button>
    </div>
  );
}

const DRAW_SELECTION_ART = "data:image/webp;base64,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";

function DrawView({ target, targetDepartment, stage, onStart, onNext, profiles }) {
  const [chosen, setChosen] = useState(null);
  const targetNickname = profiles?.[target]?.nickname;
  const deptLabel = targetDepartment && targetDepartment !== '미분류' ? targetDepartment : '';

  const boxes = [
    {
      id: 0,
      label: 'No. 1',
      body: 'linear-gradient(155deg, #7c1828 0%, #4d0a15 100%)',
      lid: 'linear-gradient(155deg, #941f32 0%, #610e1c 100%)',
    },
    {
      id: 1,
      label: 'No. 2',
      body: 'linear-gradient(155deg, #174937 0%, #0b281d 100%)',
      lid: 'linear-gradient(155deg, #1f5f48 0%, #103527 100%)',
    },
    {
      id: 2,
      label: 'No. 3',
      body: 'linear-gradient(155deg, #1d3154 0%, #0e1a30 100%)',
      lid: 'linear-gradient(155deg, #27406e 0%, #142340 100%)',
    },
  ];

  const sparkles = [
    { tx: '-115px', ty: '-78px', s: 1.1, d: '0s', c: '#fff5cf' },
    { tx: '-88px', ty: '-118px', s: 0.9, d: '0.04s', c: '#e8c476' },
    { tx: '-38px', ty: '-132px', s: 1.2, d: '0.02s', c: '#fff8dc' },
    { tx: '28px', ty: '-130px', s: 1.0, d: '0.05s', c: '#f2d388' },
    { tx: '84px', ty: '-114px', s: 1.15, d: '0.01s', c: '#fff5cf' },
    { tx: '118px', ty: '-72px', s: 0.85, d: '0.06s', c: '#e5be6c' },
    { tx: '126px', ty: '-10px', s: 1.0, d: '0.03s', c: '#fff2be' },
    { tx: '104px', ty: '48px', s: 0.9, d: '0.07s', c: '#d9ae59' },
    { tx: '-124px', ty: '-12px', s: 1.0, d: '0.05s', c: '#f5d996' },
    { tx: '-102px', ty: '46px', s: 0.85, d: '0.02s', c: '#e5be6c' },
    { tx: '-56px', ty: '-66px', s: 0.75, d: '0.08s', c: '#ffffff' },
    { tx: '58px', ty: '-64px', s: 0.8, d: '0.04s', c: '#ffffff' },
    { tx: '0px', ty: '-148px', s: 1.25, d: '0.01s', c: '#fff8dc' },
    { tx: '-68px', ty: '86px', s: 0.75, d: '0.06s', c: '#f3d48b' },
    { tx: '66px', ty: '84px', s: 0.8, d: '0.03s', c: '#f3d48b' },
    { tx: '0px', ty: '96px', s: 0.7, d: '0.08s', c: '#fff5cf' },
  ];

  const choose = index => {
    if (stage !== 'idle' || chosen !== null) return;
    setChosen(index);
    onStart();
  };

  return (
    <div className="xmas-draw-wrap">
      <style>{`
        .xmas-selection { position:relative; width:min(100%,460px); margin:auto; }
        .xmas-selection img { display:block; width:100%; height:auto; }
        .xmas-selection button { position:absolute; top:45.5%; width:23%; height:25%; border:0; border-radius:8px; background:transparent; cursor:pointer; }
        .xmas-selection button:hover { background:#ffe2a614; }
        .xmas-selection button:focus-visible { outline:3px solid #ffdc8a; outline-offset:2px; }
        .xmas-draw-wrap {
          margin: auto;
          width: 100%;
          max-width: 680px;
          padding: 4px 0;
        }

        .xmas-draw-board {
          position: relative;
          overflow: hidden;
          padding: 30px 18px 28px;
          border-radius: 3px;
          border: 1.5px solid rgba(229, 193, 125, 0.90);
          background:
            radial-gradient(circle at 50% 12%, rgba(236, 198, 126, 0.18), transparent 48%),
            radial-gradient(circle at 50% 95%, #123327 0%, #091d16 60%, #05110d 100%);
          box-shadow:
            inset 0 0 0 6px rgba(229, 193, 125, 0.08),
            inset 0 0 36px rgba(0, 0, 0, 0.55),
            0 16px 36px rgba(5, 17, 13, 0.35);
          color: #fbf6ea;
          text-align: center;
        }

        /* 내부 얇은 골드 프레임 */
        .xmas-draw-board::before {
          content: "";
          position: absolute;
          inset: 9px;
          border-radius: 0;
          border: 1px solid rgba(229, 193, 125, 0.75);
          pointer-events: none;
        }

        /* 은은한 보케 빛망울 & 눈송이 */
        .xmas-bokeh {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(2.2px 2.2px at 14% 20%, rgba(255, 241, 200, 0.65), transparent),
            radial-gradient(3px 3px at 86% 16%, rgba(255, 241, 200, 0.5), transparent),
            radial-gradient(2px 2px at 78% 72%, rgba(255, 241, 200, 0.45), transparent),
            radial-gradient(2.4px 2.4px at 20% 78%, rgba(255, 241, 200, 0.5), transparent),
            radial-gradient(1.8px 1.8px at 52% 28%, rgba(255, 255, 255, 0.45), transparent),
            radial-gradient(2px 2px at 34% 12%, rgba(255, 245, 215, 0.55), transparent),
            radial-gradient(2px 2px at 68% 36%, rgba(255, 245, 215, 0.4), transparent);
          animation: xmas-twinkle 3.8s ease-in-out infinite alternate;
        }

        .xmas-snow-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .xmas-snow-dot {
          position: absolute;
          top: -8px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(255, 245, 220, 0.2));
          animation: xmas-snowfall linear infinite;
        }

        @keyframes xmas-twinkle {
          0% { opacity: 0.45; transform: translateY(0); }
          100% { opacity: 0.95; transform: translateY(-4px); }
        }

        @keyframes xmas-snowfall {
          0% { top:-3%; transform:translateX(0); opacity:0; }
          15% { opacity: 0.75; }
          85% { opacity: 0.65; }
          100% { top:103%; transform:translateX(18px); opacity:0; }
        }

        .xmas-snow-dot.flake {
          background:none; color:#f5f2e4; font-size:15px; line-height:1;
          text-shadow:0 0 8px #fff9;
        }
        .xmas-result-wrap::before {
          content:""; position:absolute; inset:-42px -22px;
          background:repeating-conic-gradient(from 8deg,#f5cd7766 0deg 1deg,transparent 1deg 13deg);
          mask-image:radial-gradient(ellipse,transparent 29%,#000 52%,transparent 74%);
          pointer-events:none; animation:xmas-rays .8s ease-out both;
        }
        @keyframes xmas-rays {from{opacity:0;transform:scale(.65)}to{opacity:1;transform:scale(1)}}
        .xmas-draw-content {
          position: relative;
          z-index: 2;
        }

        .xmas-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 13px;
          border-radius: 999px;
          border: 1px solid rgba(229, 193, 125, 0.45);
          background: rgba(229, 193, 125, 0.1);
          color: #edd092;
          font-size: 10.5px;
          letter-spacing: 0.16em;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .xmas-title {
          margin: 0 auto;
          max-width: 340px;
          font-size: 20px;
          line-height: 1.45;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #fdf9ef;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
          word-break: keep-all;
        }

        @media (min-width: 640px) {
          .xmas-title { font-size: 22px; max-width: 420px; }
        }

        .xmas-subtitle {
          margin: 8px 0 0;
          font-size: 12.5px;
          color: rgba(247, 239, 222, 0.74);
          word-break: keep-all;
        }

        /* 3개 선물상자 영역 */
        .xmas-boxes {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          max-width: 400px;
          margin: 34px auto 12px;
          align-items: end;
        }

        .xmas-box-btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding: 16px 4px 4px;
          border: 0;
          background: none;
          color: #edd092;
          outline: none;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
        }

        .xmas-box-btn:enabled {
          cursor: pointer;
        }

        .xmas-box-btn:focus-visible {
          outline: 2px solid #f5dca4;
          outline-offset: 4px;
          border-radius: 14px;
        }

        .xmas-box-btn:enabled:hover .xmas-gift,
        .xmas-box-btn:enabled:focus-visible .xmas-gift {
          transform: translateY(-9px) scale(1.05);
          filter: drop-shadow(0 14px 20px rgba(229, 193, 125, 0.25));
        }

        .xmas-box-btn.is-dim {
          opacity: 0.22;
          transform: scale(0.86);
          pointer-events: none;
        }

        .xmas-gift {
          display: block;
          position: relative;
          width: 84px;
          height: 82px;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), filter 0.3s ease;
        }

        @media (max-width: 400px) {
          .xmas-gift { width: 74px; height: 74px; }
        }

        .xmas-gift-shadow {
          position: absolute;
          left: 50%;
          bottom: -6px;
          width: 78%;
          height: 12px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(0, 0, 0, 0.65), transparent 72%);
        }

        .xmas-gift-lid {
          display: block;
          position: relative;
          z-index: 4;
          width: calc(100% + 8px);
          height: 22px;
          margin-left: -4px;
          border-radius: 6px;
          border: 1px solid rgba(242, 211, 136, 0.45);
          box-shadow:
            inset 0 2px 3px rgba(255, 255, 255, 0.18),
            0 6px 14px rgba(0, 0, 0, 0.42);
          transform-origin: 18% 100%;
        }

        .xmas-gift-lid::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          width: 14px;
          height: 100%;
          background: linear-gradient(90deg, #b98937 0%, #f7e1ab 50%, #b98937 100%);
        }

        .xmas-gift-bow {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          width: 44px;
          height: 22px;
          z-index: 5;
          transform-origin: 50% 75%;
        }

        .xmas-bow-loop {
          position: absolute;
          top: 1px;
          width: 19px;
          height: 14px;
          border: 2.8px solid #f2d388;
          border-radius: 65% 65% 12% 65%;
          background: linear-gradient(135deg, rgba(247, 225, 171, 0.42), rgba(185, 137, 55, 0.18));
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
          transform-origin: 85% 85%;
        }

        .xmas-bow-loop.left {
          left: 2px;
          transform: rotate(-16deg);
        }

        .xmas-bow-loop.right {
          right: 2px;
          transform: scaleX(-1) rotate(-16deg);
        }

        .xmas-bow-tail {
          position: absolute;
          top: 9px;
          width: 4px;
          height: 15px;
          border-radius: 2px;
          background: linear-gradient(180deg, #f7e1ab 0%, #c7953e 100%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
          transform-origin: 50% 0%;
        }

        .xmas-bow-tail.left {
          left: 14px;
          transform: rotate(22deg);
        }

        .xmas-bow-tail.right {
          right: 14px;
          transform: rotate(-22deg);
        }

        .xmas-gift-knot {
          position: absolute;
          left: 50%;
          top: 7px;
          transform: translateX(-50%);
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fff6d6, #c7953e);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
          z-index: 2;
        }

        .xmas-gift-body {
          display: block;
          position: relative;
          z-index: 2;
          width: 100%;
          height: 60px;
          margin-top: -2px;
          border-radius: 0 0 8px 8px;
          border: 1px solid rgba(242, 211, 136, 0.32);
          border-top: none;
          box-shadow:
            inset 0 -8px 16px rgba(0, 0, 0, 0.35),
            0 12px 22px rgba(0, 0, 0, 0.45);
          overflow: hidden;
        }

        /* 세로 금박 리본 & 풀리면서 흘러내리는 꼬리 */
        .xmas-ribbon-v {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          width: 14px;
          height: 100%;
          background: linear-gradient(90deg, #b98937 0%, #f7e1ab 50%, #b98937 100%);
          transform-origin: 50% 0%;
        }

        .xmas-ribbon-tail {
          position: absolute;
          top: 50%;
          width: 11px;
          height: 34px;
          background: linear-gradient(180deg, #f7e1ab 0%, #d4a448 65%, #9c6e23 100%);
          border-radius: 0 0 5px 5px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
          opacity: 0;
          z-index: 3;
          pointer-events: none;
          transform-origin: 50% 0%;
        }

        .xmas-ribbon-tail.left {
          left: calc(50% - 7px);
          transform: rotate(8deg) scaleY(0.1);
        }

        .xmas-ribbon-tail.right {
          left: calc(50% - 4px);
          transform: rotate(-8deg) scaleY(0.1);
        }

        /* 가로 금박 리본 */
        .xmas-gift-body::after {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 100%;
          height: 10px;
          background: linear-gradient(180deg, #b98937 0%, #f7e1ab 50%, #b98937 100%);
          opacity: 0.92;
          transform-origin: 50% 50%;
        }

        .xmas-box-label {
          margin-top: 12px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: rgba(237, 208, 146, 0.88);
        }

        /* 상자 열림 (리본 풀림 -> 뚜껑 팡!) 모션 - 1950ms 타임라인 */
        .xmas-box-glow {
          position: absolute;
          inset: -38px -28px 6px;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          z-index: 3;
          background: radial-gradient(circle, #fffbe2 0%, rgba(247, 216, 138, 0.68) 32%, transparent 70%);
        }

        .xmas-box-btn.is-opening {
          z-index: 6;
        }

        /* 0s~0.55s: 두근거림 흔들림 */
        .xmas-box-btn.is-opening .xmas-gift {
          animation: xmas-shake 0.56s ease-in-out both;
        }

        /* 0.52s~1.05s: 리본 매듭이 슥 풀리며 좌우 날개·꼬리가 펼쳐짐 */
        .xmas-box-btn.is-opening .xmas-bow-loop.left {
          animation: xmas-unloop-left 0.52s 0.52s cubic-bezier(0.22, 1.25, 0.36, 1) forwards;
        }

        .xmas-box-btn.is-opening .xmas-bow-loop.right {
          animation: xmas-unloop-right 0.52s 0.52s cubic-bezier(0.22, 1.25, 0.36, 1) forwards;
        }

        .xmas-box-btn.is-opening .xmas-bow-tail.left {
          animation: xmas-untail-left 0.55s 0.56s ease-out forwards;
        }

        .xmas-box-btn.is-opening .xmas-bow-tail.right {
          animation: xmas-untail-right 0.55s 0.56s ease-out forwards;
        }

        .xmas-box-btn.is-opening .xmas-gift-knot {
          animation: xmas-knot-pop 0.35s 0.72s ease-out forwards;
        }

        /* 리본이 풀리며 상자 위·옆으로 촤르륵 흘러내림 */
        .xmas-box-btn.is-opening .xmas-ribbon-v {
          animation: xmas-ribbon-loosen 0.45s 0.65s ease-in forwards;
        }

        .xmas-box-btn.is-opening .xmas-ribbon-tail.left {
          animation: xmas-droop-left 0.68s 0.72s cubic-bezier(0.25, 0.9, 0.35, 1.1) forwards;
        }

        .xmas-box-btn.is-opening .xmas-ribbon-tail.right {
          animation: xmas-droop-right 0.68s 0.72s cubic-bezier(0.25, 0.9, 0.35, 1.1) forwards;
        }

        /* 1.12s~: 풀린 리본 사이로 뚜껑이 팡! 튀어 오름 */
        .xmas-box-btn.is-opening .xmas-gift-lid {
          animation: xmas-pop-lid 0.68s 1.12s cubic-bezier(0.18, 0.88, 0.3, 1.15) forwards;
        }

        .xmas-box-btn.is-opening .xmas-gift-bow {
          animation: xmas-bow-flyaway 0.62s 0.98s cubic-bezier(0.2, 0.85, 0.3, 1) forwards;
        }

        .xmas-box-btn.is-opening .xmas-box-glow {
          animation: xmas-pop-glow 0.85s 1.14s ease-out forwards;
        }

        @keyframes xmas-shake {
          0%, 100% { transform: scale(1.06) rotate(0deg); }
          20% { transform: scale(1.1) translateY(-3px) rotate(-5deg); }
          40% { transform: scale(1.1) translateY(-2px) rotate(5deg); }
          60% { transform: scale(1.12) translateY(-4px) rotate(-4deg); }
          80% { transform: scale(1.12) translateY(-3px) rotate(4deg); }
        }

        @keyframes xmas-unloop-left {
          0% { transform: rotate(-16deg) scale(1); }
          55% { transform: rotate(-56deg) translate(-6px, -4px) scale(1.18, 0.82); }
          100% { transform: rotate(-82deg) translate(-12px, 6px) scale(1.3, 0.55); opacity: 0.75; }
        }

        @keyframes xmas-unloop-right {
          0% { transform: scaleX(-1) rotate(-16deg) scale(1); }
          55% { transform: scaleX(-1) rotate(-56deg) translate(-6px, -4px) scale(1.18, 0.82); }
          100% { transform: scaleX(-1) rotate(-82deg) translate(-12px, 6px) scale(1.3, 0.55); opacity: 0.75; }
        }

        @keyframes xmas-untail-left {
          0% { transform: rotate(22deg) scaleY(1); }
          100% { transform: rotate(48deg) translate(-5px, 6px) scaleY(1.35); opacity: 0.5; }
        }

        @keyframes xmas-untail-right {
          0% { transform: rotate(-22deg) scaleY(1); }
          100% { transform: rotate(-48deg) translate(5px, 6px) scaleY(1.35); opacity: 0.5; }
        }

        @keyframes xmas-knot-pop {
          0% { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(1.8); opacity: 0; }
        }

        @keyframes xmas-ribbon-loosen {
          0% { transform: translateX(-50%) scaleY(1); opacity: 1; }
          100% { transform: translateX(-50%) scaleY(0.15); opacity: 0; }
        }

        @keyframes xmas-droop-left {
          0% { opacity: 0; transform: translate(0, 0) rotate(6deg) scaleY(0.2); }
          30% { opacity: 1; transform: translate(-4px, 6px) rotate(16deg) scaleY(0.85); }
          100% { opacity: 0; transform: translate(-18px, 34px) rotate(32deg) scaleY(1.25); }
        }

        @keyframes xmas-droop-right {
          0% { opacity: 0; transform: translate(0, 0) rotate(-6deg) scaleY(0.2); }
          30% { opacity: 1; transform: translate(4px, 6px) rotate(-16deg) scaleY(0.85); }
          100% { opacity: 0; transform: translate(18px, 34px) rotate(-32deg) scaleY(1.25); }
        }

        @keyframes xmas-bow-flyaway {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-46px) rotate(22deg) scale(1.25); }
        }

        @keyframes xmas-pop-lid {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          35% { transform: translate(-8px, -34px) rotate(-18deg) scale(1.04); opacity: 1; }
          100% { transform: translate(-22px, -78px) rotate(-34deg) scale(0.92); opacity: 0; }
        }

        @keyframes xmas-pop-glow {
          0% { opacity: 0; transform: scale(0.45); }
          35% { opacity: 1; transform: scale(1.35); }
          100% { opacity: 0; transform: scale(1.75); }
        }

        /* 팡! 골드 폭죽 파티클 */
        .xmas-sparkle-layer {
          position: absolute;
          top: 42%;
          left: 50%;
          width: 0;
          height: 0;
          pointer-events: none;
          z-index: 8;
        }

        .xmas-sparkle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--sc);
          box-shadow: 0 0 8px var(--sc);
          animation: xmas-burst 0.95s cubic-bezier(0.14, 0.85, 0.3, 1) forwards;
        }

        .xmas-box-btn.is-opening .xmas-sparkle {
          opacity: 0;
          animation: xmas-burst 0.8s 1.15s cubic-bezier(0.14, 0.85, 0.3, 1) forwards;
        }

        @keyframes xmas-burst {
          0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 1;
          }
          65% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
            opacity: 0;
          }
        }

        /* 결과 초대장 카드 */
        .xmas-result-wrap {
          position: relative;
          margin: 22px auto 4px;
          max-width: 370px;
        }

        .xmas-result-card {
          position: relative;
          padding: 28px 20px 24px;
          border-radius: 18px;
          border: 1.5px solid #d9b468;
          background: linear-gradient(180deg, #fdfaf2 0%, #f4ebd7 100%);
          color: #142820;
          box-shadow:
            0 20px 44px rgba(0, 0, 0, 0.48),
            0 0 0 5px rgba(229, 193, 125, 0.16),
            inset 0 0 0 6px rgba(217, 180, 104, 0.12);
          animation: xmas-card-pop 0.58s cubic-bezier(0.2, 1.12, 0.32, 1) both;
        }

        @keyframes xmas-card-pop {
          0% { opacity: 0; transform: translateY(24px) scale(0.86); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .xmas-card-kicker {
          font-size: 10.5px;
          letter-spacing: 0.2em;
          font-weight: 800;
          color: #9e762d;
          margin-bottom: 14px;
        }

        .xmas-dept-pill {
          display: inline-block;
          padding: 4px 14px;
          border-radius: 999px;
          background: linear-gradient(135deg, #163d2f, #0d261d);
          color: #f3dcab;
          border: 1px solid rgba(229, 193, 125, 0.45);
          font-size: 12.5px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .xmas-target-name {
          margin: 0;
          font-size: 32px;
          line-height: 1.25;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0f241c;
          word-break: keep-all;
        }

        .xmas-target-nick {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b5d47;
          font-weight: 600;
        }

        .xmas-card-divider {
          width: 48px;
          height: 1.5px;
          margin: 16px auto;
          background: linear-gradient(90deg, transparent, #c79a44, transparent);
        }

        .xmas-ment {
          margin: 0 0 20px;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 700;
          color: #2f433a;
          word-break: keep-all;
        }

        .xmas-next-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 13px 16px;
          border-radius: 12px;
          border: 1px solid rgba(237, 208, 146, 0.5);
          background: linear-gradient(135deg, #163e30 0%, #0b231b 100%);
          color: #f5dfae;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(11, 35, 27, 0.28);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .xmas-next-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(11, 35, 27, 0.38);
        }

        @media (prefers-reduced-motion: reduce) {
          .xmas-draw-wrap * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {stage==='idle'?<section className="xmas-selection" aria-label="내가 한 달 동안 마니또가 되어줄 사람은?">
        <img src={DRAW_SELECTION_ART} alt="마음에 드는 선물상자 하나를 선택해 주세요"/>
        {boxes.map((box,index)=><button key={box.id} type="button" style={{left:`${13.5+index*25}%`}}
          onClick={()=>choose(index)} aria-label={`${index+1}번 선물상자 열기`}/>)}
      </section>:<section className="xmas-draw-board" aria-labelledby="draw-title">
        <div className="xmas-bokeh" aria-hidden="true" />
        <div className="xmas-snow-layer" aria-hidden="true">
          {[
            { left: '8%', size: 4, dur: '8s', delay: '-2s' },
            { left: '22%', size: 3, dur: '10s', delay: '-5s' },
            { left: '38%', size: 4.5, dur: '9s', delay: '-1s' },
            { left: '56%', size: 3, dur: '11s', delay: '-6s' },
            { left: '72%', size: 4, dur: '8.5s', delay: '-3s' },
            { left: '88%', size: 3.5, dur: '9.5s', delay: '-4s' },
          ].map((flake, i) => (
            <span
              key={i}
              className={`xmas-snow-dot ${i%2===0?'flake':''}`}
              style={{
                left: flake.left,
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                animationDuration: flake.dur,
                animationDelay: flake.delay,
              }}
            />
          ))}
        </div>

        <div className="xmas-draw-content">
          <div className="xmas-badge">✦ CHRISTMAS SECRET MANITTO ✦</div>
          <h2 id="draw-title" className="xmas-title">
            내가 한 달 동안<br/>마니또가 되어줄 사람은?
          </h2>
          <p className="xmas-subtitle" aria-live="polite">
            {stage === 'idle'
              ? '마음에 드는 선물상자 하나를 선택해 주세요'
              : stage === 'drawing'
              ? '리본이 풀리며 상자가 열리고 있어요…'
              : '선물상자가 열렸어요!'}
          </p>

          {stage !== 'revealed' ? (
            <div className="xmas-boxes">
              {boxes.map((box, index) => {
                const selected = chosen === index;
                const isOpening = selected && stage === 'drawing';
                return (
                  <button
                    type="button"
                    key={box.id}
                    disabled={stage !== 'idle'}
                    onClick={() => choose(index)}
                    aria-label={`${index + 1}번 선물상자`}
                    className={[
                      'xmas-box-btn',
                      chosen !== null && !selected ? 'is-dim' : '',
                      isOpening ? 'is-opening' : '',
                    ].join(' ')}
                  >
                    <span className="xmas-gift" aria-hidden="true">
                      <span className="xmas-gift-shadow" />
                      <span className="xmas-box-glow" />
                      <span className="xmas-gift-lid" style={{ background: box.lid }}>
                        <span className="xmas-gift-bow">
                          <span className="xmas-bow-loop left" />
                          <span className="xmas-bow-loop right" />
                          <span className="xmas-bow-tail left" />
                          <span className="xmas-bow-tail right" />
                          <span className="xmas-gift-knot" />
                        </span>
                      </span>
                      <span className="xmas-gift-body" style={{ background: box.body }}>
                        <span className="xmas-ribbon-v" />
                      </span>
                      <span className="xmas-ribbon-tail left" />
                      <span className="xmas-ribbon-tail right" />
                      {isOpening && (
                        <span className="xmas-sparkle-layer">
                          {sparkles.map((sp, sIdx) => (
                            <span
                              key={sIdx}
                              className="xmas-sparkle"
                              style={{
                                '--tx': sp.tx,
                                '--ty': sp.ty,
                                '--sc': sp.c,
                                transform: `scale(${sp.s})`,
                              }}
                            />
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="xmas-box-label">{box.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="xmas-result-wrap">
              <div className="xmas-sparkle-layer" aria-hidden="true">
                {sparkles.map((sp, sIdx) => (
                  <span
                    key={sIdx}
                    className="xmas-sparkle"
                    style={{
                      '--tx': sp.tx,
                      '--ty': sp.ty,
                      '--sc': sp.c,
                      animationDelay: sp.d,
                    }}
                  />
                ))}
              </div>
              <div className="xmas-result-card" role="status">
                <div className="xmas-card-kicker">✦ YOUR MANITTO ✦</div>
                {deptLabel && <div className="xmas-dept-pill">{deptLabel}</div>}
                <p className="xmas-target-name">{target}</p>
                {targetNickname && targetNickname !== target && (
                  <p className="xmas-target-nick">({targetNickname})</p>
                )}
                <div className="xmas-card-divider" />
                <p className="xmas-ment">한 달 동안 마니또 활동<br/>잘 부탁드립니다.</p>
              </div>
              <button type="button" onClick={onNext} className="xmas-next-btn relative">
                미니룸으로 가기 <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>}
    </div>
  );
}

function DashboardView({ myName, myMemberId,incomingReadAt,onOpenIncoming,treePosts,onTreeSave,onTreeDelete,target,targetDepartment, mySanta, isRevealed, events, onEditProfile, onActivity, onOpenMessage, onGiftSubmit, profiles, pairs }) {
  const myProfile = profiles?.[myName] || { nickname: myName, avatar: '🎅' };
  const targetProfile = profiles?.[target] || { nickname: target, avatar: '👤' };
  const [giftEnabled,setGiftEnabled]=useState(giftOpens);
  useEffect(()=>{const timer=setInterval(()=>setGiftEnabled(giftOpens()),30000);return()=>clearInterval(timer);},[]);

  return (
    <div className="flex flex-col min-h-full space-y-2 sm:space-y-4 shrink-0">
      
      {/* 1. Cyworld Miniroom (크리스마스 테마) */}
      <ChristmasMiniroom profiles={profiles} myName={myName} myMemberId={myMemberId} onEdit={onEditProfile} treePosts={treePosts} onTreeSave={onTreeSave} onTreeDelete={onTreeDelete}/>

      <IncomingNotice myName={myName} events={events} readAt={incomingReadAt} onOpen={onOpenIncoming}/>

      {/* 2. Target Info (내가 챙길 사람) */}
      <div className="border border-slate-300 bg-white p-3 shrink-0">
        <div className="text-[10px] font-bold text-blue-600 mb-1 flex items-center">
          <Heart size={10} className="mr-1 fill-blue-600" /> 내가 챙길 사람
        </div>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
          <div className="text-sm sm:text-base font-bold text-slate-800 flex items-center min-w-0">
            <PixelCharacter avatar={targetProfile.avatar} className="target-avatar mr-2"/>
            <div className="min-w-0">
              {targetDepartment && targetDepartment!=='미분류' && <div className="text-[11px] font-semibold text-blue-700 break-words">{targetDepartment}</div>}
              <div className="break-words">{target} <span className="text-[10px] sm:text-xs font-normal text-slate-500">({targetProfile.nickname})</span></div>
            </div>
          </div>
          <div className="flex space-x-1 sm:space-x-2">
            <button onClick={onActivity} className="bg-orange-100 text-orange-700 font-bold px-4 py-2.5 min-h-11 text-sm border border-orange-300 rounded hover:bg-orange-200 flex items-center justify-center" title="자리에 몰래 선물을 두고 왔을 때 누르세요!">
              <Gift size={16} className="mr-1.5" /> 활동 진행!
            </button>
            <button onClick={onOpenMessage} className="bg-slate-100 text-slate-700 px-4 py-2.5 min-h-11 text-sm font-bold border border-slate-300 rounded hover:bg-slate-200 flex items-center justify-center">
              <MessageCircle size={16} className="mr-1.5" /> 일촌평
            </button>
          </div>
        </div>
        
        {/* 23일 선물 제출 완료 버튼 */}
        <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
          {!myProfile.giftSubmitted ? (
            <button onClick={onGiftSubmit} disabled={!giftEnabled} className={`w-full text-white text-xs sm:text-sm font-bold py-2.5 rounded transition ${giftEnabled?'bg-green-600 hover:bg-green-700':'bg-slate-400 cursor-not-allowed'}`}>
              {giftEnabled?'🎁 23일 선물 준비 완료! (누르면 방장에게 전달됨)':'🎁 선물 준비 완료는 12월 20일부터 누를 수 있어요'}
            </button>
          ) : (
            <div className="w-full bg-green-100 text-green-800 text-[11px] sm:text-xs font-bold py-1.5 text-center rounded border border-green-300">
              ✔️ 선물 준비 완료 확인됨!
            </div>
          )}
        </div>
      </div>

      {/* Reveal Banner (Shown only on the 24th if revealed) */}
      {isRevealed && mySanta && (
        <div className="bg-red-50 border-2 border-dashed border-red-400 p-2 sm:p-4 text-center animate-in slide-in-from-top-2 shrink-0">
          <h3 className="text-red-600 font-bold text-xs sm:text-sm mb-1">🎄 메리 크리스마스! 정체 공개 🎄</h3>
          <p className="text-slate-700 text-[10px] sm:text-xs">
            그동안 나를 남몰래 챙겨준 산타는 바로...<br/>
            <span className="text-sm sm:text-lg font-extrabold text-red-600 block mt-1">
              '{mySanta}' <span className="text-[10px] font-normal">({profiles?.[mySanta]?.nickname || '알수없음'})</span>
            </span> 님 이었습니다! 🎉
          </p>
        </div>
      )}


    </div>
  );
}

function DiaryFeed({events,profiles,pairs,isRevealed,title="다이어리 (최근 소식)",emptyText="아직 다이어리가 비어있어요. 첫 번째 기록을 남겨주세요!"}) {
  const timeAgo = (ms) => {
    if (!ms) return '';
    const diff = Math.floor((Date.now() - ms) / 1000 / 60); 
    if (diff < 1) return '방금 전';
    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return `${Math.floor(diff/60)}시간 전`;
    return `${Math.floor(diff/1440)}일 전`;
  };


  return (
      <div className="diary-panel min-h-[320px] flex flex-col shrink-0">
        <div className="text-[10px] sm:text-xs font-bold text-slate-600 mb-1 pl-1 shrink-0">
          {title}
        </div>
        
        <div className="space-y-2 pr-1 pb-2">
          {events.length === 0 ? (
            <div className="text-center text-slate-400 py-6 text-[10px] sm:text-xs border-t border-b border-dashed border-slate-300 bg-white">
              {emptyText}
            </div>
          ) : (
            events.map((ev, idx) => {
              // 찾기: ev.target이 누구의 마니또인지 (글 쓴 사람 찾기)
              const writerRealName = isRevealed && pairs ? Object.keys(pairs).find(k => pairs[k] === ev.target) : null;
              const writerNickname = writerRealName && profiles?.[writerRealName] ? profiles[writerRealName].nickname : '누군가';
              const targetNickname = profiles?.[ev.target]?.nickname || ev.target;

              return (
                <div key={ev.id} className="bg-white border border-slate-300 text-[10px] sm:text-xs">
                  {/* Guestbook Header */}
                  <div className="bg-slate-100 border-b border-slate-200 px-2 py-1 flex justify-between text-[9px] sm:text-[10px] text-slate-500">
                    <span>No. {events.length - idx}</span>
                    <span>{timeAgo(ev.timestamp)}</span>
                  </div>
                  {/* Guestbook Content */}
                  <div className="p-2 flex items-start">
                    <div className="mr-2 mt-0.5 text-base sm:text-lg">
                      {ev.type === 'activity' ? '🎁' : (ev.type === 'visit' ? '🐾' : (ev.hint || '💬'))}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-800 font-medium mb-1">
                        {ev.type === 'activity' ? (
                          <><span className="font-bold text-blue-600">'{targetNickname}'</span> 님의 마니또가 다녀갔습니다! 본인 자리를 확인해보세요! 🏃💨</>
                        ) : (
                          <><span className="font-bold text-orange-600">{writerNickname}</span>가 <span className="font-bold text-blue-600">'{targetNickname}'</span> 님에게 {ev.type === 'visit' ? '다녀갔어요~' : '일촌평을 남겼어요!'}</>
                        )}
                      </p>
                      {ev.type === 'message' && ev.text && (
                        <div className="mt-1 text-slate-600 bg-slate-50 border border-slate-200 p-1.5 leading-relaxed whitespace-pre-wrap text-[10px] sm:text-xs">
                          {ev.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
  );
}
function PhotoChatView({readOnly=false,posts,ready,onPost,onDelete,onError,myMemberId,isAdmin,profiles,limitCount,onMore}) {
  const [text,setText]=useState(''),[image,setImage]=useState(''),[processing,setProcessing]=useState(false),[busy,setBusy]=useState(false),[zoom,setZoom]=useState(null);
  const fileVersion=useRef(0);
  useEffect(()=>()=>{fileVersion.current++;},[]);
  const selectPhoto=async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    const version=++fileVersion.current;setProcessing(true);setImage('');
    try{const result=await preparePhoto(file);if(version===fileVersion.current)setImage(result);}catch(error){if(version===fileVersion.current)onError(error);}finally{if(version===fileVersion.current)setProcessing(false);}
  };
  const send=async()=>{if(busy||processing)return;setBusy(true);try{if(await onPost(text,image)){setText('');setImage('');}}finally{setBusy(false);}};
  return <div className="flex flex-col min-h-full gap-3 pb-4">
    <div className="flex items-end justify-between border-b border-dashed border-slate-300 pb-2"><div><h2 className="text-sm font-bold text-blue-700">📷 울장복 사진첩</h2><p className="text-[10px] text-slate-500 mt-1">미니미 별명으로 사진과 짧은 한마디를 함께 나눠요.</p></div></div>
    {!readOnly&&<div className="border border-slate-300 bg-white p-3 rounded-sm">
      {image&&<div className="mb-2 bg-slate-50 p-2 border border-slate-200"><img src={image} alt="올릴 사진 미리보기" className="max-h-40 w-full object-contain"/><button onClick={()=>{fileVersion.current++;setImage('');}} className="text-[10px] text-red-500 mt-1">첨부 취소</button></div>}
      <textarea aria-label="사진첩 한마디" maxLength={500} value={text} onChange={e=>setText(e.target.value)} placeholder="사진과 함께 짧은 한마디를 남겨보세요!" className="w-full min-h-[66px] border border-slate-300 bg-slate-50 p-2 text-xs outline-none focus:border-blue-400 rounded-sm"/>
      <div className="flex justify-between items-center gap-2 mt-2"><label className="text-xs border border-slate-300 px-2 py-1.5 text-slate-600 bg-slate-50 cursor-pointer rounded-sm">{processing?'사진 준비 중…':'📷 사진 첨부'}<input type="file" accept="image/*" aria-label="사진 선택" onChange={selectPhoto} disabled={processing||busy} className="hidden"/></label><span className="text-[10px] text-slate-400 ml-auto">{text.length}/500</span><button disabled={busy||processing||(!image&&!text.trim())} onClick={send} className="text-xs font-bold px-4 py-1.5 bg-blue-500 border border-blue-700 text-white disabled:opacity-40 rounded-sm">{busy?'올리는 중…':'올리기'}</button></div>
    </div>}
    {!ready?<div className="text-xs text-center text-slate-400 py-8">사진첩을 불러오는 중이에요…</div>:posts.length===0?<div className="text-xs text-center text-slate-400 py-10 border border-dashed border-slate-300 bg-white">첫 사진과 한마디를 남겨주세요!</div>:<div className="space-y-3" aria-label="사진첩 대화 목록">{posts.map(post=>{
      const own=!readOnly&&post.memberId===myMemberId,profile=Object.values(profiles||{}).find(p=>p._memberId===post.memberId);
      return <article key={post.id} className={`flex gap-2 ${own?'flex-row-reverse':''}`} data-photo-id={post.id}>
        <PixelCharacter avatar={profile?.avatar||'mini-01'} className="photo-chat-avatar"/>
        <div className={`max-w-[88%] sm:max-w-[75%] min-w-0 border p-2.5 rounded ${own?'bg-blue-50 border-blue-200':'bg-white border-slate-300'}`}>
          <div className="flex items-center gap-3 justify-between mb-1.5"><strong className="text-[11px] text-slate-700">{post.nickname}</strong><span className="text-[9px] text-slate-400 whitespace-nowrap">{post.createdAt?new Date(post.createdAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'}):'전송 중'}</span></div>
          {post.image&&<button type="button" onClick={()=>setZoom(post)} aria-label="사진 크게 보기" className="block mb-2 max-w-full"><img src={post.image} alt={post.text||`${post.nickname}님의 사진`} loading="lazy" className="max-h-72 max-w-full w-auto object-contain rounded-sm"/></button>}
          {post.text&&<p className="text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{post.text}</p>}
          {!readOnly&&(own||isAdmin)&&<button type="button" onClick={()=>onDelete(post)} aria-label={`${post.nickname} 사진첩 글 삭제`} className="text-[10px] text-slate-400 hover:text-red-500 mt-2">삭제</button>}
        </div>
      </article>;
    })}</div>}
    {ready&&posts.length===limitCount&&limitCount<150&&<button onClick={onMore} className="text-xs text-blue-600 border border-slate-300 bg-white py-2">이전 글 더 보기</button>}
    {zoom&&<div className="fixed inset-0 bg-black/80 z-40 flex flex-col items-center justify-center p-4 gap-3" role="dialog" aria-modal="true" aria-label="사진 크게 보기"><button onClick={()=>setZoom(null)} className="text-white text-sm self-end px-3 py-1">닫기 ✕</button><img src={zoom.image} alt={zoom.text||'사진 크게 보기'} className="max-w-full max-h-[70dvh] object-contain"/>{zoom.text&&<p className="text-white text-xs whitespace-pre-wrap text-center max-w-lg">{zoom.text}</p>}<a href={zoom.image} download="울장복_사진.jpg" className="text-white text-xs border border-white/50 px-4 py-2 rounded">사진 저장</a></div>}
  </div>;
}

function GuestbookView({events,profiles,pairs,isRevealed,myName,onWrite,initialMineOnly=false}) {
  const [mineOnly,setMineOnly]=useState(initialMineOnly);
  const messages=events.filter(event=>!mineOnly||event.target===myName);
  return <div className="flex flex-col min-h-full gap-3 pb-4"><div className="flex justify-between items-center border-b border-dashed border-slate-300 pb-2"><h2 className="text-sm font-bold text-blue-700">💌 울장복 방명록</h2>{onWrite&&<button onClick={onWrite} className="text-xs bg-blue-500 text-white border border-blue-700 px-3 py-1.5">일촌평 쓰기</button>}</div><p className="text-[10px] text-slate-500">나에게 온 마니또의 한마디와 다녀간 소식을 확인해보세요.</p>{myName&&<div className="flex gap-1" role="group" aria-label="방명록 보기 필터"><button onClick={()=>setMineOnly(false)} aria-pressed={!mineOnly} className={`text-xs px-3 py-1.5 border ${!mineOnly?'bg-blue-50 border-blue-400 text-blue-700 font-bold':'bg-white border-slate-300 text-slate-500'}`}>전체 글</button><button onClick={()=>setMineOnly(true)} aria-pressed={mineOnly} className={`text-xs px-3 py-1.5 border ${mineOnly?'bg-blue-50 border-blue-400 text-blue-700 font-bold':'bg-white border-slate-300 text-slate-500'}`}>내 마니또 소식</button></div>}<DiaryFeed events={messages} profiles={profiles} pairs={pairs} isRevealed={isRevealed} title={mineOnly?'내게 남긴 마니또 소식':'우리의 방명록과 활동 소식'} emptyText={mineOnly?'아직 내게 남긴 소식이 없어요.':'아직 방명록이 비어있어요.'}/></div>;
}

function TreeOrnament({kind,color}) {
  if(kind==='star')return <path d="M0-8L2.5-2.5L8-2L4 2L5 8L0 5L-5 8L-4 2L-8-2L-2.5-2.5Z" fill={color} stroke="#9b7153" strokeWidth="1"/>;
  if(kind==='bow')return <g fill={color} stroke="#9b7153"><path d="M0 0L-8-5V5ZM0 0L8-5V5Z"/><rect x="-2" y="-2" width="4" height="4"/></g>;
  if(kind==='gift')return <g><rect x="-6" y="-5" width="12" height="12" fill={color} stroke="#9b7153"/><path d="M0-5V7M-6-1H6" stroke="#ffe6a6" strokeWidth="2"/></g>;
  if(kind==='bell')return <g><path d="M-6 5L-4 1V-3Q0-10 4-3V1L6 5Z" fill={color} stroke="#9b7153"/><circle cy="7" r="2" fill="#f5d68f"/></g>;
  if(kind==='snow')return <path d="M0-8V8M-7-4L7 4M-7 4L7-4M-2-6L0-4L2-6M-2 6L0 4L2 6" stroke={color} strokeWidth="2" fill="none"/>;
  return <g><circle r="6" cy="1" fill={color} stroke="#9b7153"/><rect x="-2" y="-7" width="4" height="3" fill="#e4c786"/><circle cx="-2" cy="-1" r="1.5" fill="#ffffffaa"/></g>;
}
function TreeBoard({posts,myMemberId,onSave,onDelete,onClose}) {
  const own=posts.find(post=>post.memberId===myMemberId);
  const [message,setMessage]=useState(own?.message||''),[kind,setKind]=useState(own?.kind||'star'),[color,setColor]=useState(own?.color||'#e77882'),[busy,setBusy]=useState(false);
  const choices=[['star','⭐ 별'],['ball','🔴 구슬'],['bow','🎀 리본'],['bell','🔔 종'],['gift','🎁 선물'],['snow','❄ 눈꽃']];
  const save=async()=>{if(busy)return;setBusy(true);try{if(await onSave(message,kind,color))onClose();}finally{setBusy(false);}};
  return <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="크리스마스 트리 꾸미기"><div className="bg-[#fffaf0] border-2 border-[#b38d70] rounded w-full max-w-md max-h-[90dvh] overflow-y-auto p-4 custom-scrollbar"><div className="flex items-center justify-between mb-2"><h2 className="text-base font-bold text-green-800">🎄 우리들의 크리스마스 트리</h2><button onClick={onClose} aria-label="트리 꾸미기 닫기" className="text-slate-500 px-2">✕</button></div><p className="text-[11px] text-slate-500 mb-3">처음엔 비어 있는 트리예요. 한마디를 남기면 장식 하나가 달려요. 내 장식은 언제든 바꾸거나 지울 수 있어요.</p><textarea aria-label="크리스마스 한마디" value={message} maxLength={160} onChange={e=>setMessage(e.target.value)} placeholder="동료들에게 전하고 싶은 크리스마스 한마디" className="border border-[#d9c5aa] bg-white w-full min-h-[76px] p-2 text-xs outline-none focus:border-green-500"/><div className="grid grid-cols-3 gap-1.5 my-2" role="group" aria-label="장식 모양">{choices.map(([id,label])=><button key={id} aria-pressed={kind===id} onClick={()=>setKind(id)} className={`border rounded text-xs py-2 ${kind===id?'border-green-500 bg-green-50':'border-[#dfcfb9] bg-white'}`}>{label}</button>)}</div><div className="flex gap-2 py-2" role="group" aria-label="장식 색상">{TREE_COLORS.map((value,index)=><button key={value} aria-label={['분홍색','금색','초록색','파란색','보라색','흰색'][index]} aria-pressed={color===value} onClick={()=>setColor(value)} style={{background:value}} className={`w-6 h-6 rounded-full border-2 ${color===value?'border-slate-700':'border-[#cbbca4]'}`}/>)}</div><button disabled={busy||!message.trim()} onClick={save} className="w-full text-xs font-bold text-white bg-green-700 border border-green-900 py-2 mt-1 disabled:opacity-40">{busy?'장식 다는 중…':own?'내 장식 바꾸기':'내 장식 달기'}</button>{own&&<button onClick={()=>onDelete(own)} className="block mx-auto text-[10px] text-red-500 mt-2">내 장식 삭제</button>}<div className="border-t border-dashed border-[#d9c5aa] mt-4 pt-3"><h3 className="text-xs text-green-800 font-bold mb-2">트리에 달린 한마디 {posts.length}개</h3><div className="space-y-2">{posts.length===0?<p className="text-xs text-slate-400 py-3 text-center">첫 장식의 주인공이 되어주세요!</p>:posts.map(post=><div key={post.memberId} className="border border-[#e2d2bc] bg-white rounded p-2"><div className="text-[10px] font-bold text-[#9a6552] mb-1">{post.nickname}</div><p className="text-xs text-slate-700 whitespace-pre-wrap break-words">{post.message}</p></div>)}</div></div></div></div>;
}

function IncomingNotice({myName,events,readAt=0,onOpen}) {
  const incoming=events.filter(event=>event.target===myName),visits=incoming.filter(event=>event.type==='activity'),messages=incoming.filter(event=>event.type==='message');
  const latest=visits[0],newest=incoming.reduce((value,event)=>Math.max(value,event.timestamp||0),0),unread=newest>readAt;
  return <div data-testid="incoming-notice" className="border border-orange-200 bg-[#fff9ed] px-3 py-2 rounded-sm shrink-0"><div className="flex items-center justify-between gap-2"><h2 className="text-[11px] font-bold text-orange-700 flex items-center gap-1">💌 나를 챙기는 마니또의 소식 {unread&&<span className="tab-new">NEW</span>}</h2><button onClick={onOpen} className="text-[10px] bg-white text-orange-700 border border-orange-200 rounded-sm px-2 py-1 whitespace-nowrap">내 소식 보기</button></div><div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-1.5"><p className="text-xs font-bold text-slate-700">{latest?'🎁 내 자리에 다녀갔대요!':'🎄 아직 다녀간 소식이 없어요.'}</p>{latest?.timestamp>0&&<time className="text-[9px] text-slate-500">{new Date(latest.timestamp).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'})}</time>}<span className="text-[10px] text-slate-500">최근 받은 일촌평 {messages.length}개</span></div></div>;
}
