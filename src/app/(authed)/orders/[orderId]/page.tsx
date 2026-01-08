import { getOrderDetail, sendOrderMessage, addOrderUpload } from '@/server/actions/orders'
import { revalidatePath } from 'next/cache'
import { formatDistanceToNow } from 'date-fns'
import { 
  Clock, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Upload, 
  Plus, 
  Zap,
  ShieldCheck,
  TrendingDown,
  MessageCircle,
  History,
  Info,
  ChevronRight,
  Target,
  BarChart3
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function handleUserMessage(formData: FormData) {
  'use server'
  const orderId = String(formData.get('orderId') || '')
  const body = String(formData.get('body') || '')
  if (!orderId || !body.trim()) return
  await sendOrderMessage(orderId, body, 'user')
  revalidatePath(`/app/orders/${orderId}`)
}

async function handleUserUpload(formData: FormData) {
  'use server'
  const orderId = String(formData.get('orderId') || '')
  const title = String(formData.get('title') || '')
  const fileUrl = String(formData.get('fileUrl') || '')
  const description = String(formData.get('description') || '') || null
  const type = String(formData.get('type') || '')
  if (!orderId || !title.trim()) return
  await addOrderUpload(orderId, { title, fileUrl, description, type })
  revalidatePath(`/app/orders/${orderId}`)
}

export default async function UserOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const result = await getOrderDetail(orderId)
  if (!result.success || !result.order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-700">
        <div className="text-center">
          <p className="text-xl font-bold">Order not found.</p>
          <Link href="/app/reports" className="text-blue-600 hover:underline mt-4 inline-block">Back to Reports</Link>
        </div>
      </div>
    )
  }

  const { order, messages = [], uploads = [], events = [], quotes = [] } = result
  const report = order.report
  
  // Potential Annual Savings calculation (Conservative Landed Cost - Standard Landed Cost) * 10k units
  const conservativeLanded = report?.baseline?.costRange?.conservative?.totalLandedCost || 0
  const standardLanded = report?.baseline?.costRange?.standard?.totalLandedCost || 0
  const annualQuantity = order.quantity || 10000
  const potentialSavings = (conservativeLanded - standardLanded) * annualQuantity

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  // Timeline Logic
  const steps = [
    { id: 'created', label: 'Project Initiated', description: 'Agent assigned & requirements locked', status: 'completed' },
    { id: 'sourcing', label: 'Supplier Outreach', description: 'Cross-referencing verified factories', status: order.status === 'awaiting_contact' ? 'current' : 'completed', time: '24-48h' },
    { id: 'negotiation', label: 'Quotation & Negotiation', description: 'Gathering final FOB & Lead times', status: ['contacted', 'meeting_scheduled'].includes(order.status) ? 'current' : (['awaiting_contact'].includes(order.status) ? 'upcoming' : 'completed') },
    { id: 'finalization', label: 'Verification Complete', description: 'Handover of 3 verified quotes', status: ['closed', 'delivered', 'awaiting_payment'].includes(order.status) ? 'completed' : 'upcoming' },
  ]

  // Live Activity Feed items from events
  const liveUpdates = (events || []).filter((e: any) => e.metadata?.type === 'sourcing_update')

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
              <History className="w-3.5 h-3.5" />
              <span>Order #{order.order_number}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{order.product_name}</h1>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Potential Annual Savings</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(potentialSavings || 4500)}</p>
            </div>
          </div>
        </div>

        {/* Concierge Agent Card */}
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
          <CardContent className="p-0">
            <div className="bg-slate-900 p-6 flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  S
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Sarah</h3>
                  <Badge className="bg-blue-500/20 text-blue-300 border-none text-[10px] uppercase font-bold px-2 py-0.5">Sourcing Manager</Badge>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">Expertise: Food & Candy • APAC Sourcing</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-slate-700 font-medium italic">
                "You're in good hands. Sarah is now cross-referencing your request with our verified factory database."
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Messages & Comparison */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Comparison UI (Prompt Strategic Insight) */}
            {order.status === 'awaiting_payment' && quotes.length > 0 && (
              <section className="bg-white rounded-3xl border-2 border-emerald-500 overflow-hidden shadow-xl shadow-emerald-100 space-y-0">
                <div className="bg-emerald-500 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    <h2 className="text-lg font-bold">nexi-Verified Selection Results</h2>
                  </div>
                  <p className="text-emerald-50 text-xs mt-1">Deep negotiation completed. We saved you an average of 14% vs. initial market estimates.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <th className="px-4 py-3 text-left font-bold uppercase text-[10px]">Feature</th>
                        <th className="px-4 py-3 text-left font-bold uppercase text-[10px]">Initial Match (Report)</th>
                        <th className="px-4 py-3 text-left font-bold uppercase text-[10px] text-emerald-600 bg-emerald-50/50">nexi Verified (Final)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-500">Unit Price</td>
                        <td className="px-4 py-3 text-slate-700">{formatCurrency(conservativeLanded)} (Est.)</td>
                        <td className="px-4 py-3 font-bold text-emerald-700 bg-emerald-50/30">{formatCurrency(quotes[0]?.fob_unit_price || 0)} (Negotiated)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-500">MOQ</td>
                        <td className="px-4 py-3 text-slate-700">{report?.baseline?.riskFlags?.supply?.moqRange?.typical || '5,000'} Units</td>
                        <td className="px-4 py-3 font-bold text-emerald-700 bg-emerald-50/30">{quotes[0]?.moq || '2,000'} Units</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-500">Risk</td>
                        <td className="px-4 py-3 text-slate-700">Unverified Data</td>
                        <td className="px-4 py-3 font-bold text-emerald-700 bg-emerald-50/30">Factory Vetted</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end">
                  <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                    Accept Verified Quote <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* Messages Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Messages
                </h2>
                <Badge variant="outline" className="text-slate-500 font-bold uppercase tracking-tighter">Live Support</Badge>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {/* System Message */}
                <div className="flex justify-center">
                  <div className="bg-slate-100 text-slate-500 text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    System: Agent Sarah has been assigned to your project
                  </div>
                </div>

                {messages.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">No messages yet. Sarah will reach out shortly.</p>
                  </div>
                )}
                
                {messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      m.sender_role === 'admin' 
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' 
                        : 'bg-blue-600 text-white rounded-tr-none'
                    }`}>
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${m.sender_role === 'admin' ? 'text-blue-600' : 'text-blue-100'}`}>
                          {m.sender === 'nexi' ? 'nexi (Sourcing Lead)' : (m.sender_role === 'admin' ? 'Sarah (NexSupply)' : 'You')}
                        </span>
                        <span className={`text-[10px] ${m.sender_role === 'admin' ? 'text-slate-400' : 'text-blue-200'}`}>
                          {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{m.body}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input with Suggested Actions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Upload Product Label', icon: Upload },
                    { label: 'Update Target Quantity', icon: Plus },
                    { label: 'Request Express Quote', icon: Zap },
                  ].map((action) => (
                    <button 
                      key={action.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all"
                    >
                      <action.icon className="w-3.5 h-3.5" />
                      {action.label}
                    </button>
                  ))}
                </div>
                <form action={handleUserMessage} className="flex gap-2">
                  <input type="hidden" name="orderId" value={orderId} />
                  <textarea 
                    name="body" 
                    rows={1}
                    className="flex-1 rounded-xl border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none" 
                    placeholder="Ask Sarah a question..." 
                  />
                  <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 transition-all">
                    Send
                  </button>
                </form>
              </div>
            </section>

          </div>

          {/* Right Column: Timeline & Summary */}
          <div className="space-y-8">
            
            {/* Timeline Section with Live Feed */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Live Investigation
                </h2>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tighter">Active</span>
                </div>
              </div>
              
              <div className="space-y-6 relative">
                {/* Static Process Steps */}
                {steps.map((step, idx) => (
                  <div key={step.id} className="relative pl-8">
                    {idx !== steps.length - 1 && (
                      <div className={`absolute left-3.5 top-8 bottom-[-20px] w-0.5 ${step.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                    )}
                    <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                      step.status === 'completed' ? 'bg-emerald-100' : step.status === 'current' ? 'bg-blue-100' : 'bg-slate-50'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : step.status === 'current' ? (
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 bg-slate-300 rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[14px] font-bold ${step.status === 'upcoming' ? 'text-slate-400' : 'text-slate-900'}`}>{step.label}</p>
                        {step.time && (
                          <Badge className="bg-blue-50 text-blue-600 border-none text-[10px] font-bold px-2 py-0.5">
                            {step.time}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-500 leading-tight mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}

                {/* Live Feed Divider */}
                {liveUpdates.length > 0 && (
                  <div className="py-2 flex items-center gap-3">
                    <div className="h-px bg-slate-100 flex-1" />
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Recent Activity</span>
                    <div className="h-px bg-slate-100 flex-1" />
                  </div>
                )}

                {/* Live Activity Items */}
                <div className="space-y-4">
                  {[...liveUpdates].reverse().map((update: any) => (
                    <div key={update.id} className="relative pl-8">
                      <div className="absolute left-3 top-0 bottom-0 w-px border-l border-dashed border-blue-200" />
                      <div className="absolute left-[11px] top-2 w-2 h-2 bg-blue-400 rounded-full ring-4 ring-blue-50" />
                      <div>
                        <p className="text-[12px] font-semibold text-slate-700 leading-snug">{update.metadata.text}</p>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">{formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Product Snapshot Section */}
            <section className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 shadow-xl shadow-slate-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold">Project Snapshot</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Target Landed Cost</p>
                  <p className="text-xl font-bold">{order.status === 'awaiting_payment' ? formatCurrency(quotes[0]?.fob_unit_price || 0) : 'Calculating Target...'}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Estimated Lead Time</p>
                  <p className="text-xl font-bold">{order.status === 'awaiting_payment' ? `${quotes[0]?.lead_time_days || 30} Days` : 'Sourcing in Progress'}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Verified Suppliers</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-emerald-400">{quotes.filter((q: any) => q.supplier_name).length}</p>
                    <p className="text-white/40 text-sm font-bold">/ 3 Slots</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Uploads Section (Sidebar) */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Documents
              </h2>
              <div className="space-y-3">
                {uploads.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No supporting documents uploaded yet.</p>
                ) : (
                  uploads.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <Plus className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 uppercase">{u.file_type || u.kind}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))
                )}
              </div>
              <form action={handleUserUpload} className="pt-2">
                <input type="hidden" name="orderId" value={orderId} />
                <button className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-xs font-bold hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Document
                </button>
              </form>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
