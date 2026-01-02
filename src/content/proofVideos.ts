export type ProofTopic = "Operations" | "Sourcing" | "QC"

export type ProofVideo = {
  slug: string
  title: string
  subtitle: string
  topic: ProofTopic
  durationSeconds: number
  youtubeId: string
  takeaways: string[]
  transcript: string
  publishedAt?: string;
  isFeatured?: boolean
  isPinned?: boolean
}

export const proofVideos: ProofVideo[] = [
  {
    slug: "inside-nexsupply-ops-tour",
    title: "Inside NexSupply: 7 Years Hidden, Now Revealed",
    subtitle: "A quick tour of how we run packaging, storage, and shipping in Shantou",
    topic: "Operations",
    durationSeconds: 205,
    youtubeId: "1pMa-6muGQ0",
    takeaways: [
      "Real ops, not slides",
      "Packaging and loading discipline reduces loss",
      "A clear model aligned to your production cost"
    ],
    transcript: `When you grow, we grow. Next supply, your success is our mission.
Welcome to Next Supply, your all in one supply solution. Smart, simple supply.
I'm Jun. I'm the founder of Next Supply. We operate local office at Korea, Bead, China.
Today, we here at our Santo China office, which is the heart of our global operation.

Let me take you guys on quick tour.
We start from outsourcing agent sourcing for Korean wholesaler.
By simplifying supply chain, we helped our clients secure the better margin.
And this experience gave us insight into both supply chain structure and buyer needs.
This is where the completed orders are stored.

It's still early, so it's a little spacious now, but by afternoon it will be packed.
At night containers are live and we clear the space again.
This product will be shipped out globally in this evening.
This month we processing order for Korean clients supplying convenience stores.
Let's step inside and meet our packaging manager with over 30 years of experience.

He knows how to minimize loss and maximize quality.
Our goal is a zero ros. When you aim for the best, perfection become a possible sh.
Yes, this is our logistics manager. I call him Tetris master.
With more than 30 years of experience, he's a master at optimizing space.
Thanks to him, our clients have cut logistic cost by 20% or more.

This is our secondary storage.
This is product or non urgent product store at client request.
If you need holding space for future shipment, don't worry. We got you covered.

Here's our negotiation expert.
When factories talk stores, she step in.
She's sweet on the outside but sharp in the business.
With her best experience, she knows how to secure the best time for every deal.

These are just a few of many product we have developed.
Each one is a result of dedication, passion and experience.
Many sold over a million units, some over a 100 million.

This is what we build and this is what we stand for.
At Next Supply, your success is our mission.
We earn through simple clear model a fair commission based on your production cost.
From sourcing to shipping, we stay hands on every step of your way.
When you grow, we grow. Let's build something great together.`
  },
  {
    slug: "bad-suppliers-cost-more",
    title: "Bad Suppliers Cost You More Than You Think | NexSupply Can Help",
    subtitle: "Common sourcing failures and how we prevent costly surprises",
    topic: "Sourcing",
    durationSeconds: 149,
    youtubeId: "aJOCT_E0RlE",
    takeaways: [
      "Reduce supplier silence and missed deadlines",
      "De risk importing with clear verification steps",
      "Support both importing and custom development"
    ],
    transcript: `Language gaps, missed deadline, unclear product quality, no replies from suppliers.
Whether you're importing product or developing your own, next supply is your all in one partners.
Importing from overseas may look simples, but it quickly becomes complicated.
Language gaps, missed deadline, unclear product quality, no replies from suppliers.

This problem cost your business time, money and peace of your mind.
At Nextly, we make global sourcing easy.
We are your partner for product sourcing and custom development.
Based in Asia, we working with clients around the world.
From factory search to package to shipping and customs, we handle it all.
So you can focus on your own business.

Looking to import, let it made product without the hazel.
Our global sourcing support is designed for Amazon sellers, online sellers and small business
who want real research, not costly surprised.
We hope you find a reliable suppliers, check samples, label and manage shipping.
No stress, no confusion, just smooth safe importing.

Want to create your own product from scratch?
Our custom product development service is made for startup TC brand and kickstart creators.
We connect you with trust factories, guide your product design,
manage sample and improvements and keep an eyes on production in real time.

Need certification like a CE or a we will help you with that too.
We also handle finer package and global delivery from idea to scratch.
We are with you all the way.

We're not just a middleman.
We directly work with factory. We visit in person. We check every detail.
With years of experience and hundred of successful project,
we help protect your profit and your brand.

Whether you're importing product or developing your own,
next supply is your all in one partners.
Visit our website to learn more or request a quot today.
Smart simple supply. Next supply.`
  },
  {
    slug: "real-product-development-qc",
    title: "What Real Product Development Looks Like | Inside Supply Chain",
    subtitle: "On site checks across factories to protect timeline and quality",
    topic: "QC",
    durationSeconds: 226,
    youtubeId: "iJRGh4Tyhbw",
    takeaways: [
      "Catch issues before final packaging",
      "Protect tight deadlines with hands on checks",
      "Quality decisions stay visible, not guessed"
    ],
    transcript: `Here to living production. Check the detail and fix anything on the spot.
This trip came up quite suddenly.
One of our client just called yesterday and asked can you deliver a product by end of this month.
So we said we'll do our best nothing impossible but make that happen.
We need to action fast. We're now at the Wenjo factory.

This is where one part of product is been made.
Since final package will happen in Sto, we can't afford to discover any issue at the last minute.
That's why I'm here to live in production, check the detail, and fix anything on the spot.

After seeing the one side by myself, I feel more confident about the quality.
But with tight deadline, we need to stay all the way.

Now we're in EU the second key site for this product.
This factory handles another major component.
What we do here will directly impact whether we can meet deliberate timeline or not.
So again we're checking everything hands on and working closely with the team.

EU looks solid. If we catch any issue now, we won't have a problem in Santo.
From wa to EU and soon the final packaging in Santo.
We manage each step with care, not just to meet deadline,
but deliver with confidence and quality.
That's what Next Supply is built for.`,
    isFeatured: true,
    isPinned: true
  }
]

export function getFeaturedVideo(): ProofVideo | undefined {
  return proofVideos.find((v) => v.isFeatured);
}

export function getVideoBySlug(slug: string): ProofVideo | undefined {
  return proofVideos.find((v) => v.slug === slug);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
