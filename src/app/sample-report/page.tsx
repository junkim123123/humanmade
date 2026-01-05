import { PrimaryNav } from "@/components/PrimaryNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, ArrowRight, UploadCloud, BarChart2, DollarSign, FileText, Ship } from "lucide-react";

export default function SampleReportPage() {
  return (
    <div className="bg-gray-50 font-sans">
      <PrimaryNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Fruit Gummies Variety Pack (12 count)
            </h1>
            <p className="text-md text-green-600 font-semibold flex items-center gap-2 mt-1">
              <CheckCircle size={18} />
              Proof found 6 signals
            </p>
          </div>
          <Button size="lg">
            Draft buy plan <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* High-Impact Optimization */}
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <CardHeader>
                <CardTitle>Optimize Sourcing & Unlock Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">
                  Leverage NexSupply's internal network data to find factories with 15-20% higher margins than public data matches.
                </p>
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30">
                  Unlock Blueprint
                </Button>
              </CardContent>
            </Card>

            {/* Public Trade Data Matches */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Public Trade Data Matches</h2>
              <p className="text-gray-600 mb-6">Initial discovery based on general export records. Not yet optimized for NexSupply network.</p>
              <div className="space-y-6">
                <SupplierCard 
                  name="Shanghai Confectionery Co., Ltd."
                  details="45 related items • 78% price coverage"
                  intel="Our network indicates 4 alternative manufacturers..."
                />
                <SupplierCard 
                  name="Guangzhou Sweet Manufacturing"
                  details="28 related items • 65% price coverage"
                  intel="Our network indicates 4 alternative manufacturers..."
                />
                <SupplierCard 
                  name="Shenzhen Candy Factory"
                  details="15 related items • 45% price coverage"
                  intel="Our network indicates 4 alternative manufacturers..."
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Decision Summary */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Decision Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Initial Intelligence Draft. Our Research Engine will now apply proprietary data design to find the absolute floor price among verified partners.
                </p>
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="text-3xl font-bold text-gray-900">$1.77 <span className="text-lg font-normal">per unit</span></p>
                  <p className="text-sm text-gray-600">Uncertainty Range: $1.77 – $2.32</p>
                </div>
                <div className="space-y-3">
                  <EvidenceItem text="Unit weight confirmed" status="success" />
                  <EvidenceItem text="Critical: Origin missing" status="warning" />
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <UploadCloud size={16} className="mr-2" />
                  Upload missing photos
                </Button>
              </CardContent>
            </Card>

            {/* Customs Category */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Customs Category</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-gray-800">Sugar confectionery (including white chocolate), not containing cocoa</p>
                <div className="my-4">
                  <CodeCandidate code="1704.90" recommended />
                  <CodeCandidate code="1901.90" />
                </div>
                <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                  <span className="font-semibold">Duty estimate range</span>
                  <span className="font-bold text-lg">8.5% – 9.5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper Components
const SupplierCard = ({ name, details, intel }: { name: string, details: string, intel: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{name}</CardTitle>
      <p className="text-sm text-gray-500">{details}</p>
    </CardHeader>
    <CardContent>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
        <h4 className="font-semibold text-yellow-800">NexSupply Intel Potential</h4>
        <p className="text-sm text-yellow-700">{intel}</p>
      </div>
    </CardContent>
  </Card>
);

const EvidenceItem = ({ text, status }: { text: string, status: 'success' | 'warning' }) => (
  <div className="flex items-center gap-2">
    {status === 'success' ? <CheckCircle size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-yellow-500" />}
    <span className={`text-sm ${status === 'success' ? 'text-gray-700' : 'text-yellow-700 font-semibold'}`}>{text}</span>
  </div>
);

const CodeCandidate = ({ code, recommended }: { code: string, recommended?: boolean }) => (
  <div className={`flex justify-between items-center p-2 rounded ${recommended ? 'bg-blue-50' : ''}`}>
    <span className={`font-mono text-sm ${recommended ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>{code}</span>
    {recommended && <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Recommended</span>}
  </div>
);
