import { PrimaryNav } from "@/components/PrimaryNav";
import { notFound } from "next/navigation";

export default async function SampleReportIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // You can fetch data here using id
  // For now, just show a placeholder or 404
  if (!id) {
    notFound();
  }

  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      <PrimaryNav />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Sample Report: {id}</h1>
        <p>This is a dynamic sample report page for ID: <b>{id}</b>.</p>
      </main>
    </div>
  );
}
