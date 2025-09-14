export default function ErrorPage({ error }: { error: any }) {
  console.log(error);
  return (
    <div class="py-24 flex-col justify-center h-screen items-center">
      <h1 class="text-center text-xl">
        Sorry, there was an error loading the requested screener.
      </h1>
    </div>
  );
}
