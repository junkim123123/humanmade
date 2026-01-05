import { redirect } from "next/navigation";

export default function SampleReportPage() {
  redirect("/reports/sample-report/v2");
  return null;
}
