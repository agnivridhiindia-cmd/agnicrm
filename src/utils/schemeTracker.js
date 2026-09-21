/**
 * Centralized Scheme-Based Activity Tracker Engine for Agni CRM
 *
 * Rules:
 * 1. Always-Compulsory Stages: CRM Creation -> Agreement -> Reports -> Final
 * 2. Variable Stages:
 *    - APPLICATION ONLY (5 Stages): PMEGP, PM MUDRA, CGTMSE, NAIFF, NLM, AHIDF, CGSS, Financial Assistant SC/ST
 *    - INTERVIEW ONLY (5 Stages): Private Funding, Equity Based Funding
 *    - APPLICATION + INTERVIEW (6 Stages): DIV Funding, NGO Elevation, NGO Development, CSR, Spark Grant, Growth Grant, MSME Design
 * 3. NO "Neither" case. Default fallback is APPLICATION with development warning.
 * 4. Fixed Stage Sequence: CRM Creation -> Agreement -> Reports -> Application? -> Interview? -> Final
 * 5. Strict Sequential Workflow: A stage CANNOT be completed unless EVERY preceding stage is completed.
 */

export const PROCESS_TYPES = {
  APPLICATION: "application",
  INTERVIEW: "interview",
  APPLICATION_INTERVIEW: "application_interview",
};

export const TRACKER_STAGE_IDS = {
  CRM_CREATION: "crm_creation",
  AGREEMENT: "agreement",
  REPORTS: "reports",
  APPLICATION: "application",
  INTERVIEW: "interview",
  FINAL: "final",
};

export const TRACKER_STAGES_DEFINITIONS = {
  [TRACKER_STAGE_IDS.CRM_CREATION]: {
    id: TRACKER_STAGE_IDS.CRM_CREATION,
    name: "CRM Creation",
    label: "CRM Creation",
    description: "Client registration & CRM file initialized",
    badgeColor: "#10b981",
  },
  [TRACKER_STAGE_IDS.AGREEMENT]: {
    id: TRACKER_STAGE_IDS.AGREEMENT,
    name: "Agreement",
    label: "Agreement",
    description: "Legal engagement & scheme terms executed",
    badgeColor: "#4e7cff",
  },
  [TRACKER_STAGE_IDS.REPORTS]: {
    id: TRACKER_STAGE_IDS.REPORTS,
    name: "Reports",
    label: "Reports",
    description: "Financial, project & compliance audit reports",
    badgeColor: "#9a74e9",
  },
  [TRACKER_STAGE_IDS.APPLICATION]: {
    id: TRACKER_STAGE_IDS.APPLICATION,
    name: "Application",
    label: "Application",
    description: "Official scheme application filing & portal submission",
    badgeColor: "#f2aa38",
  },
  [TRACKER_STAGE_IDS.INTERVIEW]: {
    id: TRACKER_STAGE_IDS.INTERVIEW,
    name: "Interview",
    label: "Interview",
    description: "Evaluation board interview & commercial presentation",
    badgeColor: "#ec4899",
  },
  [TRACKER_STAGE_IDS.FINAL]: {
    id: TRACKER_STAGE_IDS.FINAL,
    name: "Final",
    label: "Final",
    description: "Sanction / disbursement sign-off & scheme activation",
    badgeColor: "#10b981",
  },
};

/**
 * Canonical Scheme-to-ProcessType Mapping
 */
export const SCHEME_PROCESS_TYPE_MAP = {
  // --- APPLICATION ONLY (5 Stages) ---
  "PMEGP": PROCESS_TYPES.APPLICATION,
  "PM MUDRA": PROCESS_TYPES.APPLICATION,
  "CGTMSE": PROCESS_TYPES.APPLICATION,
  "NAIFF": PROCESS_TYPES.APPLICATION,
  "NLM": PROCESS_TYPES.APPLICATION,
  "AHIDF": PROCESS_TYPES.APPLICATION,
  "Animal Husbandry": PROCESS_TYPES.APPLICATION,
  "CGSS": PROCESS_TYPES.APPLICATION,
  "Seed Funding": PROCESS_TYPES.APPLICATION,
  "Financial Assistant SC/ST": PROCESS_TYPES.APPLICATION,

  // --- INTERVIEW ONLY (5 Stages) ---
  "Private Funding": PROCESS_TYPES.INTERVIEW,
  "Equity Based Funding": PROCESS_TYPES.INTERVIEW,

  // --- APPLICATION + INTERVIEW (6 Stages) ---
  "DIV": PROCESS_TYPES.APPLICATION_INTERVIEW,
  "DIV Funding": PROCESS_TYPES.APPLICATION_INTERVIEW,
  "NGO Elevation": PROCESS_TYPES.APPLICATION_INTERVIEW,
  "NGO Development": PROCESS_TYPES.APPLICATION_INTERVIEW,
  "CSR": PROCESS_TYPES.APPLICATION_INTERVIEW,
  "Spark Grant": PROCESS_TYPES.APPLICATION_INTERVIEW,
  "Growth Grant": PROCESS_TYPES.APPLICATION_INTERVIEW,
  "MSME Design": PROCESS_TYPES.APPLICATION_INTERVIEW,
};

/**
 * Aliases and legacy mappings for backward compatibility
 */
const SCHEME_ALIASES = {
  "pmegp": "PMEGP",
  "pmegp scheme": "PMEGP",
  "pm mudra": "PM MUDRA",
  "pm mudra scheme": "PM MUDRA",
  "mudra": "PM MUDRA",
  "mudra loan": "PM MUDRA",
  "cgtmse": "CGTMSE",
  "naiff": "NAIFF",
  "nlm": "NLM",
  "ahidf": "AHIDF",
  "ahide": "AHIDF",
  "animal husbandry": "Animal Husbandry",
  "animal husbandiary": "Animal Husbandry",
  "cgss": "CGSS",
  "seed funding": "Seed Funding",
  "seed funnding": "Seed Funding",
  "startup india seed scheme": "Seed Funding",
  "financial assistant sc/st": "Financial Assistant SC/ST",
  "financial assistant sc st": "Financial Assistant SC/ST",
  "stand-up india": "Financial Assistant SC/ST",
  "stand up india": "Financial Assistant SC/ST",

  "private funding": "Private Funding",
  "private funnding": "Private Funding",
  "equity based funding": "Equity Based Funding",
  "equity funding": "Equity Based Funding",
  "startup india": "Private Funding",

  "div": "DIV",
  "div funding": "DIV",
  "ngo elevation": "NGO Elevation",
  "ngo development": "NGO Development",
  "csr": "CSR",
  "csr grant": "CSR",
  "spark grant": "Spark Grant",
  "spare grant": "Spark Grant",
  "growth grant": "Growth Grant",
  "msme design": "MSME Design",
  "msme subsidy": "MSME Design",
  "enterprise growth scheme": "PMEGP",
  "retail scale-up program": "PM MUDRA",
  "textile machinery subsidy": "MSME Design",
  "fleet modernization grant": "Spark Grant",
  "artisan & msme capital scheme": "MSME Design",
  "healthcare infra grant": "DIV",
};

/**
 * Resolves the canonical scheme name
 * @param {string|object} schemeInput
 * @returns {string} Canonical scheme name
 */
export function getCanonicalSchemeName(schemeInput) {
  if (!schemeInput) return "PMEGP";
  let rawName = "";
  if (typeof schemeInput === "string") {
    rawName = schemeInput;
  } else if (typeof schemeInput === "object") {
    rawName = schemeInput.schemeName || schemeInput.serviceName || schemeInput.scheme || schemeInput.name || "";
  }
  let clean = rawName.trim();

  // If the raw string is a Payment Demand / Settlement, extract actual scheme or fallback
  if (isPaymentDemandOrSettlement(clean)) {
    const match = clean.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const extracted = match[1].replace(/payment|demand|settlement|request/gi, "").trim();
      if (extracted) {
        clean = extracted;
      } else {
        clean = "PMEGP";
      }
    } else {
      clean = "PMEGP";
    }
  }

  const lookupKey = clean.toLowerCase();
  if (lookupKey.includes("mudra")) {
    return "PM MUDRA";
  }
  if (SCHEME_ALIASES[lookupKey]) {
    return SCHEME_ALIASES[lookupKey];
  }
  if (SCHEME_PROCESS_TYPE_MAP[clean]) {
    return clean;
  }
  return clean || "PMEGP";
}

/**
 * Returns the process type ("application" | "interview" | "application_interview") for a scheme.
 * @param {string|object} scheme
 * @returns {string} process type
 */
export function getProcessTypeForScheme(scheme) {
  const canonical = getCanonicalSchemeName(scheme);
  if (SCHEME_PROCESS_TYPE_MAP[canonical]) {
    return SCHEME_PROCESS_TYPE_MAP[canonical];
  }

  // Safety fallback: Never produce a "neither" tracker
  console.warn(
    `[schemeTracker] Unknown scheme "${canonical}". Applying default "application" process type.`
  );
  return PROCESS_TYPES.APPLICATION;
}

/**
 * Returns human-readable label for a process type
 * @param {string|object} schemeOrProcessType
 * @returns {string} e.g. "Application", "Interview", "Application + Interview"
 */
export function getProcessTypeLabel(schemeOrProcessType) {
  let processType = schemeOrProcessType;
  if (!Object.values(PROCESS_TYPES).includes(processType)) {
    processType = getProcessTypeForScheme(schemeOrProcessType);
  }

  switch (processType) {
    case PROCESS_TYPES.APPLICATION:
      return "Application";
    case PROCESS_TYPES.INTERVIEW:
      return "Interview";
    case PROCESS_TYPES.APPLICATION_INTERVIEW:
      return "Application + Interview";
    default:
      return "Application";
  }
}

/**
 * Returns the ordered array of stage definition objects for a scheme.
 *
 * Sequence:
 * - Application Only: CRM Creation -> Agreement -> Reports -> Application -> Final
 * - Interview Only: CRM Creation -> Agreement -> Reports -> Interview -> Final
 * - App + Interview: CRM Creation -> Agreement -> Reports -> Application -> Interview -> Final
 *
 * @param {string|object} scheme
 * @returns {Array<object>} array of stage definition objects
 */
export function getTrackerStages(scheme) {
  const processType = getProcessTypeForScheme(scheme);
  const stageIds = [
    TRACKER_STAGE_IDS.CRM_CREATION,
    TRACKER_STAGE_IDS.AGREEMENT,
    TRACKER_STAGE_IDS.REPORTS,
  ];

  if (processType === PROCESS_TYPES.APPLICATION) {
    stageIds.push(TRACKER_STAGE_IDS.APPLICATION);
  } else if (processType === PROCESS_TYPES.INTERVIEW) {
    stageIds.push(TRACKER_STAGE_IDS.INTERVIEW);
  } else if (processType === PROCESS_TYPES.APPLICATION_INTERVIEW) {
    stageIds.push(TRACKER_STAGE_IDS.APPLICATION);
    stageIds.push(TRACKER_STAGE_IDS.INTERVIEW);
  } else {
    // Safety guarantee against any missing case
    stageIds.push(TRACKER_STAGE_IDS.APPLICATION);
  }

  stageIds.push(TRACKER_STAGE_IDS.FINAL);

  const totalCount = stageIds.length;

  return stageIds.map((id, index) => {
    const def = TRACKER_STAGES_DEFINITIONS[id];
    const stepNumber = index + 1;
    const percent = Math.round((stepNumber / totalCount) * 100);

    return {
      ...def,
      step: stepNumber,
      percent,
    };
  });
}

/**
 * Checks if a specific stage can be completed based on sequential requirements.
 * A stage can only be completed if all preceding stages are already completed.
 *
 * @param {string} stageName - Target stage name to check
 * @param {Array<object|string>} stages - Ordered list of stages for the CRM
 * @param {Array<string>} completedStages - Current list of completed stages
 * @returns {boolean} true if all preceding stages are completed
 */
export function canCompleteStage(stageName, stages = [], completedStages = []) {
  const stageNames = stages.map((s) => (typeof s === "object" ? s.name : s));
  const targetIndex = stageNames.indexOf(stageName);

  if (targetIndex === -1) return false;
  if (targetIndex === 0) return true; // CRM Creation is always at index 0

  // All preceding stages must be in completedStages
  const preceding = stageNames.slice(0, targetIndex);
  return preceding.every((prev) => completedStages.includes(prev));
}

/**
 * Normalizes legacy or raw completed step names to match the dynamic tracker stage names
 * AND enforces strict sequential workflow validity (no skips allowed).
 *
 * E.g., translates "Submission" -> "CRM Creation", "Doc Audit" -> "Agreement", "Manager Review" -> "Reports"
 *
 * @param {Array<string>} rawSteps
 * @param {Array<object>} stages
 * @returns {Array<string>} list of completed stage names
 */
export function normalizeCompletedStages(rawSteps = [], stages = []) {
  const validStageNames = stages.map((s) => s.name);
  const legacyTranslation = {
    "submission": "CRM Creation",
    "crm creation": "CRM Creation",
    "doc audit": "Agreement",
    "agreement": "Agreement",
    "manager review": "Reports",
    "reports": "Reports",
    "application": "Application",
    "interview": "Interview",
    "final approval": "Final",
    "final": "Final",
    "active & disbursed": "Final",
  };

  const rawSet = new Set();
  if (Array.isArray(rawSteps)) {
    rawSteps.forEach((step) => {
      if (!step) return;
      const cleanStep = step.toString().trim().toLowerCase();
      const mapped = legacyTranslation[cleanStep] || step;
      if (validStageNames.includes(mapped)) {
        rawSet.add(mapped);
      }
    });
  }

  // CRM Creation is always completed once the CRM record exists
  rawSet.add("CRM Creation");

  // Strictly enforce sequential workflow:
  // Iterate through validStageNames in order. Add to normalized array until the first incomplete stage is encountered.
  const sequentialCompleted = [];
  for (let i = 0; i < validStageNames.length; i++) {
    const stageName = validStageNames[i];
    if (i === 0 || rawSet.has(stageName)) {
      sequentialCompleted.push(stageName);
    } else {
      // Missing required stage encountered: STOP! No future stages can be completed.
      break;
    }
  }

  return sequentialCompleted;
}

/**
 * Computes the full dynamic tracker state for a given CRM record or scheme
 *
 * @param {object|string} crmOrScheme
 * @param {Array<string>} [explicitCompleted]
 * @returns {object} complete tracker state
 */
export function getTrackerState(crmOrScheme, explicitCompleted) {
  const scheme = typeof crmOrScheme === "object" && crmOrScheme !== null
    ? (crmOrScheme?.particularScheme || crmOrScheme?.schemeName || crmOrScheme?.scheme || crmOrScheme?.serviceName)
    : crmOrScheme;
  const stages = getTrackerStages(scheme);

  let rawCompleted = explicitCompleted;
  if (!rawCompleted && typeof crmOrScheme === "object" && crmOrScheme !== null) {
    const schemeLower = (scheme || "").toLowerCase();
    const isSec = crmOrScheme.isPrimary === false ||
      crmOrScheme.processType === "secondary" ||
      crmOrScheme.serviceType === "More Services" ||
      (typeof crmOrScheme.appId === "string" && (crmOrScheme.appId.endsWith("-S") || crmOrScheme.appId.endsWith("-E"))) ||
      (schemeLower.length > 0 && !schemeLower.includes("pmegp"));
    const isPrimary = isSec ? false : isClientPrimaryScheme(crmOrScheme, scheme);
    const defaultSteps = isPrimary
      ? (crmOrScheme?.completedSteps || crmOrScheme?.completedStages || ["CRM Creation"])
      : ["CRM Creation", "Agreement", "Reports"];
    rawCompleted = getSchemeCompletedStages(crmOrScheme, scheme, defaultSteps);
  } else if (!rawCompleted) {
    rawCompleted = [];
  }

  const completedStages = normalizeCompletedStages(rawCompleted, stages);
  const totalStages = stages.length;
  const progressPercent = totalStages > 0 ? Math.min(100, Math.round((completedStages.length / totalStages) * 100)) : 0;

  // Determine current active stage (latest completed stage or first stage)
  const firstUncompletedIndex = stages.findIndex((s) => !completedStages.includes(s.name));
  const isComplete = firstUncompletedIndex === -1;
  const currentStage = completedStages.length > 0 ? completedStages[completedStages.length - 1] : (stages[0]?.name || "CRM Creation");
  const currentStageIndex = isComplete ? totalStages - 1 : firstUncompletedIndex;

  // Locked stages are all stages strictly after the first uncompleted stage
  const lockedStages = isComplete
    ? []
    : stages.slice(firstUncompletedIndex + 1).map((s) => s.name);

  return {
    schemeName: getCanonicalSchemeName(scheme),
    processType: getProcessTypeForScheme(scheme),
    processTypeLabel: getProcessTypeLabel(scheme),
    stages,
    stageNames: stages.map((s) => s.name),
    completedStages,
    currentStage,
    currentStageIndex,
    lockedStages,
    progressPercent,
    totalStages,
    isComplete,
  };
}

/**
 * Gets scheme-specific completed stages for a client
 */
export function getSchemeCompletedStages(clientOrEmail, schemeName, defaultStages = []) {
  const emailKey = resolveClientEmail(clientOrEmail);
  const canonicalClean = schemeName ? getCanonicalSchemeName(schemeName).trim().toLowerCase() : "";
  const sNameClean = schemeName ? schemeName.trim().toLowerCase() : "";

  // ── Database completedSteps is the single source of truth ──

  const isSec = typeof clientOrEmail === "object" && clientOrEmail !== null && (
    clientOrEmail.isPrimary === false ||
    clientOrEmail.processType === "secondary" ||
    clientOrEmail.serviceType === "More Services" ||
    (typeof clientOrEmail.appId === "string" && (clientOrEmail.appId.endsWith("-S") || clientOrEmail.appId.endsWith("-E"))) ||
    (sNameClean.length > 0 && !sNameClean.includes("pmegp"))
  );
  const isPrimary = isSec ? false : isClientPrimaryScheme(clientOrEmail, schemeName);

  // ── 2. Fall back to client object's completedSteps (DB source of truth) ──
  if (typeof clientOrEmail === "object" && clientOrEmail !== null) {
    const explicit = clientOrEmail.completedSteps || clientOrEmail.completedStages;
    if (Array.isArray(explicit) && explicit.length > 0) {
      if (isPrimary) {
        return explicit;
      } else {
        // For secondary schemes, guarantee initial start at Reports stage (["CRM Creation", "Agreement", "Reports"])
        if (!explicit.includes("Reports")) {
          return Array.from(new Set(["CRM Creation", "Agreement", "Reports", ...explicit]));
        }
        return explicit;
      }
    }
  }

  if (!isPrimary) {
    return ["CRM Creation", "Agreement", "Reports"];
  }

  if (defaultStages && defaultStages.length > 0) {
    return defaultStages;
  }

  return ["CRM Creation"];
}

/**
 * Safely resolves client email address from string or client object
 */
export function resolveClientEmail(clientOrEmail) {
  if (!clientOrEmail) return "";
  if (typeof clientOrEmail === "string" && clientOrEmail.trim()) return clientOrEmail.trim().toLowerCase();
  
  if (clientOrEmail.email && clientOrEmail.email.trim()) return clientOrEmail.email.trim().toLowerCase();
  if (clientOrEmail.clientEmail && clientOrEmail.clientEmail.trim()) return clientOrEmail.clientEmail.trim().toLowerCase();

  // Fallback to company name if no email is found
  const comp = clientOrEmail.companyName || clientOrEmail.company || clientOrEmail.name || clientOrEmail.clientName;
  if (comp && comp.trim()) return getClientCompositeKey(comp, "");

  return "";
}

export function getPrimarySchemeForClient(clientOrEmail) {
  if (typeof clientOrEmail === "object" && clientOrEmail !== null) {
    if (clientOrEmail.isPrimary === true) {
      const p = clientOrEmail.primaryScheme || clientOrEmail.scheme || clientOrEmail.particularScheme || clientOrEmail.serviceName;
      if (p) return p.trim();
    }
  }
  return "";
}

export function isClientPrimaryScheme(clientOrEmail, schemeName) {
  if (!schemeName) return true;
  const sNameClean = schemeName.trim().toLowerCase();

  if (typeof clientOrEmail === "object" && clientOrEmail !== null) {
    if (clientOrEmail.isPrimary === false || clientOrEmail.processType === "secondary" || clientOrEmail.serviceType === "More Services") {
      return false;
    }
  }

  // First, explicitly reject any known secondary schemes by keyword
  const secondaryKeywords = [
    "cgtmse", "certificate", "certification", "licensing", "license", "dsc", "iso", "gst",
    "trademark", "itr", "csr-1", "darpan", "it infra", "cloud", "seo", "brand", "software", "marketing", "ad management", "compliance"
  ];
  if (secondaryKeywords.some((k) => sNameClean.includes(k))) {
    return false;
  }

  const primary = getPrimarySchemeForClient(clientOrEmail).toLowerCase();
  if (primary && primary !== sNameClean && !primary.includes(sNameClean) && !sNameClean.includes(primary)) {
    return false;
  }

  return true;
}

export function isPrimaryOrEligibleScheme(schemeName) {
  return isClientPrimaryScheme(null, schemeName);
}



/**
 * Saves scheme-specific completed stages for a client
 */
export function saveSchemeCompletedStages(clientOrEmail, schemeName, completedStages) {
  const emailKey = resolveClientEmail(clientOrEmail);
  if (!emailKey || !schemeName) return;
  try {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("agni_scheme_updated"));
    window.dispatchEvent(new Event("pipelineUpdated"));
  } catch (e) { }
}

export function getClientCompositeKey(companyName, email) {
  const comp = (companyName || "").trim().toLowerCase();
  const em = (email || "").trim().toLowerCase();
  if (comp && em) return `${comp}_${em}`.replace(/[^a-z0-9]/g, "_");
  if (comp) return comp.replace(/[^a-z0-9]/g, "_");
  if (em) return em.replace(/[^a-z0-9]/g, "_");
  return "default";
}

/**
 * Checks if a plan object, scheme request, or string represents a Payment Demand or Payment Settlement
 */
export function isPaymentDemandOrSettlement(itemOrName) {
  if (!itemOrName) return false;
  if (typeof itemOrName === "string") {
    const s = itemOrName.toLowerCase().trim();
    return (
      s.includes("payment demand") ||
      s.includes("payment settlement") ||
      s.includes("payment request") ||
      s.includes("demand for") ||
      s.includes("settlement for")
    );
  }
  if (typeof itemOrName === "object") {
    if (itemOrName.isPaymentSettlement === true) return true;

    const rawScheme = typeof itemOrName.scheme === "string"
      ? itemOrName.scheme
      : (typeof itemOrName.scheme === "object" && itemOrName.scheme !== null ? itemOrName.scheme?.name : "");

    const nameStr = String(
      itemOrName.schemeName ||
      itemOrName.serviceName ||
      itemOrName.name ||
      rawScheme ||
      itemOrName.title ||
      itemOrName.particularScheme ||
      ""
    ).toLowerCase();

    const tagStr = typeof itemOrName.tag === "string" ? itemOrName.tag.toLowerCase() : "";
    const catStr = typeof itemOrName.category === "string" ? itemOrName.category.toLowerCase() : "";
    const reqTypeStr = typeof itemOrName.requestType === "string" ? itemOrName.requestType.toLowerCase() : "";

    return (
      nameStr.includes("payment demand") ||
      nameStr.includes("payment settlement") ||
      nameStr.includes("payment request") ||
      nameStr.includes("demand for") ||
      nameStr.includes("settlement for") ||
      tagStr.includes("payment settlement") ||
      tagStr.includes("payment demand") ||
      catStr.includes("payment settlement") ||
      catStr.includes("payment demand") ||
      reqTypeStr.includes("payment settlement") ||
      reqTypeStr.includes("payment demand") ||
      reqTypeStr.includes("payment request")
    );
  }
  return false;
}

/**
 * Retrieves all enrolled scheme trackers for a client
 */
export function getClientAllSchemeTrackers(client, allClientsForSameEmail = []) {
  if (!client) return [];
  const emailKey = resolveClientEmail(client);
  const companyName = client.company || client.companyName || client.name || "";
  const compKey = getClientCompositeKey(companyName, emailKey);

  const schemeNamesSet = new Set();
  const addSchemeName = (name) => {
    if (!name || isPaymentDemandOrSettlement(name)) return;
    const canonical = getCanonicalSchemeName(name);
    schemeNamesSet.add(canonical);
  };

  // Add scheme from this client record
  if (client.scheme) addSchemeName(client.scheme);
  if (client.particularScheme) addSchemeName(client.particularScheme);
  if (client.serviceName) addSchemeName(client.serviceName);

  // ── Cross-reference sibling records for same email (primary + all secondary) ──
  // Ensures that when viewing a secondary scheme dossier, the primary scheme is also included
  if (emailKey && Array.isArray(allClientsForSameEmail) && allClientsForSameEmail.length > 0) {
    allClientsForSameEmail.forEach((sibling) => {
      const sibEmail = resolveClientEmail(sibling);
      if (sibEmail && sibEmail === emailKey) {
        if (sibling.scheme) addSchemeName(sibling.scheme);
        if (sibling.particularScheme) addSchemeName(sibling.particularScheme);
        if (sibling.serviceName) addSchemeName(sibling.serviceName);
      }
    });
  }

  try {
    const compSaved = localStorage.getItem(`agni_approved_client_plans_${compKey}`);
    if (compSaved) {
      const parsed = JSON.parse(compSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((p) => {
          if (!isPaymentDemandOrSettlement(p)) {
            if (p.name) addSchemeName(p.name);
            if (p.schemeName) addSchemeName(p.schemeName);
            if (p.title) addSchemeName(p.title);
          }
        });
      }
    }

    const savedPending = localStorage.getItem("agni_pending_scheme_requests");
    if (savedPending) {
      const parsedPending = JSON.parse(savedPending);
      if (Array.isArray(parsedPending)) {
        parsedPending.forEach((r) => {
          if (!isPaymentDemandOrSettlement(r)) {
            const compMatch = !companyName || (r.companyName || r.clientName || "").trim().toLowerCase() === companyName.trim().toLowerCase();
            if (compMatch && r.clientEmail && r.clientEmail.toLowerCase().trim() === emailKey && r.status && r.status.includes("Approved")) {
              if (r.schemeName) addSchemeName(r.schemeName);
            }
          }
        });
      }
    }
  } catch (e) { }

  const schemeList = Array.from(schemeNamesSet).filter((sName) => !isPaymentDemandOrSettlement(sName));
  if (schemeList.length === 0) {
    const fallbackScheme = client.scheme && !isPaymentDemandOrSettlement(client.scheme) ? client.scheme : "PMEGP";
    schemeList.push(fallbackScheme);
  }

  // Sort: primary (eligible) schemes first, then secondary (more services)
  schemeList.sort((a, b) => {
    const aIsPrimary = isClientPrimaryScheme(client, a);
    const bIsPrimary = isClientPrimaryScheme(client, b);
    if (aIsPrimary && !bIsPrimary) return -1;
    if (!aIsPrimary && bIsPrimary) return 1;
    return 0;
  });

  return schemeList.map((sName) => {
    // Find the specific sibling record for this scheme (for correct completedSteps)
    const schemeClient = [client, ...allClientsForSameEmail].find((c) => {
      const cScheme = getCanonicalSchemeName(c.scheme || c.serviceName || c.particularScheme || "");
      return cScheme.toLowerCase() === sName.toLowerCase();
    }) || client;

    const isPrimary = isClientPrimaryScheme(schemeClient, sName);
    const defaultSteps = isPrimary
      ? (schemeClient.completedSteps || schemeClient.completedStages || ["CRM Creation"])
      : ["CRM Creation", "Agreement", "Reports"];

    const completed = getSchemeCompletedStages(schemeClient, sName, defaultSteps);
    const tracker = getTrackerState({ scheme: sName }, completed);
    return {
      schemeName: sName,
      isPrimary,
      tracker,
    };
  });
}

export const ALL_SCHEMES_LIST = Object.keys(SCHEME_PROCESS_TYPE_MAP);
