# Family Travel Planner

Customized travel itineraries for families with young kids — built around nap schedules, kids' ages, activity hours, and age-appropriate experiences.

## What it does

Give it your family profile (kids' ages, wake time, nap window, destination, trip length) and it generates a realistic day-by-day itinerary that actually works with toddler life.

## Current Status

MVP demo — San Diego destination, rule-based scheduler, HTML preview.

## How to run the demo locally

1. Install [Node.js](https://nodejs.org) v18+
2. Clone this repo
3. Run the generator:
   ```bash
   node generate_itinerary.js sample_input.json
   ```
4. Open `preview.html` in your browser to see the itinerary

## Project structure

```
family-travel-planner/
├── data/
│   ├── san_diego_activities.json   # Activity dataset (San Diego)
│   └── family_profiles.json        # Sample family profile
├── docs/                           # Session notes and planning docs
├── generate_itinerary.js           # Rule-based itinerary generator
├── preview.html                    # Browser preview UI
├── sample_input.json               # Sample family input
└── sample_itinerary.json           # Sample generated output
```

## Roadmap

- [ ] Convert to Next.js web app
- [ ] Add Supabase database for activities and user profiles
- [ ] Expand to additional destinations
- [ ] Add travel-time awareness between activities
- [ ] User accounts (save/load family profiles)
- [ ] Gear/packing checklists with affiliate links
- [ ] AI-powered natural language queries

## Contributors

- Eddie (mathamagician)
- Delan
