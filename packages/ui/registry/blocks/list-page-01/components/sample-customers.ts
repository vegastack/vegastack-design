// @vegastack list-page-01@0.23.36 sha256-ga0RCOov4XzXVqiepfdvNZa8VB5HVgoOMU039aENIrs=

/**
 * Sample data for `list-page-01`: twenty customers, served a page at a time by `fetchCustomers`.
 * Replace both with your own API.
 */

/** One customer row. */
export interface Customer {
  id: string;
  name: string;
  city: string;
  industry: "Hospitality" | "Retail" | "Offices";
  owner: string;
  status: "Active" | "Prospect" | "Paused";
  projects: number;
  /** When the record last changed, as an ISO date. */
  updatedAt: string;
}

/** The signed-in person, for the Mine | Team switch. */
export const CURRENT_USER = "Ana Ruiz";

/** How many rows a page holds. */
export const PAGE_SIZE = 8;

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 24, 12);

/** Every customer, newest change first. */
export const CUSTOMERS: Customer[] = [
  {
    id: "c18",
    name: "Horizon Dental",
    city: "Denver",
    industry: "Offices",
    owner: "Mei Chen",
    status: "Active",
    projects: 9,
    updatedAt: new Date(NOW - 3 * DAY).toISOString(),
  },
  {
    id: "c6",
    name: "Maple Clinics",
    city: "Miami",
    industry: "Offices",
    owner: "Mei Chen",
    status: "Active",
    projects: 6,
    updatedAt: new Date(NOW - 4 * DAY).toISOString(),
  },
  {
    id: "c5",
    name: "Cobalt Studios",
    city: "Boston",
    industry: "Retail",
    owner: "Raj Patel",
    status: "Paused",
    projects: 0,
    updatedAt: new Date(NOW - 5 * DAY).toISOString(),
  },
  {
    id: "c17",
    name: "Granite Law",
    city: "Boston",
    industry: "Retail",
    owner: "Raj Patel",
    status: "Active",
    projects: 5,
    updatedAt: new Date(NOW - 6 * DAY).toISOString(),
  },
  {
    id: "c14",
    name: "Delta Workspace",
    city: "Seattle",
    industry: "Retail",
    owner: "Raj Patel",
    status: "Prospect",
    projects: 8,
    updatedAt: new Date(NOW - 7 * DAY).toISOString(),
  },
  {
    id: "c11",
    name: "Lumen Galleries",
    city: "Miami",
    industry: "Retail",
    owner: "Raj Patel",
    status: "Active",
    projects: 0,
    updatedAt: new Date(NOW - 14 * DAY).toISOString(),
  },
  {
    id: "c20",
    name: "Kestrel Air",
    city: "Miami",
    industry: "Retail",
    owner: "Raj Patel",
    status: "Paused",
    projects: 12,
    updatedAt: new Date(NOW - 20 * DAY).toISOString(),
  },
  {
    id: "c1",
    name: "Skyline Hotels",
    city: "Portland",
    industry: "Hospitality",
    owner: "Ana Ruiz",
    status: "Active",
    projects: 2,
    updatedAt: new Date(NOW - 25 * DAY).toISOString(),
  },
  {
    id: "c13",
    name: "Crescent Books",
    city: "Seattle",
    industry: "Hospitality",
    owner: "Ana Ruiz",
    status: "Active",
    projects: 4,
    updatedAt: new Date(NOW - 26 * DAY).toISOString(),
  },
  {
    id: "c4",
    name: "Juniper Retail",
    city: "Austin",
    industry: "Hospitality",
    owner: "Ana Ruiz",
    status: "Prospect",
    projects: 14,
    updatedAt: new Date(NOW - 32 * DAY).toISOString(),
  },
  {
    id: "c7",
    name: "Orchid Spa",
    city: "Boston",
    industry: "Hospitality",
    owner: "Ana Ruiz",
    status: "Active",
    projects: 1,
    updatedAt: new Date(NOW - 35 * DAY).toISOString(),
  },
  {
    id: "c3",
    name: "Northwind Offices",
    city: "Denver",
    industry: "Offices",
    owner: "Mei Chen",
    status: "Active",
    projects: 5,
    updatedAt: new Date(NOW - 37 * DAY).toISOString(),
  },
  {
    id: "c10",
    name: "Summit Fitness",
    city: "Austin",
    industry: "Hospitality",
    owner: "Ana Ruiz",
    status: "Paused",
    projects: 9,
    updatedAt: new Date(NOW - 37 * DAY).toISOString(),
  },
  {
    id: "c16",
    name: "Fjord Outfitters",
    city: "Seattle",
    industry: "Hospitality",
    owner: "Ana Ruiz",
    status: "Active",
    projects: 1,
    updatedAt: new Date(NOW - 37 * DAY).toISOString(),
  },
  {
    id: "c9",
    name: "Pine Street Deli",
    city: "Denver",
    industry: "Offices",
    owner: "Mei Chen",
    status: "Prospect",
    projects: 3,
    updatedAt: new Date(NOW - 40 * DAY).toISOString(),
  },
  {
    id: "c19",
    name: "Ivy Florists",
    city: "Boston",
    industry: "Hospitality",
    owner: "Ana Ruiz",
    status: "Prospect",
    projects: 7,
    updatedAt: new Date(NOW - 43 * DAY).toISOString(),
  },
  {
    id: "c2",
    name: "Harbor Coffee",
    city: "Austin",
    industry: "Retail",
    owner: "Raj Patel",
    status: "Active",
    projects: 1,
    updatedAt: new Date(NOW - 52 * DAY).toISOString(),
  },
  {
    id: "c8",
    name: "Atlas Logistics",
    city: "Miami",
    industry: "Retail",
    owner: "Raj Patel",
    status: "Active",
    projects: 0,
    updatedAt: new Date(NOW - 52 * DAY).toISOString(),
  },
  {
    id: "c15",
    name: "Ember Bistro",
    city: "Chicago",
    industry: "Offices",
    owner: "Mei Chen",
    status: "Paused",
    projects: 8,
    updatedAt: new Date(NOW - 52 * DAY).toISOString(),
  },
  {
    id: "c12",
    name: "Bayview Suites",
    city: "Austin",
    industry: "Offices",
    owner: "Mei Chen",
    status: "Active",
    projects: 8,
    updatedAt: new Date(NOW - 54 * DAY).toISOString(),
  },
];
