<script>
  import { quadOut } from "svelte/easing";
  import navLinks from "../data/navLinks";
  import { fade } from "svelte/transition";
  let menuActive = $state(false);
  function toggleMenu() {
    menuActive = !menuActive;
  }
</script>

<nav class="hidden md:block">
  <ul class="flex gap-6 text-lg">
    {#each navLinks as link}
      <li>
        <a
          class="text-white font-bold"
          href={`${import.meta.env.BASE_URL}${link.path}`}
        >
          {link.title}
        </a>
      </li>
    {/each}
  </ul>
</nav>
<button
  class="md:hidden self-center text-white font-bold border-2 border-white rounded-lg px-2 py-1"
  onclick={toggleMenu}
  aria-label={menuActive ? "Close navigation menu" : "Open navigation menu"}
  aria-controls="navMenu"
  aria-expanded={menuActive}>Menu</button
>
{#if menuActive == true}
  <div
    id="navMenu"
    class="fixed left-0 top-0 h-screen w-screen flex justify-center items-center bg-bdt-blue"
    transition:fade={{ duration: 180, easing: quadOut }}
  >
    <button
      class="fixed top-9.5 right-6 text-white font-bold border-2 border-white rounded-lg px-2 py-1"
      onclick={toggleMenu}
      aria-label={menuActive ? "Close navigation menu" : "Open navigation menu"}
      aria-controls="navMenu"
      aria-expanded={menuActive}>Close</button
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
