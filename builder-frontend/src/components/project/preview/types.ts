/* Screener Evaluation Results */
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

/* Form Data for Preview */
export interface PreviewFormData {
  [key: string]: any;
}
