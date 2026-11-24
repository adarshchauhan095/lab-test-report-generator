export function LoadingSpinner({ message = 'Loading records...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="w-9 h-9 border-3 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
      <p className="mt-3 text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
}
