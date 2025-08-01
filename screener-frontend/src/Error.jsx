export default function ErrorPage({ error }) {
  console.log(error);
  return (
    <div className="py-24 flex-col justify-center h-screen items-center">
      <h1 class="text-center text-xl">
        Sorry, there was an error loading the requested screener.
      </h1>
    </div>
  );
}
