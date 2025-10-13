export interface ScreenerResult {
  [key: string]: BenefitResult
}
interface BenefitResult {
  name: string;
  result: OptionalBoolean;
  check_results: {
    [key: string]: CheckResult;
  }
}
interface CheckResult {
  name: string;
  result: OptionalBoolean;
}

type OptionalBoolean = "TRUE" | "FALSE" | "UNABLE_TO_DETERMINE";

export interface FormData {
  [key: string]: any;
}
