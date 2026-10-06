import EditorNavigation from "@/components/shared/EditorNavigation";
import { createSignal, createResource, Accessor } from "solid-js";
import { A, useParams } from "@solidjs/router";

import FormEditorView from "./FormEditorView";
import Loading from "../Loading";
import ManageBenefits from "./manageBenefits/ManageBenefits";
import Preview from "./preview/Preview";
import Publish from "./Publish";

import { fetchScreener } from "@/api/screener";
import { NavbarProps } from "@/components/shared/BdtNavbar";
import { Title } from "@solidjs/meta";

type TabOption = "manageBenefits" | "formEditor" | "preview" | "publish";

function ScreenerEditor() {
  const params = useParams();

  const [activeTab, setActiveTab] = createSignal<TabOption>("manageBenefits");
  // Kept here rather than in ManageBenefits so that selecting the Manage
  // Benefits section also returns from Configure Benefit to the list.
  const [benefitIdToConfigure, setBenefitIdToConfigure] = createSignal<
    string | null
  >(null);
  const [formSchema, setFormSchema] = createSignal();
  const [forceUpdate, setForceUpdate] = createSignal(0);

  const fetchAndCacheScreener = async (keys) => {
    const screenerData = await fetchScreener(keys[0]);
    setFormSchema(screenerData.formSchema);
    return screenerData;
  };

  const [screener] = createResource(
    // Using resrouce to more easily track states during refetch
    // However resources only refetch when key has changed.
    // In order to force refetch even thought he screenerId hasn't change,
    // including a dummy signal 'forceUpdate' that can be unique for
    // each call to the refetch
    () => [params.screenerId, forceUpdate()],
    fetchAndCacheScreener,
  );

  // `latest` keeps the loaded screener during refetches; reading it after a
  // failed load would throw, so check the error first.
  const screenerLabel = () => {
    if (screener.error) return "Screener unavailable";
    return screener.latest?.screenerName ?? "Loading screener…";
  };

  const navbarDefs: Accessor<NavbarProps> = () => {
    return {
      tabDefs: [
        {
          key: "manageBenefits",
          label: "Manage Benefits",
          onClick: () => {
            setActiveTab("manageBenefits");
            setBenefitIdToConfigure(null);
          },
        },
        {
          key: "formEditor",
          label: "Form Editor",
          onClick: () => setActiveTab("formEditor"),
        },
        {
          key: "preview",
          label: "Preview",
          onClick: () => setActiveTab("preview"),
        },
        {
          key: "publish",
          label: "Publish",
          onClick: () => setActiveTab("publish"),
        },
      ],
      activeTabKey: () => activeTab(),
    };
  };

  return (
    <div class="h-screen flex flex-col">
      <EditorNavigation
        navProps={screener.loading || screener.error ? undefined : navbarDefs}
        items={[
          { label: "Screeners", href: "/screeners" },
          { label: screenerLabel() },
        ]}
      />
      {screener.error ? (
        <div role="alert" class="m-6 rounded-lg border border-gray-300 p-6">
          <h1 class="text-xl font-bold">Unable to load this screener</h1>
          <p class="mt-2">
            The screener may no longer exist, or the service may be unavailable.
          </p>
          <div class="mt-4 flex gap-4">
            <A href="/screeners" class="text-blue-600 underline">
              Back to screeners
            </A>
            <button
              type="button"
              class="text-blue-600 underline"
              onClick={() => setForceUpdate((prev) => prev + 1)}
            >
              Try again
            </button>
          </div>
        </div>
      ) : screener.loading ? (
        <Loading />
      ) : (
        <>
          <Title>BDT - {screener().screenerName}</Title>
          {activeTab() == "formEditor" && (
            <FormEditorView
              formSchema={formSchema}
              setFormSchema={setFormSchema}
            />
          )}
          {activeTab() == "manageBenefits" && (
            <ManageBenefits
              benefitIdToConfigure={benefitIdToConfigure}
              setBenefitIdToConfigure={setBenefitIdToConfigure}
            />
          )}
          {activeTab() == "preview" && (
            <Preview screener={screener} formSchema={formSchema} />
          )}
          {activeTab() == "publish" && (
            <Publish
              screener={screener}
              refetchScreener={() => setForceUpdate((prev) => prev + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default ScreenerEditor;
