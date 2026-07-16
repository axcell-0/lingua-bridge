export default function WelcomePanel() {
  return (
    <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-16">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="#2dd4bf" strokeWidth="2" />
            <path d="M10 13c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2h-1l-2 2v-2h-1c-1.1 0-2-.9-2-2v-3z" fill="#2dd4bf" />
            <path d="M14 19c0 1.1.9 2 2 2h1l2 2v-2h1c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2" stroke="#2dd4bf" strokeWidth="1.4" fill="none" />
          </svg>
          <span className="text-lg font-semibold">
            Lingua<span className="text-teal-400">Bridge</span>
          </span>
        </div>

        <h1 className="text-3xl font-semibold leading-tight mb-4">
          Meet across languages,<br />live.
        </h1>
        <p className="text-slate-300 text-sm max-w-sm">
          Real-time video calls with live speech translation — talk naturally,
          and let the other person read (or hear) it in their own language.
        </p>
      </div>

      <div className="relative z-10 space-y-4">
        <Feature
          icon={<path d="M15 10l5-3v10l-5-3M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" stroke="#2dd4bf" strokeWidth="1.6" />}
          title="Real peer-to-peer video"
          text="Low-latency calls, no middleman servers."
        />
        <Feature
          icon={<path d="M4 6h16M4 12h10M4 18h16" stroke="#2dd4bf" strokeWidth="1.6" strokeLinecap="round" />}
          title="Live translated captions"
          text="Speak naturally, read it in their language."
        />
        <Feature
          icon={<path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" stroke="#2dd4bf" strokeWidth="1.6" />}
          title="Private by design"
          text="Verified accounts, rooms only you can join."
        />
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">{icon}</svg>
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-slate-400">{text}</p>
      </div>
    </div>
  );
}