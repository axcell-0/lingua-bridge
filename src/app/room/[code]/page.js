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
const REACTIONS = ['👍', '❤️', '😂', '😮', '👏'];
const langName = (code) => LANGS.find((l) => l.code === code)?.name || code;
const langSpeech = (code) => LANGS.find((l) => l.code === code)?.speech || 'en-US';

// Stops a SpeechRecognition instance WITHOUT letting its onend handler
// restart it — the ref must be cleared first, or onend sees it's still
// set and calls .start() again right after .stop() fires.
function stopRecognition(recognitionRef) {
  const rec = recognitionRef.current;
  recognitionRef.current = null;
  if (rec) { try { rec.stop(); } catch (e) {} }
}

export default function RoomPage() {
  const { code } = useParams();
  const router = useRouter();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const recognitionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [status, setStatus] = useState('Setting up…');
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [hearOriginal, setHearOriginal] = useState(true);
  const [mySpokenLang, setMySpokenLang] = useState('en');
  const [myCaptionLang, setMyCaptionLang] = useState('fr');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState([]);

  const mySpokenLangRef = useRef(mySpokenLang);
  const myCaptionLangRef = useRef(myCaptionLang);
  const remoteCaptionLangRef = useRef(null);
  const speakOnRef = useRef(speakOn);

  useEffect(() => { mySpokenLangRef.current = mySpokenLang; }, [mySpokenLang]);
  useEffect(() => { myCaptionLangRef.current = myCaptionLang; }, [myCaptionLang]);
  useEffect(() => { speakOnRef.current = speakOn; }, [speakOn]);
  useEffect(() => { sendMeta(); }, [mySpokenLang, myCaptionLang]);
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.muted = !hearOriginal;
  }, [hearOriginal]);

  function sendMeta() {
    const ch = dataChannelRef.current;
    if (ch && ch.readyState === 'open') {
      ch.send(JSON.stringify({ type: 'meta', spokenLang: mySpokenLangRef.current, captionLang: myCaptionLangRef.current }));
    }
  }

  function setupDataChannel(channel) {
    dataChannelRef.current = channel;
    channel.onopen = () => sendMeta();
    channel.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'meta') {
        remoteCaptionLangRef.current = msg.captionLang;
      } else if (msg.type === 'caption') {
        addCaption('theirs', msg.translated, `${langName(msg.sourceLang)} → ${langName(myCaptionLangRef.current)}`);
        if (speakOnRef.current) speak(msg.translated, myCaptionLangRef.current);
      } else if (msg.type === 'chat') {
        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), from: 'theirs', text: msg.text }]);
      } else if (msg.type === 'reaction') {
        showReaction('theirs', msg.emoji);
      } else if (msg.type === 'force-mute') {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) track.enabled = false;
        setMicOn(false);
      }
    };
  }

  function addCaption(who, text, tag) {
    setCaptions((prev) => [...prev.slice(-5), { who, text, tag, id: Date.now() + Math.random() }]);
  }

  function speak(text, langCode) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langSpeech(langCode);
    window.speechSynthesis.speak(utter);
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    const ch = dataChannelRef.current;
    if (ch && ch.readyState === 'open') ch.send(JSON.stringify({ type: 'chat', text }));
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), from: 'mine', text }]);
    setChatInput('');
  }

  function showReaction(side, emoji) {
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji, side }]);
    setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)), 1800);
  }

  function sendReaction(emoji) {
    const ch = dataChannelRef.current;
    if (ch && ch.readyState === 'open') ch.send(JSON.stringify({ type: 'reaction', emoji }));
    showReaction('mine', emoji);
  }

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }

  function muteOtherParticipant() {
    const ch = dataChannelRef.current;
    if (ch && ch.readyState === 'open') ch.send(JSON.stringify({ type: 'force-mute' }));
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
        if (recognitionRef.current) { try { recognition.start(); } catch (e) {} }
      };
      recognitionRef.current = recognition;
      recognition.start();
      setCaptionsOn(true);
    } else {
      stopRecognition(recognitionRef);
      setCaptionsOn(false);
    }
  }

  function handleLeave() {
    fetch(`/api/rooms/${code}/end`, { method: 'POST' }).catch(() => {});
    stopRecognition(recognitionRef);
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
      const hostFlag = room.host === user._id;
      setIsHost(hostFlag);
      const myRole = hostFlag ? 'host' : 'guest';
      const otherRole = hostFlag ? 'guest' : 'host';

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
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
          remoteVideoRef.current.muted = !hearOriginal;
        }
      };
      pc.oniceconnectionstatechange = () => {
        if (['connected', 'completed'].includes(pc.iceConnectionState)) setStatus('Connected');
        else if (['disconnected', 'failed'].includes(pc.iceConnectionState)) setStatus('Connection lost…');
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) push(ref(rtdb, `rooms/${code}/candidates/${myRole}`), e.candidate.toJSON());
      };

      const candUnsub = onChildAdded(ref(rtdb, `rooms/${code}/candidates/${otherRole}`), (snap) => {
        const candidate = snap.val();
        if (!candidate) return;
        if (pc.remoteDescription) {
          pc.addIceCandidate(candidate).catch(() => {});
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      });
      unsubscribers.push(candUnsub);

      async function flushPendingCandidates() {
        const queued = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];
        for (const candidate of queued) {
          try { await pc.addIceCandidate(candidate); } catch (e) {}
        }
      }

      if (hostFlag) {
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
      stopRecognition(recognitionRef);
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [code, router]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={() => router.push('/')} className="text-sm text-slate-500 hover:text-slate-800">Back to dashboard</button>
      </main>
    );
  }

  const lastMine = [...captions].reverse().find((c) => c.who === 'mine');
  const lastTheirs = [...captions].reverse().find((c) => c.who === 'theirs');

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-5 flex flex-col gap-5">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Translation Setup</h1>
          <p className="text-xs text-slate-500">Configure live audio sync</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">You speak</label>
            <select value={mySpokenLang} onChange={(e) => setMySpokenLang(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900 mt-1">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">See their captions in</label>
            <select value={myCaptionLang} onChange={(e) => setMyCaptionLang(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900 mt-1">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="flex items-center justify-between text-sm text-slate-700">
            Hear their original voice
            <input type="checkbox" checked={hearOriginal} onChange={(e) => setHearOriginal(e.target.checked)} className="accent-teal-600" />
          </label>
          <label className="flex items-center justify-between text-sm text-slate-700">
            Read translated captions aloud
            <input type="checkbox" checked={speakOn} onChange={(e) => setSpeakOn(e.target.checked)} className="accent-teal-600" />
          </label>
          {!hearOriginal && !speakOn && (
            <p className="text-xs text-amber-600">You won't hear any audio with both of these off.</p>
          )}
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Live transcript</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-64 md:max-h-none">
            {captions.map((c) => (
              <div key={c.id} className={`rounded-lg p-2 text-sm ${c.who === 'mine' ? 'bg-teal-50 border border-teal-100 text-slate-800' : 'bg-slate-50 border border-slate-200 text-slate-800'}`}>
                <span className="text-[10px] uppercase text-slate-400 block">{c.tag}</span>
                {c.text}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleLeave} className="bg-slate-900 hover:bg-black text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
          Leave meeting
        </button>
      </aside>

      <section className="flex-1 flex flex-col p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">Room <span className="font-mono text-slate-900">{code}</span></span>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${status === 'Connected' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'}`}>
            {status}
          </span>
        </div>

        <div className="relative flex-1 grid grid-cols-2 gap-2 bg-black rounded-2xl overflow-hidden mb-4 min-h-80">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform:scaleX(-1)" />
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-gray-900" />

          {!micOn && (
            <span className="absolute top-3 left-3 bg-red-600/90 text-white text-xs px-2 py-1 rounded-full">
              Mic off
            </span>
          )}

          {(lastMine || lastTheirs) && (
            <div className="absolute left-4 right-4 bottom-4 bg-black/70 backdrop-blur rounded-xl p-3 text-sm text-white space-y-1">
              {lastMine && <p><span className="text-teal-300 text-xs uppercase mr-2">Me</span>{lastMine.text}</p>}
              {lastTheirs && <p><span className="text-amber-300 text-xs uppercase mr-2">Them</span>{lastTheirs.text}</p>}
            </div>
          )}

          {floatingReactions.map((r) => (
            <span key={r.id} className={`absolute bottom-3 text-3xl animate-bounce pointer-events-none ${r.side === 'mine' ? 'left-3' : 'right-3'}`}>
              {r.emoji}
            </span>
          ))}
        </div>

        <div className="flex gap-2 justify-center mb-3">
          {REACTIONS.map((emoji) => (
            <button key={emoji} onClick={() => sendReaction(emoji)}
              className="text-xl bg-white border border-slate-200 shadow-sm rounded-full w-10 h-10 hover:bg-slate-50">
              {emoji}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4">
          <div className="max-h-28 overflow-y-auto space-y-1 mb-2">
            {messages.map((m) => (
              <div key={m.id} className={`text-sm px-2 py-1 rounded-md max-w-[75%] ${m.from === 'mine' ? 'bg-teal-50 ml-auto text-right text-slate-800' : 'bg-slate-100 text-slate-800'}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Type a message…"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
            />
            <button onClick={sendChat} className="bg-teal-600 hover:bg-teal-500 text-white rounded-lg px-4 text-sm font-medium transition-colors">
              Send
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <button onClick={toggleMic}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${micOn ? 'bg-white border border-slate-200 text-slate-700' : 'bg-red-600 text-white'}`}>
            {micOn ? 'Mute mic' : 'Unmute mic'}
          </button>
          <button onClick={toggleCaptions}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${captionsOn ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
            {captionsOn ? 'Stop captioning' : 'Start captioning'}
          </button>
          {isHost && (
            <button onClick={muteOtherParticipant}
              className="rounded-full px-5 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              Mute participant
            </button>
          )}
        </div>
      </section>
    </main>
  );
}