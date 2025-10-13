import { useParams } from "@solidjs/router";

import Header from "../Header";


const EligibilityCheckDetail = () => {
  const { checkId } = useParams();
  return (
    <div>
      <Header/>
      <div>Eligibility Check Detail: {checkId}</div>
    </div>
  );
};
export default EligibilityCheckDetail;
