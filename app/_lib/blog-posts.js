/**
 * Blog post data — simple flat-file approach (no CMS needed yet).
 * Each post is a JS object with metadata + content sections.
 * Content is structured as an array of blocks for flexible rendering.
 *
 * To add a new post: add an entry to BLOG_POSTS below.
 */

export const BLOG_POSTS = [
  {
    slug: "traveling-with-toddler-guide",
    title: "The Complete Guide to Traveling with a Toddler",
    description:
      "Everything you need to know about traveling with a toddler — from nap scheduling to packing, flying tips to road trips, and how to actually enjoy the vacation.",
    category: "Guides",
    author: "Toddler Trip",
    publishedAt: "2026-03-14",
    updatedAt: "2026-03-14",
    readTime: "12 min read",
    featured: true,
    tags: ["toddler travel", "family vacation", "travel tips", "nap schedule"],
    content: [
      {
        type: "paragraph",
        text: "Traveling with a toddler doesn't have to be stressful. Yes, it's different from pre-kid travel — but with the right planning, family trips can be some of the best memories you'll ever make. The key is working WITH your toddler's schedule, not against it.",
      },
      {
        type: "heading",
        text: "The Golden Rule: Plan Around Nap Time",
      },
      {
        type: "paragraph",
        text: "This is the single most important principle of toddler travel. A well-rested toddler is a happy toddler — and a happy toddler means happy parents. Every day of your trip should be structured around your child's nap schedule. Morning activities before nap. Afternoon activities after nap. It sounds simple, but most travel guides completely ignore this reality.",
      },
      {
        type: "paragraph",
        text: "That's exactly why we built Toddler Trip — it's the only travel planner that automatically schedules your itinerary around nap times, so you never have to choose between seeing the sights and keeping your toddler's routine intact.",
      },
      {
        type: "heading",
        text: "Before You Go: Preparation Checklist",
      },
      {
        type: "subheading",
        text: "1. Choose the Right Destination",
      },
      {
        type: "paragraph",
        text: "Not all destinations are created equal when you're traveling with a toddler. Look for places with: stroller-friendly sidewalks and attractions, kid-friendly restaurants that don't require whisper-quiet behavior, accommodations with kitchens (for snack prep and bottle warming), outdoor spaces where toddlers can run and explore, and activities that work for multiple age groups if you have older kids too.",
      },
      {
        type: "callout",
        text: "Pro tip: San Diego, Orlando, Maui, and national parks like Acadia and Yellowstone are consistently rated as top toddler-friendly destinations. Browse our destination guides to find the perfect fit.",
        link: "/destinations",
        linkText: "Browse destinations",
      },
      {
        type: "subheading",
        text: "2. Book Nap-Friendly Accommodations",
      },
      {
        type: "paragraph",
        text: "Hotels with separate sleeping areas, vacation rentals with bedrooms, or even camping setups that allow for a quiet nap space are essential. Your toddler needs a dark, quiet place for naps — and you need the freedom to continue your day while they sleep (or at least enjoy a quiet coffee on the balcony).",
      },
      {
        type: "subheading",
        text: "3. Pack Smart, Not Heavy",
      },
      {
        type: "paragraph",
        text: "The biggest mistake parents make is overpacking. You need less than you think — and for bulky items like cribs, strollers, and car seats, rental services like BabyQuip can deliver gear directly to your destination. Focus your packing on: comfort items from home (favorite blanket, stuffed animal), snacks (so many snacks), a small first aid kit, entertainment for transit (sticker books, a tablet for emergencies), and weather-appropriate layers.",
      },
      {
        type: "callout",
        text: "Use our AI-powered packing list generator to get a personalized checklist based on your destination, kids' ages, and planned activities.",
        link: "/plan",
        linkText: "Generate your packing list",
      },
      {
        type: "heading",
        text: "During the Trip: Daily Schedule Strategy",
      },
      {
        type: "paragraph",
        text: "The best family travel days follow a simple pattern: one big activity in the morning, nap time in the early afternoon, one lighter activity in the late afternoon, and an early dinner. Resist the urge to pack every hour. Toddlers need downtime, transition time, and snack time (always snack time). A day with two good activities and plenty of breathing room will be better than a day with five rushed activities and a meltdown at dinner.",
      },
      {
        type: "heading",
        text: "Flying with a Toddler",
      },
      {
        type: "paragraph",
        text: "Airport and airplane time is often the most dreaded part of family travel. Here's what actually works: book flights during nap time when possible, bring a car seat on the plane (FAA recommends it, and it gives your toddler a familiar sleep spot), pack a 'surprise bag' with 3-4 new small toys or books, download shows and games on a tablet as backup, bring more snacks than you think you need, and walk the airport before boarding to burn energy.",
      },
      {
        type: "heading",
        text: "Road Trips with a Toddler",
      },
      {
        type: "paragraph",
        text: "Road trips can actually be easier than flying with toddlers. You control the schedule, you can stop whenever you want, and you can pack everything you need. Plan driving legs around nap times — start a leg right when nap begins, and you'll get 1-2 hours of quiet driving. Stop every 2 hours for movement breaks. Pack a cooler with snacks and meals to avoid fast food stops.",
      },
      {
        type: "heading",
        text: "The Bottom Line",
      },
      {
        type: "paragraph",
        text: "Traveling with a toddler is absolutely worth it. They may not remember the trip, but you will — and the family bonding, the new experiences, and the joy of watching your child discover the world are irreplaceable. The secret is simple: respect the nap, plan for flexibility, and lower your expectations just enough to leave room for spontaneous magic.",
      },
      {
        type: "cta",
        text: "Ready to plan your family trip? Toddler Trip builds nap-aware itineraries in minutes — free.",
        link: "/plan",
        linkText: "Start Planning",
      },
    ],
  },
  {
    slug: "plan-vacation-around-nap-time",
    title: "How to Plan a Family Vacation Around Nap Time",
    description:
      "A practical guide to scheduling family trips that respect your toddler's nap routine — so everyone enjoys the vacation.",
    category: "Tips",
    author: "Toddler Trip",
    publishedAt: "2026-03-14",
    updatedAt: "2026-03-14",
    readTime: "8 min read",
    featured: true,
    tags: ["nap schedule", "family vacation", "toddler routine", "travel planning"],
    content: [
      {
        type: "paragraph",
        text: "Ask any parent of a toddler what their biggest vacation concern is, and the answer is almost always the same: naps. Will the schedule hold up? Will skipping a nap ruin the afternoon? What if the hotel room isn't dark enough? These are real concerns — and they're exactly why most family travel planning tools fail parents.",
      },
      {
        type: "heading",
        text: "Why Nap Scheduling Matters on Vacation",
      },
      {
        type: "paragraph",
        text: "A toddler who misses a nap doesn't just get tired — they get overtired. And overtired toddlers are harder to put to sleep, wake up more at night, and are more prone to meltdowns. One missed nap can cascade into a rough evening, a rough night, and a rough next day. On vacation, where you're already out of routine, this effect is amplified.",
      },
      {
        type: "paragraph",
        text: "The solution isn't to skip activities or stay in the hotel all day. It's to plan your activities around nap windows so you get the best of both worlds: a full vacation AND a well-rested toddler.",
      },
      {
        type: "heading",
        text: "The Nap-Aware Scheduling Framework",
      },
      {
        type: "subheading",
        text: "Step 1: Know Your Child's Nap Pattern",
      },
      {
        type: "paragraph",
        text: "Most toddlers (12-36 months) take one nap per day, typically 12:30-2:30 PM. Some younger toddlers still take two naps. Write down your child's actual nap schedule — start time, duration, and how flexible it is. This becomes the immovable anchor of your daily plan.",
      },
      {
        type: "subheading",
        text: "Step 2: Divide the Day into Activity Windows",
      },
      {
        type: "paragraph",
        text: "With a 1 PM nap, your day naturally splits into: morning window (8:00 AM - 12:00 PM) for your big activity, nap window (12:30 - 2:30 PM) for rest, and afternoon window (3:00 - 5:30 PM) for a lighter activity. This gives you two solid activity windows per day — more than enough to have a great vacation day.",
      },
      {
        type: "subheading",
        text: "Step 3: Match Activity Intensity to Energy Levels",
      },
      {
        type: "paragraph",
        text: "Mornings are peak energy time. Schedule your most active, most exciting activities here — the zoo, the aquarium, the hike, the beach. Afternoons after nap are good for calmer activities — a leisurely walk, a playground, ice cream, or pool time. Evenings should be the most low-key — dinner and a stroll.",
      },
      {
        type: "subheading",
        text: "Step 4: Build in Buffer Time",
      },
      {
        type: "paragraph",
        text: "Everything takes longer with a toddler. Getting ready takes longer. Getting to the car takes longer. Finding a parking spot, navigating the stroller, changing a diaper — it all adds up. Build 30-minute buffers between activities and travel time. Your future self will thank you.",
      },
      {
        type: "heading",
        text: "What About Car Naps?",
      },
      {
        type: "paragraph",
        text: "Car naps are your secret weapon for road trips. If your toddler sleeps well in the car, you can use drive time as nap time. Plan your afternoon driving leg to coincide with nap time, and you'll arrive at your next stop with a rested toddler and miles behind you.",
      },
      {
        type: "heading",
        text: "Let Technology Do the Work",
      },
      {
        type: "paragraph",
        text: "Manually scheduling around naps is doable but tedious. That's why Toddler Trip exists — you enter your kids' nap schedules once, and the AI automatically builds every day around them. Activities are scored by duration and energy level, then slotted into the right windows. Nap blocks are locked in and visible on the calendar. It takes what used to be an hour of spreadsheet planning and turns it into a 5-minute process.",
      },
      {
        type: "cta",
        text: "Try it yourself — enter your family profile and get a nap-aware itinerary in minutes.",
        link: "/plan",
        linkText: "Plan Around Nap Time",
      },
    ],
  },
];

/** Find a blog post by slug */
export function findPost(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug) || null;
}

/** Get all published posts, sorted by date (newest first) */
export function getAllPosts() {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );
}

/** Get featured posts */
export function getFeaturedPosts() {
  return getAllPosts().filter((p) => p.featured);
}
