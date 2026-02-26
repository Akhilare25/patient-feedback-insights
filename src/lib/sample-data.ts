import Papa from "papaparse";
import type { PatientFeedbackItem } from "./types";

export const sampleFeedbackItems: PatientFeedbackItem[] = [
  {
    text: "I waited almost 90 minutes past my appointment time. No one explained the delay.",
    location: "Downtown Clinic",
    service_line: "Primary Care",
    channel: "Post-visit survey",
    rating: 2
  },
  {
    text: "The nurse was kind and thorough, but scheduling my follow-up took three phone calls.",
    location: "Downtown Clinic",
    service_line: "Primary Care",
    channel: "Phone survey",
    rating: 4
  },
  {
    text: "The online portal is confusing. I couldn't figure out where to message my doctor.",
    location: "Eastside Campus",
    service_line: "Multi-specialty",
    channel: "Portal feedback",
    rating: 3
  },
  {
    text: "Billing was unclear. I received three different statements and had to call twice for clarification.",
    location: "Billing Center",
    service_line: "Revenue Cycle",
    channel: "Email",
    rating: 2
  },
  {
    text: "Once I got into the room, the provider listened carefully and answered all my questions.",
    location: "Eastside Campus",
    service_line: "Specialty Care",
    channel: "Post-visit survey",
    rating: 5
  },
  {
    text: "No one wiped down the waiting room chairs between patients. This made me uncomfortable.",
    location: "Downtown Clinic",
    service_line: "Primary Care",
    channel: "Post-visit survey",
    rating: 3
  },
  {
    text: "I left a message about a medication side effect and did not hear back for two days.",
    location: "Call Center",
    service_line: "Pharmacy",
    channel: "Phone survey",
    rating: 2
  },
  {
    text: "The signage in the parking garage was confusing and we almost missed our appointment.",
    location: "Main Hospital",
    service_line: "Surgery",
    channel: "Post-visit survey",
    rating: 3
  },
  {
    text: "I appreciated that the staff introduced themselves and checked my name and date of birth every time.",
    location: "Main Hospital",
    service_line: "Inpatient",
    channel: "Post-discharge survey",
    rating: 5
  },
  {
    text: "The IV site looked red and swollen after I went home. I wasn't sure if that was normal.",
    location: "Main Hospital",
    service_line: "Inpatient",
    channel: "Post-discharge survey",
    rating: 2
  },
  {
    text: "Check-in took 25 minutes and the kiosk kept saying my insurance wasn't on file.",
    location: "Eastside Campus",
    service_line: "Multi-specialty",
    channel: "Post-visit survey",
    rating: 2
  },
  {
    text: "Dr. Smith and the care team were excellent. I just wish someone had called to confirm my appointment the day before.",
    location: "Downtown Clinic",
    service_line: "Primary Care",
    channel: "Post-visit survey",
    rating: 5
  }
];

/** CSV string of sample data for download */
export function getSampleCsvString(): string {
  const rows = sampleFeedbackItems.map((item) => ({
    text: item.text,
    date: item.date ?? "",
    location: item.location ?? "",
    service_line: item.service_line ?? "",
    channel: item.channel ?? "",
    rating: item.rating ?? ""
  }));
  return Papa.unparse(rows);
}

