import { Suspense } from "react";
import FamilyTravelPlanner from "../../components/FamilyTravelPlanner";

export const metadata = {
  title: "Plan Your Trip",
  description:
    "Build a personalized family itinerary with AI — activities, schedules, and packing lists built around your kids' nap times.",
  alternates: { canonical: "/plan" },
  robots: { index: false },
};

export default function PlanPage() {
  return (
    <Suspense>
      <FamilyTravelPlanner />
    </Suspense>
  );
}
