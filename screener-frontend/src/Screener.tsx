import { createSignal, createResource, ErrorBoundary } from "solid-js";
import { useParams } from "@solidjs/router";

import FormRenderer from "./FormRenderer";
import Loading from "./Loading";
import ErrorPage from "./Error";
import EligibilityResults from "./EligibilityResults";

import { fetchScreenerData, getDecisionResult } from "./api/api";

import type { ResultDetail, Screener } from "./api/types";

export default function Screener() {
  const params = useParams();

  const [screener] = createResource<Screener>(() => fetchScreenerData(params.screenerId));
  const [results, setResults] = createSignal<ResultDetail[]>();

  const submitForm = async (data: any) => {
    try {
      let results = await getDecisionResult(params.screenerId, data);
      setResults(results);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div class="mt-4">
        <ErrorBoundary
          fallback={(error, reset) => <ErrorPage error={error}></ErrorPage>}
        >
          {screener.loading && <Loading></Loading>}
          {screener() && (
            <div class="flex flex-col lg:flex-row">
              <div class="flex-1 overflow-y-auto p-4">
                <FormRenderer
                  schema={screener()?.formSchema || {}}
                  submitForm={submitForm}
                ></FormRenderer>
              </div>

              <div class="flex-1 overflow-y-auto p-4">
                <EligibilityResults results={results}></EligibilityResults>
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </>
  );
}
