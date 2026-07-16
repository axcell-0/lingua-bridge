import { FaGithub, FaGoogle } from "react-icons/fa";

export default function OAuthButtons() {
  return (
    <div className="space-y-2">
      <a href="/api/auth/google" className="flex items-center justify-center w-full border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
        <FaGoogle size={24}/>
      </a>
      <a href="/api/auth/github" className="flex items-center justify-center w-full border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
        <FaGithub size={24}/>
      </a>
    </div>
  );
}