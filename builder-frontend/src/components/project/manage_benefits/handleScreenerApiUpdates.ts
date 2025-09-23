import { createEffect } from "solid-js";
import { trackDeep } from "@solid-primitives/deep";

import { updateScreenerBenefits } from "../../../api/fake_screener_update";

import type { ProjectBenefits as ProjectBenefitsType, Benefit } from "./types";


/* 
 * Handles sending API updates when projectBenefits changes.
 * If a change occurs while an API call is pending, it stores the latest change
 * and sends it once the current call completes.
 */
export const handleScreenerApiUpdates = (screenerId: string, projectBenefits: ProjectBenefitsType) => {
  let blockDataUpdates: boolean = false;
  let latestData: Benefit[] = null;

  async function sendApiUpdate(screenerId: string, benefits: Benefit[]) {
    blockDataUpdates = true;
    try {
      await updateScreenerBenefits(screenerId, benefits);
    } finally {
      blockDataUpdates = false;
      if (latestData) {
        // call API with the most recent data that did not send
        const benefitDataToSend = latestData;
        latestData = null;
        await updateScreenerBenefits(screenerId, benefitDataToSend);
      }
    }
  }

  createEffect(() => {
    trackDeep(projectBenefits);

    if (blockDataUpdates) {
      // Change detected during pending API call, store latest change
      latestData = projectBenefits.benefits; // remember latest benefit data
    } else {
      // Change detected without API being blocked, send API call
      sendApiUpdate(screenerId, projectBenefits.benefits);
    }
  });
}
