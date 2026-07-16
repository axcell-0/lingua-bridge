export default function Avatar({ name }) {
  const initial = name?.trim()?.[0]?.toUpperCase() || '?';
  return (
    <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-medium flex items-center justify-center">
      {initial}
    </div>
  );
}