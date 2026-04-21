// Shared dropdown options for minister forms (MinisterDialog and IntakeFormTabs)
// Cascading hierarchy: Sector → Association → Fellowship

export const SECTOR_ASSOCIATION_MAP: Record<string, string[]> = {
  "NORTHERN GHANA SECTOR": [
    "Tahima",
    "Tamale",
    "Nalerigu",
    "Liberty",
    "Wa",
    "Nakpanduri",
    "Bolgatanga",
    "North Eastern",
  ],
  "MID-GHANA SECTOR": [
    "ADANSI",
    "ADOM",
    "BETHEL",
    "GOLDEN GATE",
    "KUMASI NORTH",
    "KUMASI SOUTH EAST",
    "KUMASI SOUTH WEST",
    "KUMASI WEST",
    "SUNYANI",
  ],
  "SOUTH-EAST GHANA SECTOR": [
    "ACCRA NORTH",
    "ACCRA SOUTH",
    "EASTERN",
    "TEMA CENTRAL",
    "UNITY PLAIN",
    "KEKELI",
    "NORTH VOLTA",
    "DANGME WEST",
    "DANGME EAST",
  ],
  "SOUTH-WEST GHANA SECTOR": [
    "WINNEBA",
    "SWEDRU",
    "SKD/TDI",
    "NZEMA",
    "HOPE",
    "CAPE COAST",
  ],
};

export const SECTORS = Object.keys(SECTOR_ASSOCIATION_MAP);

// All associations (flat list, for backward compat / reports)
export const ASSOCIATIONS = Object.values(SECTOR_ASSOCIATION_MAP).flat();

// Fellowships are the same for every association
export const FELLOWSHIPS = [
  "Fellowship 1",
  "Fellowship 2",
  "Fellowship 3",
  "Fellowship 4",
];

export const ZONES = [
  "Zone 1",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
];

// Helper: get associations for a given sector
export function getAssociationsForSector(sector: string): string[] {
  return SECTOR_ASSOCIATION_MAP[sector] || [];
}

// Helper: find the sector for a given association
export function getSectorForAssociation(association: string): string | undefined {
  return SECTORS.find((s) => SECTOR_ASSOCIATION_MAP[s].includes(association));
}

export const MARITAL_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "widowed", label: "Widowed" },
  { value: "divorced", label: "Divorced" },
];

export const MARRIAGE_TYPES = [
  { value: "ordinance", label: "Ordinance" },
  { value: "customary", label: "Customary" },
];

export const MINISTER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "retired", label: "Retired" },
];
