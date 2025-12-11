<script>
  import navLinks from "../data/navLinks";
  let menuActive = $state(false);
  function toggleMenu() {
    menuActive = !menuActive;
  }
</script>

<nav class="hidden sm:block">
  <ul class="flex gap-4">
    {#each navLinks as link}
      <li>
        <a class="text-white" href={`${import.meta.env.BASE_URL}${link.path}`}>
          {link.title}
        </a>
      </li>
    {/each}
  </ul>
</nav>
<button
  class="sm:hidden self-center text-white border border-white rounded-lg px-2 py-1"
  onclick={toggleMenu}>Menu</button
>
{#if menuActive == true}
  <div
    class="fixed left-0 top-0 h-screen w-screen flex justify-center items-center bg-sky-500"
  >
    <button
      class="fixed top-10 right-3 text-white border border-white rounded-lg px-2 py-1"
      onclick={toggleMenu}>Close</button
    >
    <ul class="w-fit h-fit flex flex-col gap-4 items-center">
      {#each navLinks as link}
        <li>
          <a
            class="text-white text-3xl font-bold font-serif"
            href={`${import.meta.env.BASE_URL}${link.path}`}
            onclick={toggleMenu}
          >
            {link.title}
          </a>
        </li>
      {/each}
    </ul>
  </div>
{/if}
