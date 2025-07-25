import saveIcon from "./assets/images/saveIcon.svg";
import emailIcon from "./assets/images/emailIcon.svg";
import outboundLinkArrow from "./assets/images/outboundLinkArrow.svg";

export default function LoopCard() {
  return (
    <section class="my-4 mx-8 p-4 border border-gray-400 rounded-md w-165">
      <div class="mb-9">
        <h2 class="font-bold text-2xl mt-1">
          2024 Longtime Owner Occupants Program (LOOP)
        </h2>
        <p class="text-gray-500">Philadelphia Department of Revenue</p>
      </div>
      <h3 class="font-bold mt-6">Overview</h3>
      <p>
        The Longtime Owner Occupants Program (LOOP) is a Real Estate Tax relief
        program for eligible homeowners whose property assessments increased by
        at least 50% from last year or increased by at least 75% in the last
        five years.{" "}
        <a
          href="https://www.phila.gov/services/payments-assistance-taxes/payment-plans-and-assistance-programs/income-based-programs-for-residents/apply-for-the-longtime-owner-occupants-program-loop/"
          target="_blank"
          class="text-sky-700 underline"
        >
          <span>more information</span>
          <img src={outboundLinkArrow} alt="" class="inline w-4 ml-1 pb-1" />
        </a>
      </p>
      <h3 class="font-bold mt-6">Benefit Amount</h3>
      <p>
        Visit{" "}
        <a
          href="https://property.phila.gov/"
          target="_blank"
          class="text-sky-700 underline"
        >
          https://property.phila.gov/
        </a>{" "}
        and enter your address to see your estimated property tax bill savings
        under this benefit.
      </p>
      <h3 class="font-bold mt-6">Application Deadline</h3>
      <p>09/30/2025</p>
      <h3 class="font-bold mt-6">Application Process</h3>
      <p>Mail PDF or apply online at tax-services.phila.gov.</p>
      <h3 class="font-bold mt-6">Contact</h3>
      <p>Call the Philadelphia Department of Revenue at 215-686-9200</p>
      <div class="flex gap-9 mt-6 items-center">
        <button class="flex flex-col items-center text-sky-700 cursor-pointer">
          <img src={saveIcon} alt="" class="w-5 h-5" />
          <p>save</p>
        </button>
        <button class="flex flex-col items-center text-sky-700 cursor-pointer">
          <img src={emailIcon} alt="" class="w-5 h-5" />
          <p>email</p>
        </button>
        <a
          href="https://www.phila.gov/documents/longtime-owner-occupants-program-loop-forms/"
          target="_blank"
        >
          <button class="border-2 pt-3 pb-3 pr-6 pl-6 rounded-lg border-sky-700 text-sky-700 font-bold cursor-pointer">
            <p>Download Application PDF</p>
          </button>
        </a>
        <a
          href="https://www.phila.gov/services/payments-assistance-taxes/payment-plans-and-assistance-programs/income-based-programs-for-residents/apply-for-the-longtime-owner-occupants-program-loop/"
          target="_blank"
        >
          <button class="border-2 pt-3 pb-3 pr-6 pl-6 rounded-lg border-sky-700 text-white bg-sky-700 font-bold cursor-pointer">
            <p>Apply Online</p>
          </button>
        </a>
      </div>
    </section>
  );
}
