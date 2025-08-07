export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col gap-8 justify-center items-center">
        <div className="text-2xl">Loading ...</div>
        <div class="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
