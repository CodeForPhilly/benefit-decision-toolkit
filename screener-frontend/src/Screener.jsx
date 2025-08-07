import { createSignal, createResource, ErrorBoundary } from "solid-js";
import { useParams } from "@solidjs/router";
import FormRenderer from "./FormRenderer";
import Results from "./Results";
import { fetchScreenerData, getDecisionResult } from "./api/api";
import Loading from "./Loading";
import ErrorPage from "./Error";
import testData from "./testData";

export default function Screener() {
  const params = useParams();

  const [data] = createResource(() => fetchScreenerData(params.screenerId));
  const [results, setResults] = createSignal();

  const submitForm = async (data) => {
    try {
      let results = await getDecisionResult(params.screenerId, data);
      setResults(results);
      console.log(results);
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
            <>
              <FormRenderer
                schema={data().formSchema}
                submitForm={submitForm}
              ></FormRenderer>
              <div className="pt-4">
                <Results results={results}></Results>
              </div>
            </>
          )}
        </ErrorBoundary>
      </div>
    </>
  );
}
