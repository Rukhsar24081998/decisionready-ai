/**
 * Offline resilience tests for resume extraction schema + JSON repair.
 * Run: npx tsx scripts/test-resume-extraction-resilience.ts
 */
import { parseJsonLenient } from "../src/lib/ai/extractors/json-repair";
import { resumeExtractionSchema } from "../src/lib/ai/schemas/extraction-schema";

type Case = { name: string; input: unknown };

const cases: Case[] = [
  {
    name: "Fresher resume (education + skills only)",
    input: {
      candidate: {
        name: "Alex Fresh",
        title: "CS Graduate",
        experienceYears: 0,
        education: ["B.S. Computer Science, 2025"],
      },
      workExperience: [],
      skills: ["Python", "SQL"],
      projects: [],
      competencies: [],
      achievements: [],
    },
  },
  {
    name: "Experienced resume",
    input: {
      candidate: {
        name: "Jordan Lee",
        title: "Senior PM",
        experienceYears: 0,
        location: "SF",
        education: ["MBA"],
      },
      workExperience: [
        {
          company: "Acme",
          title: "PM",
          startDate: "2020",
          endDate: "Present",
          duration: "",
          years: 4,
          responsibilities: ["Owned roadmap"],
          measurableImpact: ["+20% activation"],
        },
      ],
      skills: ["Roadmapping"],
      projects: [
        {
          name: "Insight Copilot",
          description: "AI assistant",
          technologies: ["React"],
          measurableOutcomes: ["35% faster"],
          competenciesDemonstrated: ["AI Product Thinking"],
          evidenceQuote: "reduced time-to-insight by 35%",
          pageNumber: null,
        },
      ],
      competencies: [
        {
          name: "Prioritization",
          reason: "Roadmaps",
          evidence: [{ quote: "Owned roadmap", pageNumber: null }],
        },
      ],
      achievements: [
        {
          title: "Activation lift",
          evidenceQuote: "+20% activation",
          metric: "activation",
          value: "20%",
          impactCategory: "Growth",
        },
      ],
    },
  },
  {
    name: "One-page ATS / minimal",
    input: {
      candidate: { name: "Sam ATS", title: "", experienceYears: 0, education: [] },
      workExperience: [
        {
          company: "Corp",
          title: "Analyst",
          startDate: "2022",
          endDate: "2024",
          duration: null,
          years: null,
          responsibilities: null,
          measurableImpact: null,
        },
      ],
      skills: null,
      projects: null,
      competencies: null,
      achievements: null,
    },
  },
  {
    name: "Resume with no projects",
    input: {
      candidate: {
        name: "No Projects",
        title: "Engineer",
        experienceYears: 0,
        education: ["BS"],
      },
      workExperience: [
        {
          company: "X",
          title: "SWE",
          startDate: "2019",
          endDate: "2023",
          duration: "",
          years: 4,
          responsibilities: ["Built APIs"],
          measurableImpact: [],
        },
      ],
      skills: ["Go"],
      projects: [],
      competencies: [],
      achievements: [],
    },
  },
  {
    name: "Resume with no certifications (N/A field omitted)",
    input: {
      candidate: {
        name: "Cert Free",
        title: "PM",
        experienceYears: 0,
        education: [],
      },
      workExperience: [],
      skills: [],
      projects: [],
      competencies: [],
      achievements: [],
    },
  },
  {
    name: "Only experience",
    input: {
      experience: [
        {
          company: "OnlyExp Co",
          title: "Lead",
          startDate: "2018",
          endDate: "Present",
          years: "5 years",
          responsibilities: ["Led team"],
          measurableImpact: [],
        },
      ],
      skills: "Python, Leadership",
    },
  },
  {
    name: "Tables / objects in education & skills",
    input: {
      candidate: {
        name: "Table Person",
        title: null,
        experienceYears: null,
        education: [
          { degree: "B.Tech", school: "KIIT", year: "2021" },
          { institution: "NextLeap", name: "Fellowship" },
        ],
      },
      workExperience: [],
      skills: [{ skill: "SQL" }, { name: "Figma" }, "Jira"],
      projects: [],
      competencies: [],
      achievements: [],
    },
  },
  {
    name: "Bullet-point heavy with null pageNumbers",
    input: {
      candidate: {
        name: "Bullets",
        title: "PM",
        experienceYears: 0,
        education: ["BA"],
      },
      workExperience: [
        {
          company: "Y",
          title: "APM",
          startDate: "2021",
          endDate: "Present",
          duration: "",
          years: 0,
          responsibilities: ["- Did A", "- Did B"],
          measurableImpact: ["- Grew NPS"],
        },
      ],
      skills: ["Research"],
      projects: [
        {
          name: "P1",
          description: "Desc",
          technologies: [],
          measurableOutcomes: [],
          competenciesDemonstrated: [],
          evidenceQuote: "quote",
          pageNumber: null,
        },
      ],
      competencies: [
        {
          name: "User Research",
          reason: "Interviews",
          evidence: [{ quote: "40 interviews", pageNumber: null }],
        },
      ],
      achievements: [],
    },
  },
  {
    name: "Unusual formatting / alternate keys",
    input: {
      name: "Alt Keys",
      title: "Designer",
      location: "Remote",
      education: ["BFA"],
      work_experience: [],
      skillList: ["Figma"],
      projects: [],
      accomplishments: [],
      competencies: [],
    },
  },
  {
    name: "Text-only / empty everything",
    input: {},
  },
  {
    name: "Minimal information",
    input: { candidate: { name: "Min" } },
  },
  {
    name: "Wrapped in data key",
    input: {
      data: {
        candidate: {
          name: "Wrapped",
          title: "",
          experienceYears: 0,
          education: [],
        },
        workExperience: [],
        skills: [],
        projects: [],
        competencies: [],
        achievements: [],
      },
    },
  },
];

function assertOk(name: string, input: unknown) {
  // Simulate root unwrap used by base extractor for data wrappers
  let payload = input;
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in (payload as object) &&
    typeof (payload as { data: unknown }).data === "object"
  ) {
    // base extractor normalizes data wrapper; schema also handles bare shapes
    payload = (payload as { data: unknown }).data;
  }

  const result = resumeExtractionSchema.safeParse(payload);
  if (!result.success) {
    console.error(`FAIL ${name}`);
    console.error(JSON.stringify(result.error.issues, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(
    `PASS ${name} → skills=${result.data.skills.length} roles=${result.data.workExperience.length} projects=${result.data.projects.length}`
  );
}

console.log("=== Schema resilience cases ===");
for (const c of cases) {
  assertOk(c.name, c.input);
}

console.log("\n=== JSON repair cases ===");
const jsonCases: Array<{ name: string; raw: string }> = [
  {
    name: "markdown fence",
    raw: '```json\n{"candidate":{"name":"A","title":"","experienceYears":0,"education":[]},"workExperience":[],"skills":[],"projects":[],"competencies":[],"achievements":[]}\n```',
  },
  {
    name: "trailing comma",
    raw: '{"candidate":{"name":"A","title":"","experienceYears":0,"education":[],},"workExperience":[],"skills":[],"projects":[],"competencies":[],"achievements":[],}',
  },
  {
    name: "extra prose",
    raw: 'Here is the JSON:\n{"candidate":{"name":"A","title":"","experienceYears":0,"education":[]},"workExperience":[],"skills":[],"projects":[],"competencies":[],"achievements":[]}\nThanks!',
  },
];

for (const c of jsonCases) {
  const { parsed, error } = parseJsonLenient(c.raw);
  if (parsed === null) {
    console.error(`FAIL JSON ${c.name}: ${error}`);
    process.exitCode = 1;
    continue;
  }
  const validated = resumeExtractionSchema.safeParse(parsed);
  if (!validated.success) {
    console.error(`FAIL JSON→Zod ${c.name}`);
    console.error(JSON.stringify(validated.error.issues, null, 2));
    process.exitCode = 1;
    continue;
  }
  console.log(`PASS JSON ${c.name}`);
}

if (process.exitCode) {
  console.error("\nResilience tests failed.");
} else {
  console.log("\nAll resilience tests passed.");
}
