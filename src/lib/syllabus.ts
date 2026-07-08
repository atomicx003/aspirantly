export type SubjectKey = "Physics" | "Chemistry" | "Mathematics" | "Biology";

export const SUBJECT_META: Record<
  SubjectKey,
  { color: string; short: string }
> = {
  Physics: { color: "var(--physics)", short: "PHY" },
  Chemistry: { color: "var(--chemistry)", short: "CHE" },
  Mathematics: { color: "var(--maths)", short: "MAT" },
  Biology: { color: "var(--biology)", short: "BIO" },
};

export const SUBJECT_ORDER: SubjectKey[] = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
];

export interface ChapterEntry {
  key: string;
  name: string;
  subject: SubjectKey;
  cls: "11" | "12";
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface RawSyllabus {
  subject: SubjectKey;
  cls: "11" | "12";
  chapters: string[];
}

const RAW: RawSyllabus[] = [
  {
    subject: "Physics",
    cls: "11",
    chapters: [
      "Units and Measurements",
      "Motion in a Straight Line",
      "Motion in a Plane",
      "Laws of Motion",
      "Work, Energy and Power",
      "System of Particles and Rotational Motion",
      "Gravitation",
      "Mechanical Properties of Solids",
      "Mechanical Properties of Fluids",
      "Thermal Properties of Matter",
      "Thermodynamics",
      "Kinetic Theory of Gases",
      "Oscillations",
      "Waves",
    ],
  },
  {
    subject: "Physics",
    cls: "12",
    chapters: [
      "Electric Charges and Fields",
      "Electrostatic Potential and Capacitance",
      "Current Electricity",
      "Moving Charges and Magnetism",
      "Magnetism and Matter",
      "Electromagnetic Induction",
      "Alternating Current",
      "Electromagnetic Waves",
      "Ray Optics and Optical Instruments",
      "Wave Optics",
      "Dual Nature of Radiation and Matter",
      "Atoms",
      "Nuclei",
      "Semiconductor Electronics",
    ],
  },
  {
    subject: "Chemistry",
    cls: "11",
    chapters: [
      "Some Basic Concepts of Chemistry",
      "Structure of Atom",
      "Classification of Elements and Periodicity",
      "Chemical Bonding and Molecular Structure",
      "Thermodynamics",
      "Equilibrium",
      "Redox Reactions",
      "The p-Block Elements (Group 13 & 14)",
      "Organic Chemistry: Basic Principles",
      "Hydrocarbons",
    ],
  },
  {
    subject: "Chemistry",
    cls: "12",
    chapters: [
      "Solutions",
      "Electrochemistry",
      "Chemical Kinetics",
      "The d- and f-Block Elements",
      "Coordination Compounds",
      "Haloalkanes and Haloarenes",
      "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids",
      "Amines",
      "Biomolecules",
    ],
  },
  {
    subject: "Mathematics",
    cls: "11",
    chapters: [
      "Sets",
      "Relations and Functions",
      "Trigonometric Functions",
      "Complex Numbers and Quadratic Equations",
      "Linear Inequalities",
      "Permutations and Combinations",
      "Binomial Theorem",
      "Sequences and Series",
      "Straight Lines",
      "Conic Sections",
      "Introduction to 3D Geometry",
      "Limits and Derivatives",
      "Statistics",
      "Probability",
    ],
  },
  {
    subject: "Mathematics",
    cls: "12",
    chapters: [
      "Relations and Functions",
      "Inverse Trigonometric Functions",
      "Matrices",
      "Determinants",
      "Continuity and Differentiability",
      "Application of Derivatives",
      "Integrals",
      "Application of Integrals",
      "Differential Equations",
      "Vector Algebra",
      "Three Dimensional Geometry",
      "Linear Programming",
      "Probability",
    ],
  },
  {
    subject: "Biology",
    cls: "11",
    chapters: [
      "The Living World",
      "Biological Classification",
      "Plant Kingdom",
      "Animal Kingdom",
      "Morphology of Flowering Plants",
      "Anatomy of Flowering Plants",
      "Structural Organisation in Animals",
      "Cell: The Unit of Life",
      "Biomolecules",
      "Cell Cycle and Cell Division",
      "Photosynthesis in Higher Plants",
      "Respiration in Plants",
      "Plant Growth and Development",
      "Breathing and Exchange of Gases",
      "Body Fluids and Circulation",
      "Excretory Products and their Elimination",
      "Locomotion and Movement",
      "Neural Control and Coordination",
      "Chemical Coordination and Integration",
    ],
  },
  {
    subject: "Biology",
    cls: "12",
    chapters: [
      "Sexual Reproduction in Flowering Plants",
      "Human Reproduction",
      "Reproductive Health",
      "Principles of Inheritance and Variation",
      "Molecular Basis of Inheritance",
      "Evolution",
      "Human Health and Disease",
      "Microbes in Human Welfare",
      "Biotechnology: Principles and Processes",
      "Biotechnology and its Applications",
      "Organisms and Populations",
      "Ecosystem",
      "Biodiversity and Conservation",
    ],
  },
];

export const SYLLABUS: {
  subject: SubjectKey;
  cls: "11" | "12";
  chapters: ChapterEntry[];
}[] = RAW.map((g) => ({
  subject: g.subject,
  cls: g.cls,
  chapters: g.chapters.map((name) => ({
    key: `${SUBJECT_META[g.subject].short.toLowerCase()}-${g.cls}-${slug(name)}`,
    name,
    subject: g.subject,
    cls: g.cls,
  })),
}));

export const ALL_CHAPTERS: ChapterEntry[] = SYLLABUS.flatMap((g) => g.chapters);

export function chaptersForSubject(subject: SubjectKey): ChapterEntry[] {
  return ALL_CHAPTERS.filter((c) => c.subject === subject);
}

export function makeChapterKey(subject: SubjectKey, cls: "11" | "12", name: string) {
  return `${SUBJECT_META[subject].short.toLowerCase()}-${cls}-${slug(name)}`;
}
