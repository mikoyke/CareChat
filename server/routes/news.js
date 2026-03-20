const express = require("express");
const router = express.Router();
const https = require("https");
const { authenticate } = require("../middleware/auth");

const cache = {};

const QUERIES = {
  nurse: "nursing OR medication safety OR hospital clinical guidelines",
  crc: "clinical trials OR FDA guidance OR GCP pharmaceutical",
};

const FALLBACK = {
  nurse: [
    {
      title: "FDA Updates Vancomycin Dosing Recommendations",
      summary: "AUC-guided monitoring is now the preferred method over trough-only monitoring for optimizing vancomycin therapy and reducing nephrotoxicity risk.",
      image: null,
      link: "https://www.fda.gov/drugs/drug-safety-and-availability/drug-safety-communications",
      publishedAt: null,
      source: "FDA Drug Safety",
      isLive: false,
    },
    {
      title: "Updated Sepsis Bundle Guidelines — Hour-1 Bundle",
      summary: "SCCM reaffirms the Hour-1 Bundle: measure lactate, obtain blood cultures before antibiotics, administer broad-spectrum antibiotics, and begin fluid resuscitation.",
      image: null,
      link: "https://www.sccm.org/Clinical-Resources/Guidelines/Guidelines/Surviving-Sepsis-Campaign",
      publishedAt: null,
      source: "Clinical Guidelines",
      isLive: false,
    },
    {
      title: "New Guidance on Safe Opioid Administration in Inpatient Settings",
      summary: "Recommendations emphasize multimodal analgesia, standardized monitoring protocols, and naloxone availability for all patients receiving opioid therapy.",
      image: null,
      link: "https://www.ismp.org/guidelines",
      publishedAt: null,
      source: "ISMP",
      isLive: false,
    },
    {
      title: "Reminder: Hand Hygiene Compliance and HAI Prevention",
      summary: "CDC reinforces five moments of hand hygiene. Studies show compliance above 80% reduces healthcare-associated infections by up to 40%.",
      image: null,
      link: "https://www.cdc.gov/handhygiene",
      publishedAt: null,
      source: "CDC",
      isLive: false,
    },
    {
      title: "Drug Shortage Alert: IV Fluid Supply Updates",
      summary: "ASHP provides updated availability status for normal saline and lactated Ringer's. Institutions encouraged to implement conservation protocols.",
      image: null,
      link: "https://www.ashp.org/drug-shortages",
      publishedAt: null,
      source: "ASHP Drug Shortages",
      isLive: false,
    },
  ],
  crc: [
    {
      title: "FDA Releases Updated ICH E6(R3) GCP Guideline",
      summary: "The revised Good Clinical Practice guideline modernizes oversight approaches, emphasizing risk-proportionate monitoring and centralized review strategies for clinical trials.",
      image: null,
      link: "https://www.fda.gov/science-research/clinical-trials-and-human-subject-protection/ich-e6r3-good-clinical-practice",
      publishedAt: null,
      source: "FDA Guidance",
      isLive: false,
    },
    {
      title: "NIH Updates Policy on Inclusion Across the Lifespan",
      summary: "Revised policy requires justification when children or older adults are excluded from NIH-funded clinical research, expanding inclusion requirements.",
      image: null,
      link: "https://grants.nih.gov/policy/inclusion/lifespan.htm",
      publishedAt: null,
      source: "NIH",
      isLive: false,
    },
    {
      title: "OHRP Guidance: Informed Consent Form Simplification",
      summary: "New OHRP recommendations encourage concise, readable consent documents. Key information should appear on a single page at the beginning of the form.",
      image: null,
      link: "https://www.hhs.gov/ohrp/regulations-and-policy",
      publishedAt: null,
      source: "OHRP",
      isLive: false,
    },
    {
      title: "FDA Safety Reporting Requirements for IND Studies",
      summary: "Reminder of 15-day expedited reporting requirements for unexpected serious adverse drug reactions. Annual IND safety reports must include all SUSARs.",
      image: null,
      link: "https://www.fda.gov/science-research/clinical-trials-and-human-subject-protection/reporting-serious-problems-fda",
      publishedAt: null,
      source: "FDA Guidance",
      isLive: false,
    },
    {
      title: "ClinicalTrials.gov Modernization Act — Registration Updates",
      summary: "FDARA Section 3022 expands registration and results reporting requirements. Applicable clinical trials must submit results within 12 months of primary completion date.",
      image: null,
      link: "https://clinicaltrials.gov/policy",
      publishedAt: null,
      source: "ClinicalTrials.gov",
      isLive: false,
    },
  ],
};

function fetchNewsApi(query, apiKey) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      q: query,
      language: "en",
      sortBy: "publishedAt",
      pageSize: "5",
      apiKey,
    });
    const url = `https://newsapi.org/v2/everything?${params}`;
    https
      .get(url, { headers: { "User-Agent": "RondocNewsBot/1.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse NewsAPI response"));
          }
        });
      })
      .on("error", reject);
  });
}

router.get("/", authenticate, async (req, res) => {
  const role = req.user.role;
  if (role === "admin") return res.json([]);

  const now = Date.now();
  if (cache[role] && cache[role].expiresAt > now) {
    return res.json(cache[role].data);
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn("[news] NEWS_API_KEY not set, using fallback");
    return res.json(FALLBACK[role] || []);
  }

  try {
    const query = QUERIES[role];
    console.log(`[news] Fetching NewsAPI for role=${role}, query="${query}"`);
    const json = await fetchNewsApi(query, apiKey);

    if (json.status !== "ok") {
      console.error("[news] NewsAPI error:", json.message || json.status);
      return res.json(FALLBACK[role] || []);
    }

    const articles = (json.articles || []).map((a) => ({
      title: a.title || "",
      summary: a.description || "",
      image: a.urlToImage || null,
      link: a.url || "",
      publishedAt: a.publishedAt || null,
      source: a.source?.name || "",
      isLive: true,
    }));

    console.log(`[news] NewsAPI returned ${articles.length} articles for role=${role}`);
    cache[role] = { data: articles, expiresAt: now + 60 * 60 * 1000 };
    res.json(articles);
  } catch (err) {
    console.error("[news] NewsAPI fetch failed:", err.message);
    res.json(FALLBACK[role] || []);
  }
});

module.exports = router;
