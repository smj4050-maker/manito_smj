import minimePoseAtlas from './minime-motion-poses.js';
import { createCrowd, stepCrowd, poseFrame, ACTION_LABELS, getCrowdAppearance, isRoomVisible } from './house-motion.mjs';
import { ROOM_BACKGROUND, BARE_TREE } from './room-background.js';
import { AVATAR_ATLASES } from './avatars.js';
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, linkWithCredential, EmailAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, query, orderBy, limit, onSnapshot, getDoc, getDocFromServer, runTransaction, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Gift, MessageCircle, Snowflake, Users, ArrowRight, AlertCircle, LogOut, Music, Heart, Settings, Lock, Plus, Trash2, Edit2 } from 'lucide-react';

// 관리자 비밀번호나 직원 참여 링크는 소스 코드에 저장하지 않습니다.
const appId = 'manito-xmas-app';
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
    if(activeTab!=='photos' || (!isAdmin&&!isLoggedIn))return;
    return onSnapshot(query(photosCollection(),orderBy('createdAt','desc'),limit(photoLimit)),snap=>{
      setPhotoPosts(snap.docs.map(item=>{const post=item.data({serverTimestamps:'estimate'});return {...post,id:item.id,createdAt:post.createdAt?.toMillis?.()||0};}));setPhotosReady(true);
    },error=>{setPhotosReady(true);fail(error);});
  },[user?.uid,isAdmin,isLoggedIn,activeTab,photoLimit]);

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
    const normalized = await normalizeMembers(members, members);
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
      transaction.set(dataDoc('settings_members'), { list: normalized });
      transaction.set(dataDoc('reveal'), { pairs });
      transaction.set(dataDoc('settings_config'), { hasDraw: true, isRevealed: false, roundId: newRoundId });
    });
    showModal('성공!', `${normalized.length}명의 마니또 배정이 완료되었습니다! 모두에게 같은 사이트 주소를 알려주세요. 직원은 '처음 등록'에서 본인 이름과 4자리 번호를 정하면 됩니다.`);
  }, true);

  const handleLogin = async (name, pin, confirmation, registering) => runAction('login', async () => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('이름을 입력해주세요.');
    if (!/^\d{4}$/.test(pin)) throw new Error('번호는 숫자 4자리로 입력해주세요.');
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
    let next;
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(dataDoc('settings_config'));
      const current = snapshot.exists() ? snapshot.data() : {};
      if (!current.hasDraw || current.roundId !== roundId) throw new Error('먼저 배정 상태를 확인해주세요.');
      next = !current.isRevealed;
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
    <div className="h-[100dvh] w-full bg-[#d1d5db] cyworld-font relative overflow-hidden sm:py-4 sm:px-2 bg-[radial-gradient(#9ca3af_1px,transparent_1px)] bg-[size:12px_12px] flex items-center justify-center">
      
      <SpriteDefinitions />
      {/* Cyworld Outer Box - 폰 화면에 꽉 차게 */}
      <div className="w-full h-full max-w-6xl sm:h-[94vh] bg-[#47a6b8] p-1 sm:p-2 sm:rounded-2xl sm:shadow-2xl sm:border-2 sm:border-slate-500 relative flex flex-col">
        
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
            {isLoggedIn && (
              <button onClick={handleLogout} className="text-[10px] sm:text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 border border-slate-300 hover:bg-slate-300">
                로그아웃
              </button>
            )}
          </header>

          {/* Tabs */}
          <div className="flex px-3 space-x-1 mb-1 bg-white shrink-0" role="tablist" aria-label="미니홈피 메뉴">
            {[['home','홈'],['photos','사진첩'],['guestbook','방명록']].map(([tab,label])=><button key={tab} role="tab" aria-label={label} aria-selected={activeTab===tab} disabled={!isAdmin&&viewState!=='dashboard'} onClick={()=>{if(tab==='guestbook')setGuestbookIncoming(false);setActiveTab(tab);}} className={activeTab===tab?'bg-white border-t border-l border-r border-slate-400 rounded-t-lg px-3 py-1 text-xs sm:text-sm font-bold text-blue-600 z-10 -mb-[2px]':'bg-slate-200 border-t border-l border-r border-slate-300 rounded-t-lg px-3 py-1 text-xs sm:text-sm text-slate-500 z-0'}>{label}{((tab==='photos'&&activeTab!=='photos'&&latestPhotoAt>readState.photosAt)||(tab==='guestbook'&&activeTab!=='guestbook'&&latestGuestAt>readState.guestbookAt))&&<span className="tab-new" aria-label={`${label} 새 글`}>NEW</span>}</button>)}
          </div>

          {/* Dynamic Views (Content Area - 화면에 맞게 스크롤) */}
          <main data-testid="main-scroll" className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 bg-slate-50 border-t-2 border-solid border-slate-400 sm:rounded-b-xl overflow-y-auto custom-scrollbar">
            {viewState === 'admin' && activeTab === 'home' && (
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
            {viewState === 'login' && <LoginView onLogin={handleLogin} onGoAdmin={() => setShowAdminAuth(true)} />}
            {viewState === 'profileSetup' && <ProfileSetupView onSetup={handleProfileSetup} />}
            {viewState === 'draw' && <DrawView key={identity} target={getMyTarget()} stage={drawStage} onStart={startDraw} onNext={goDashboard} profiles={visibleProfiles} />}
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
            {(isAdmin||viewState==='dashboard')&&activeTab==='photos'&&<PhotoChatView posts={photoPosts} ready={photosReady} onPost={handlePhotoPost} onDelete={handlePhotoDelete} onError={fail} myMemberId={assignment?.memberId||'admin'} isAdmin={isAdmin} profiles={visibleProfiles} limitCount={photoLimit} onMore={()=>setPhotoLimit(value=>Math.min(150,value+30))}/>}
            {(isAdmin||viewState==='dashboard')&&activeTab==='guestbook'&&<GuestbookView key={guestbookIncoming?'incoming':'all'} initialMineOnly={guestbookIncoming} events={visibleEvents} profiles={visibleProfiles} pairs={config.pairs} isRevealed={config.isRevealed} myName={myName} onWrite={isAdmin?null:()=>setShowMessageModal(true)}/>}
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
      <input type="text" maxLength={30} className="w-full bg-slate-50 border border-slate-300 text-center text-sm p-2 mb-3 outline-none focus:border-blue-500" placeholder="사용할 별명 (예: 루돌프코)" value={nickname} onChange={e=>setNickname(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.nativeEvent.isComposing&&save()}/>
      <button onClick={save} disabled={busy} className="w-full bg-orange-500 text-white font-bold text-sm py-2 border border-orange-700 hover:bg-orange-600 transition">{busy?'저장 중…':initialProfile?'미니미 저장':'미니룸 입장'}</button>
      {onCancel&&<button onClick={onCancel} className="text-xs text-slate-500 mt-3 px-4 py-1">취소</button>}
    </div>
  </div>;
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
        {notes.map((note,index)=>{const point=ornamentPoint(index);return <button key={note.memberId} type="button" className="tree-note-hit" aria-label={`${note.nickname}님의 트리 장식`} style={{left:`${point.x/10}%`,top:`${point.y/6.5}%`}} onClick={()=>setSelectedNote(note)}/>;})}
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

function DrawView({ target, stage, onStart, onNext, profiles }) {
  const [chosen,setChosen]=useState(null);
  const targetNickname=profiles?.[target]?.nickname;
  const choose=index=>{
    if(stage!=='idle'||chosen!==null)return;
    setChosen(index);
    onStart();
  };

  return <div className="draw-screen">
    <style>{`
      .draw-screen { min-height: min(540px,100%); margin:auto; width:100%; max-width:600px; color:#fff3da; text-align:center; }
      .draw-board { padding:24px 12px; border:2px solid #c49155; border-radius:20px; background:radial-gradient(ellipse at 50% 65%,#355c53,#142d39 72%); box-shadow:inset 0 0 24px #081d22,0 8px 20px #142d3930; }
      .draw-boxes { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); margin:28px auto 10px; max-width:410px; gap:8px; }
      .draw-box { position:relative; width:100%; height:134px; padding:0; color:#fff3da; border:0; background:none; }
      .draw-box:enabled { cursor:pointer; }
      .draw-box:focus-visible { outline:2px solid #ffdb8a; outline-offset:3px; border-radius:10px; }
      .draw-gift { position:absolute; inset:14px 8% 26px; transform-origin:50% 95%; transition:transform .2s ease,opacity .35s ease; }
      .draw-box:enabled:hover .draw-gift,.draw-box:enabled:focus-visible .draw-gift { transform:translateY(-8px) rotate(-4deg); }
      .draw-base,.draw-lid { position:absolute; border:2px solid #1d2029; border-radius:7px; box-shadow:inset 0 4px #ffffff30,inset -7px -5px #00000026; }
      .draw-base { inset:38% 5% 0; background:var(--gift); }
      .draw-lid { inset:25% 0 51%; background:var(--lid); z-index:3; transform-origin:12% 100%; }
      .draw-base::after,.draw-lid::after { content:""; position:absolute; inset:0 40%; background:#f2c86f; box-shadow:inset -3px 0 #a76b37; }
      .draw-bow { position:absolute; left:50%; top:25%; z-index:4; transform:translate(-50%,-88%); display:flex; }
      .draw-bow i { display:block; width:clamp(14px,4vw,25px); height:17px; border:4px solid #ebbb62; border-radius:75% 75% 10% 75%; transform:rotate(13deg); }
      .draw-bow i+i { transform:scaleX(-1) rotate(13deg); }
      .draw-box-label { position:absolute; inset:auto 0 0; font-size:12px; font-weight:700; }
      .draw-box.is-dim .draw-gift { opacity:.36; transform:scale(.88); }
      .draw-box.is-opening .draw-gift { animation:gift-shake .65s ease-in-out both; }
      .draw-box.is-opening .draw-bow { animation:gift-unribbon .5s .50s ease-in both; }
      .draw-box.is-opening .draw-lid { animation:gift-unlid .62s .93s cubic-bezier(.2,.7,.3,1) both; }
      .draw-box.is-opening .draw-glow { animation:gift-glow 1s .95s ease-out both; }
      .draw-box.is-open .draw-bow,.draw-box.is-open .draw-lid { opacity:0; }
      .draw-glow { position:absolute; inset:-24% -20% 5%; pointer-events:none; opacity:0; background:radial-gradient(ellipse,#fff4bc,#ffd77060 34%,transparent 69%); z-index:2; }
      .draw-scroll { max-width:350px; margin:12px auto 0; padding:18px 12px; border:2px solid #e8c684; border-radius:11px; color:#453027; background:#fff4db; box-shadow:0 8px 24px #0004; transform-origin:top; animation:gift-scroll .42s ease-out both; }
      @keyframes gift-shake { 0%,100%{transform:translateY(0)} 20%,60%{transform:translateY(-5px) rotate(-7deg)} 40%,80%{transform:translateY(-3px) rotate(7deg)} }
      @keyframes gift-unribbon { from{opacity:1} to{transform:translate(-50%,-150%) scaleX(1.9) rotate(-18deg);opacity:0} }
      @keyframes gift-unlid { from{transform:none;opacity:1} to{transform:translate(-13%,-170%) rotate(-28deg);opacity:0} }
      @keyframes gift-glow { 0%,100%{opacity:0;transform:scale(.65)} 38%{opacity:1;transform:scale(1.18)} }
      @keyframes gift-scroll { from{opacity:0;transform:translateY(-15px) scale(.88,.45)} to{opacity:1;transform:none} }
      @media(prefers-reduced-motion:reduce){.draw-screen *{animation:none!important;transition:none!important}}
    `}</style>
    <section className="draw-board" aria-labelledby="draw-title">
      <h2 id="draw-title" className="text-xl sm:text-2xl font-extrabold">내 마니또는 누구?</h2>
      <p className="mt-2 text-sm" aria-live="polite">{stage==='idle'?'선물상자 하나를 골라보세요.':stage==='drawing'?'고른 상자를 여는 중…':'상자 속 쪽지가 열렸어요!'}</p>
      <div className="draw-boxes">
        {[
          ['#ac3949','#d95865'],
          ['#28735e','#439c79'],
          ['#465ca2','#6987cd'],
        ].map(([gift,lid],index)=>{
          const selected=chosen===index;
          return <button type="button" key={gift} disabled={stage!=='idle'}
            className={`draw-box ${chosen!==null&&!selected?'is-dim':''} ${selected&&stage==='drawing'?'is-opening':''} ${selected&&stage==='revealed'?'is-open':''}`}
            style={{'--gift':gift,'--lid':lid}} onClick={()=>choose(index)}
            aria-label={`${index+1}번 선물상자`}>
            <span className="draw-gift" aria-hidden="true">
              <span className="draw-base"/><span className="draw-glow"/><span className="draw-lid"/>
              <span className="draw-bow"><i/><i/></span>
            </span>
            <span className="draw-box-label">{index+1}번 상자</span>
          </button>;
        })}
      </div>
      {stage==='revealed'&&<div className="draw-scroll" role="status">
        <p className="text-xs font-bold text-red-800">내가 챙길 마니또</p>
        <p className="mt-1 text-2xl font-extrabold break-words">{target}</p>
        {targetNickname&&targetNickname!==target&&<p className="text-sm">{targetNickname}</p>}
        <button type="button" onClick={onNext} className="mt-4 inline-flex items-center rounded-lg bg-[#225746] px-4 py-3 text-sm font-bold text-white">
          미니룸으로 가기 <ArrowRight className="ml-1" size={16}/>
        </button>
      </div>}
    </section>
  </div>;
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
function PhotoChatView({posts,ready,onPost,onDelete,onError,myMemberId,isAdmin,profiles,limitCount,onMore}) {
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
    <div className="border border-slate-300 bg-white p-3 rounded-sm">
      {image&&<div className="mb-2 bg-slate-50 p-2 border border-slate-200"><img src={image} alt="올릴 사진 미리보기" className="max-h-40 w-full object-contain"/><button onClick={()=>{fileVersion.current++;setImage('');}} className="text-[10px] text-red-500 mt-1">첨부 취소</button></div>}
      <textarea aria-label="사진첩 한마디" maxLength={500} value={text} onChange={e=>setText(e.target.value)} placeholder="사진과 함께 짧은 한마디를 남겨보세요!" className="w-full min-h-[66px] border border-slate-300 bg-slate-50 p-2 text-xs outline-none focus:border-blue-400 rounded-sm"/>
      <div className="flex justify-between items-center gap-2 mt-2"><label className="text-xs border border-slate-300 px-2 py-1.5 text-slate-600 bg-slate-50 cursor-pointer rounded-sm">{processing?'사진 준비 중…':'📷 사진 첨부'}<input type="file" accept="image/*" aria-label="사진 선택" onChange={selectPhoto} disabled={processing||busy} className="hidden"/></label><span className="text-[10px] text-slate-400 ml-auto">{text.length}/500</span><button disabled={busy||processing||(!image&&!text.trim())} onClick={send} className="text-xs font-bold px-4 py-1.5 bg-blue-500 border border-blue-700 text-white disabled:opacity-40 rounded-sm">{busy?'올리는 중…':'올리기'}</button></div>
    </div>
    {!ready?<div className="text-xs text-center text-slate-400 py-8">사진첩을 불러오는 중이에요…</div>:posts.length===0?<div className="text-xs text-center text-slate-400 py-10 border border-dashed border-slate-300 bg-white">첫 사진과 한마디를 남겨주세요!</div>:<div className="space-y-3" aria-label="사진첩 대화 목록">{posts.map(post=>{
      const own=post.memberId===myMemberId,profile=Object.values(profiles||{}).find(p=>p._memberId===post.memberId);
      return <article key={post.id} className={`flex gap-2 ${own?'flex-row-reverse':''}`} data-photo-id={post.id}>
        <PixelCharacter avatar={profile?.avatar||'mini-01'} className="photo-chat-avatar"/>
        <div className={`max-w-[88%] sm:max-w-[75%] min-w-0 border p-2.5 rounded ${own?'bg-blue-50 border-blue-200':'bg-white border-slate-300'}`}>
          <div className="flex items-center gap-3 justify-between mb-1.5"><strong className="text-[11px] text-slate-700">{post.nickname}</strong><span className="text-[9px] text-slate-400 whitespace-nowrap">{post.createdAt?new Date(post.createdAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'}):'전송 중'}</span></div>
          {post.image&&<button type="button" onClick={()=>setZoom(post)} aria-label="사진 크게 보기" className="block mb-2 max-w-full"><img src={post.image} alt={post.text||`${post.nickname}님의 사진`} loading="lazy" className="max-h-72 max-w-full w-auto object-contain rounded-sm"/></button>}
          {post.text&&<p className="text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{post.text}</p>}
          {(own||isAdmin)&&<button type="button" onClick={()=>onDelete(post)} aria-label={`${post.nickname} 사진첩 글 삭제`} className="text-[10px] text-slate-400 hover:text-red-500 mt-2">삭제</button>}
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
