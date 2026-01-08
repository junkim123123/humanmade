"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "What does deposit credited mean?",
    answer:
      "The $49 deposit covers factory outreach and verification work. If you proceed with an order, the $49 is credited toward your first order total.",
  },
  {
    question: "What counts as per product?",
    answer:
      "Each unique product (different SKU, design, or specification) requires a separate verification deposit. Variations of the same product may be grouped.",
  },
  {
    question: "What if no supplier matches are found?",
    answer:
      "If we cannot find matching suppliers during verification, we refund the deposit and provide a detailed explanation of why no matches were found.",
  },
  {
    question: "Do you handle shipping and customs clearance?",
    answer:
      "We coordinate shipping handoff and provide documentation support. Customs clearance is typically handled by your freight forwarder or customs broker.",
  },
  {
    question: "When does the 7% execution fee apply?",
    answer:
      "The 7% FOB execution fee applies only when you place an order after receiving verified quotes. Baseline reports and verification are separate services.",
  },
  {
    question: "What is premium development?",
    answer:
      "Premium development (9% FOB) is optional for custom product development with design modifications, tooling, and extensive prototyping. Standard execution is 7%.",
  },
];

export function PricingFAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
        Frequently asked questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-b border-slate-200">
            <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600 pt-2">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

