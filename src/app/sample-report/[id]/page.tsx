import { PrimaryNav } from "@/components/PrimaryNav";
import { notFound } from "next/navigation";

export default function SampleReportIdPage({ params }: { params: { id: string } }) {
  // You can fetch data here using params.id
  // For now, just show a placeholder or 404
  if (!params.id) {
    notFound();
  }

  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      <PrimaryNav />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Sample Report: {params.id}</h1>
        <p>This is a dynamic sample report page for ID: <b>{params.id}</b>.</p>
      </main>
    </div>
  );
}
