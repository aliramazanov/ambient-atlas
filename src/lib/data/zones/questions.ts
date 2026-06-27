import type { GlobalQuestion } from "./types";

export const questions: GlobalQuestion[] = [
  {
    id: "birth-season",
    name: "Birth-season effects",
    desc: "Risk for schizophrenia, multiple sclerosis and type-1 diabetes shifts with birth month. The schizophrenia signal is small but reproducible; the cause (gestational vitamin D, seasonal infection) is unresolved, and much may be confounding.",
    citations: [
      {
        type: "primary",
        ref: "Coury et al. 2023, Schizophr Res",
        url: "https://pubmed.ncbi.nlm.nih.gov/36682315/",
        openAccess: false,
      },
      {
        type: "skeptical",
        ref: "Fiddes et al. 2013, Ann Neurol (MS artifact)",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3748787/",
        openAccess: true,
      },
    ],
  },
  {
    id: "weather-sensitivity",
    name: "Barometric / weather sensitivity",
    desc: "Many report pressure-change-triggered migraine and joint pain. Plausible but weak and individually variable; hard to study because you cannot blind someone to the weather.",
    citations: [
      {
        type: "review",
        ref: "Denney et al. 2024, Curr Pain Headache Rep",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10940451/",
        openAccess: true,
      },
    ],
  },
  {
    id: "atmospheric-electric-field",
    name: "Atmospheric electric field",
    desc: "A vertical fair-weather field of about 100 V/m sits at the surface and you stand in it constantly. The physics is mainstream; whether it couples to human physiology at all is essentially unstudied. The closest twin to the South Atlantic Anomaly question.",
    citations: [
      {
        type: "review",
        ref: "Hunting et al. 2021, Int J Biometeorol",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7782408/",
        openAccess: true,
      },
    ],
  },
  {
    id: "old-friends-microbiome",
    name: "Environmental microbiome ('old friends')",
    desc: 'Soil, water and animal microbes encountered in early life shape immune development. The farm effect is real (roughly halved asthma and allergy), but it is causally tangled and the "too clean" framing is not supported.',
    citations: [
      {
        type: "review",
        ref: "von Mutius 2021, Front Immunol",
        url: "https://doi.org/10.3389/fimmu.2021.635522",
        openAccess: true,
        doi: "10.3389/fimmu.2021.635522",
      },
    ],
  },
  {
    id: "vitamin-d-latitude",
    name: "Vitamin D / latitude gradient",
    desc: "Multiple sclerosis prevalence rises with latitude, a highly reproducible pattern set early in life. Causation is debated: supplementation trials disappoint, and latitude may tag UV or early infection rather than vitamin D itself.",
    citations: [
      {
        type: "primary",
        ref: "Sabel et al. 2021, Brain",
        url: "https://doi.org/10.1093/brain/awab104",
        openAccess: true,
        doi: "10.1093/brain/awab104",
      },
      {
        type: "skeptical",
        ref: "Gombash et al. 2022, Front Neurol",
        url: "https://doi.org/10.3389/fneur.2022.796933",
        openAccess: true,
        doi: "10.3389/fneur.2022.796933",
      },
    ],
  },
  {
    id: "natural-background-radiation",
    name: "Natural ionizing background (everywhere)",
    desc: "Everyone receives roughly 2.4 mSv/year of natural radiation (cosmic, terrestrial gamma, ingested radionuclides, and radon as the largest share). Well established and non-contested; the baseline for the whole radiation tier.",
    citations: [
      {
        type: "agency",
        ref: "UNSCEAR 2008, Vol I Annex B",
        url: "https://www.unscear.org/unscear/en/publications/2008_1.html",
        openAccess: true,
      },
    ],
  },
  {
    id: "seasonal-viral-ebv",
    name: "Seasonal viral exposure (EBV and more)",
    desc: "Epstein-Barr virus is now seen as a necessary (not sufficient) cause of multiple sclerosis after a ~32-fold risk rise post-seroconversion. Influenza as a cardiovascular trigger is moderate; prenatal flu and schizophrenia is suggestive and inconsistent.",
    citations: [
      {
        type: "primary",
        ref: "Bjornevik et al. 2022, Science",
        url: "https://doi.org/10.1126/science.abj8222",
        openAccess: false,
        doi: "10.1126/science.abj8222",
      },
    ],
  },
  {
    id: "schumann-resonance",
    name: "Schumann resonance (flagged unreliable)",
    desc: 'The Earth-ionosphere resonance near 7.83 Hz is real geophysics, but health and "brainwave entrainment" claims lack credible evidence and are mostly nocebo and motivated interpretation. Included only to mark the boundary with pseudoscience.',
    citations: [
      {
        type: "skeptical",
        ref: "Schumann resonances conspiracy theories (overview)",
        url: "https://en.wikipedia.org/wiki/Schumann_resonances_conspiracy_theories",
        openAccess: true,
      },
    ],
  },
];
