'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rtdb } from '@/lib/firebase';
import { ref, set, onValue, push, onChildAdded } from 'firebase/database';

const LANGS = [
  { code: 'en', name: 'English', speech: 'en-US' },
  { code: 'fr', name: 'French', speech: 'fr-FR' },
  { code: 'es', name: 'Spanish', speech: 'es-ES' },
  { code: 'de', name: 'German', speech: 'de-DE' },
  { code: 'pt', name: 'Portuguese', speech: 'pt-BR' },
  { code: 'zh', name: 'Mandarin Chinese', speech: 'zh-CN' },
  { code: 'ar', name: 'Arabic', speech: 'ar-SA' },
  { code: 'ja', name: 'Japanese', speech: 'ja-JP' },
  { code: 'ru', name: 'Russian', speech: 'ru-RU' },
];
const langName = (code) => LANGS.find((l) => l.code === code)?.name || code;
const langSpeech = (code) => LANGS.find((l) => l.code === code)?.speech || 'en-US';

export default function RoomPage() {
  const { code } = useParams();
  const router = useRouter();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const recognitionRef = useRef(null);

  const [status, setStatus] = useState('Setting up…');
  const [error, setError] = useState('');
  const [captions, setCaptions] = useState([]);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);
  const [mySpokenLang, setMySpokenLang] = useState('en');
  const [myCaptionLang, setMyCaptionLang] = useState('fr');

  // Refs mirror the state above so callbacks set up once (recognition,
  // data channel handlers) always read the CURRENT value, not a stale one.
  const mySpokenLangRef = useRef(mySpokenLang);
  const myCaptionLangRef = useRef(myCaptionLang);
  const remoteCaptionLangRef = useRef(null);
  const speakOnRef = useRef(speakOn);
  const pendingCandidatesRef = useRef([]);

  useEffect(() => { mySpokenLangRef.current = mySpokenLang; }, [mySpokenLang]);
  useEffect(() => { myCaptionLangRef.current = myCaptionLang; }, [myCaptionLang]);
  useEffect(() => { speakOnRef.current = speakOn; }, [speakOn]);

  // Re-announce our language choice if it changes mid-call
  useEffect(() => {
    sendMeta();
  }, [mySpokenLang, myCaptionLang]);

  function sendMeta() {
    const ch = dataChannelRef.current;
    if (ch && ch.readyState === 'open') {
      ch.send(JSON.stringify({ type: 'meta', spokenLang: mySpokenLangRef.current, captionLang: myCaptionLangRef.current }));
    }
  }

  function setupDataChannel(channel) {
    dataChannelRef.current = channel;
    channel.onopen = () => {
      console.log('[DATACHANNEL] Open.');
      sendMeta();
    };
    channel.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'meta') {
        remoteCaptionLangRef.current = msg.captionLang;
        console.log('[DATACHANNEL] Received meta. Remote wants captions in:', msg.captionLang);
      } else if (msg.type === 'caption') {
        addCaption('theirs', msg.translated, `${langName(msg.sourceLang)} → ${langName(myCaptionLangRef.current)}`);
        if (speakOnRef.current) speak(msg.translated, myCaptionLangRef.current);
      }
    };
  }

  function addCaption(who, text, tag) {
    setCaptions((prev) => [...prev.slice(-5), { who, text, tag, id: Date.now() }]);
  }

  function speak(text, langCode) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langSpeech(langCode);
    window.speechSynthesis.speak(utter);
  }

  async function handleRecognizedText(text) {
    addCaption('mine', text, langName(mySpokenLangRef.current));
    const targetLang = remoteCaptionLangRef.current || myCaptionLangRef.current;
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLang: mySpokenLangRef.current, targetLang }),
      });
      const data = await res.json();
      const ch = dataChannelRef.current;
      if (res.ok && ch && ch.readyState === 'open') {
        ch.send(JSON.stringify({ type: 'caption', translated: data.translated, sourceLang: mySpokenLangRef.current }));
      } else if (!res.ok) {
        console.error('Translate API error:', data);
      }
    } catch (err) {
      console.error('Translate request failed:', err);
    }
  }

  function toggleCaptions() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError('Live captioning needs Chrome or Edge on this device.');
      return;
    }
    if (!captionsOn) {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = langSpeech(mySpokenLangRef.current);
      recognition.onresult = (e) => {
        const text = e.results[e.results.length - 1][0].transcript.trim();
        if (text) handleRecognizedText(text);
      };
      recognition.onend = () => {
        if (recognitionRef.current) { try { recognition.start(); } catch (e) { } }
      };
      recognition.onerror = (e) => {
        console.log('[SPEECH RECOGNITION ERROR]', e.error);
      };
      recognition.onstart = () => {
        console.log('[SPEECH RECOGNITION] Started listening.');
      };
      recognitionRef.current = recognition;
      recognition.start();
      setCaptionsOn(true);
    } else {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      if (rec) rec.stop();
      setCaptionsOn(false);
    }
  }

  function handleLeave() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
      recognitionRef.current = null;
    }
    if (pcRef.current) pcRef.current.close();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    router.push('/');
  }

  useEffect(() => {
    let unsubscribers = [];

    async function start() {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const { user } = await meRes.json();

      const roomRes = await fetch(`/api/rooms/${code}`);
      if (!roomRes.ok) {
        const data = await roomRes.json();
        setError(data.error || 'Could not access this room.');
        return;
      }
      const { room } = await roomRes.json();
      const isHost = room.host === user._id;
      const myRole = isHost ? 'host' : 'guest';
      const otherRole = isHost ? 'guest' : 'host';

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:openrelay.metered.ca:80' },
          { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
          { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
          { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
        ],
      });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        console.log(`[${myRole.toUpperCase()}] Remote track received.`);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[${myRole.toUpperCase()}] ICE connection state:`, pc.iceConnectionState);
        if (['connected', 'completed'].includes(pc.iceConnectionState)) setStatus('Connected');
        else if (['disconnected', 'failed'].includes(pc.iceConnectionState)) setStatus('Connection lost…');
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          console.log(`[${myRole.toUpperCase()}] Found candidate — type: ${e.candidate.type}, protocol: ${e.candidate.protocol}`);
          push(ref(rtdb, `rooms/${code}/candidates/${myRole}`), e.candidate.toJSON());
        } else {
          console.log(`[${myRole.toUpperCase()}] ICE gathering complete.`);
        }
      };

      const candUnsub = onChildAdded(ref(rtdb, `rooms/${code}/candidates/${otherRole}`), (snap) => {
        const candidate = snap.val();
        if (!candidate) return;
        if (pc.remoteDescription) {
          pc.addIceCandidate(candidate).catch((err) => console.log('addIceCandidate error:', err));
        } else {
          console.log(`[${myRole.toUpperCase()}] Remote description not ready yet — queuing candidate.`);
          pendingCandidatesRef.current.push(candidate);
        }
      });
      unsubscribers.push(candUnsub);

      async function flushPendingCandidates() {
        const queued = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];
        for (const candidate of queued) {
          try { await pc.addIceCandidate(candidate); } catch (err) { console.log('addIceCandidate (queued) error:', err); }
        }
      }

      if (isHost) {
        setupDataChannel(pc.createDataChannel('captions'));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await set(ref(rtdb, `rooms/${code}/offer`), { sdp: offer.sdp, type: offer.type });
        setStatus('Waiting for the other person to join…');

        const answerUnsub = onValue(ref(rtdb, `rooms/${code}/answer`), async (snap) => {
          const answer = snap.val();
          if (answer && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(answer);
            await flushPendingCandidates();
          }
        });
        unsubscribers.push(answerUnsub);
      } else {
        pc.ondatachannel = (e) => setupDataChannel(e.channel);
        setStatus('Connecting to host…');

        const offerUnsub = onValue(ref(rtdb, `rooms/${code}/offer`), async (snap) => {
          const offer = snap.val();
          if (offer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(offer);
            await flushPendingCandidates();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await set(ref(rtdb, `rooms/${code}/answer`), { sdp: answer.sdp, type: answer.type });
          }
        });
        unsubscribers.push(offerUnsub);
      }
    }

    start().catch((err) => setError(err.message || 'Something went wrong.'));

    return () => {
      unsubscribers.forEach((unsub) => typeof unsub === 'function' && unsub());
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) { } }
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [code, router]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-gray-200">Back to dashboard</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">Room {code}</span>
          <span className="text-sm text-gray-300">{status}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-black rounded-xl overflow-hidden mb-3">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full aspect-video object-cover [transform:scaleX(-1)]" />
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full aspect-video object-cover bg-gray-900" />
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500">You speak</label>
            <select value={mySpokenLang} onChange={(e) => setMySpokenLang(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">See their captions in</label>
            <select value={myCaptionLang} onChange={(e) => setMyCaptionLang(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 min-h-[100px] mb-3 space-y-1">
          {captions.map((c) => (
            <div key={c.id} className={`text-sm p-2 rounded-md ${c.who === 'mine' ? 'bg-indigo-950 border-l-2 border-indigo-500' : 'bg-amber-950 border-l-2 border-amber-500 text-right'}`}>
              <span className="text-xs text-gray-500 block">{c.tag}</span>
              {c.text}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={toggleCaptions}
            className={`rounded-full px-5 py-2 text-sm font-medium ${captionsOn ? 'bg-indigo-600' : 'bg-gray-800 border border-gray-700'}`}>
            {captionsOn ? 'Stop captioning' : 'Start captioning'}
          </button>
          <button onClick={() => setSpeakOn(!speakOn)}
            className={`rounded-full px-5 py-2 text-sm font-medium ${speakOn ? 'bg-indigo-600' : 'bg-gray-800 border border-gray-700'}`}>
            {speakOn ? 'Reading aloud' : 'Read aloud'}
          </button>
          <button onClick={handleLeave} className="bg-red-600 hover:bg-red-500 rounded-full px-5 py-2 text-sm font-medium">
            Leave
          </button>
        </div>
      </div>
    </main>
  );
}