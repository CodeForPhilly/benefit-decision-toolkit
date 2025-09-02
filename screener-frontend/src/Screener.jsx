import { createSignal, createResource, ErrorBoundary } from "solid-js";
import { useParams } from "@solidjs/router";
import FormRenderer from "./FormRenderer";
import { fetchScreenerData, getDecisionResult } from "./api/api";
import Loading from "./Loading";
import ErrorPage from "./Error";
import EligibilityResults from "./EligibilityResults";

export default function Screener() {
  const params = useParams();

  const [data] = createResource(() => fetchScreenerData(params.screenerId));
  const [results, setResults] = createSignal();

  const submitForm = async (data) => {
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
          {data.loading && <Loading></Loading>}
          {data() && (
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 overflow-y-auto p-4">
                <FormRenderer
                  schema={data().formSchema}
                  submitForm={submitForm}
                ></FormRenderer>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <EligibilityResults results={results}></EligibilityResults>
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </>
  );
}
