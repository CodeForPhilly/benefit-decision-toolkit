<script>
  import { quadOut } from "svelte/easing";
  import { fade } from "svelte/transition";
  import menuIcon from "../assets/icons/menu-open.svg?url";
  import closeIcon from "../assets/icons/menu-close.svg?url";
  const headerLinks = [
    {
      title: "Home",
      path: "/#top",
    },
    {
      title: "About",
      path: "/about",
    },
    {
      title: "Contact",
      path: "/#contact",
    },
  ];
  let menuActive = $state(false);
  function toggleMenu() {
    menuActive = !menuActive;
  }
</script>

<nav class="hidden md:block">
  <ul class="flex gap-6 text-lg">
    {#each headerLinks as link}
      <li>
        <a class="text-white font-bold" href={link.path}>
          {link.title}
        </a>
      </li>
    {/each}
  </ul>
</nav>
{#if menuActive == false}
  <button
    class="md:hidden self-center p-2"
    transition:fade={{ duration: 180, easing: quadOut }}
    onclick={toggleMenu}
    aria-label="Open navigation menu"
    aria-controls="navMenu"
    aria-expanded={menuActive}
  >
    <img class="w-6 h-6" src={menuIcon} alt="" />
  </button>
{/if}
{#if menuActive == true}
  <div
    id="navMenu"
    class="fixed left-0 top-0 h-screen w-screen flex justify-center items-center bg-linear-to-br from-bdt-blue to-bdt-gradient z-10"
    transition:fade={{ duration: 180, easing: quadOut }}
  >
    <button
      class="fixed top-9 right-6 p-2"
      onclick={toggleMenu}
      aria-label="Close navigation menu"
      aria-controls="navMenu"
      aria-expanded={menuActive}
    >
      <img class="w-6 h-6" src={closeIcon} alt="" />
    </button>
    <ul class="w-fit h-fit flex flex-col gap-4 items-center">
      {#each headerLinks as link}
        <li>
          <a
            class="text-white text-3xl font-serif"
            href={link.path}
            onclick={toggleMenu}
          >
            {link.title}
          </a>
        </li>
      {/each}
    </ul>
  </div>
{/if}
