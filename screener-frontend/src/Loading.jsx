export default function Loading() {
  return (
    <div className="py-24 flex-col justify-center h-screen items-center">
      <h1 class="text-center text-xl">Loading Screener</h1>
      <div class="mt-8 flex items-center justify-center h-20">
        <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
