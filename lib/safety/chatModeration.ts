type Category =
  | "SEXUAL"
  | "HARASSMENT"
  | "HATE"
  | "THREAT"
  | "DOXXING"
  | "GROOMING"
  | "SCAM"
  | "SPAM"
  | "PII"
  | "LINK";

type Action = "ALLOW" | "SOFT_BLOCK" | "HARD_BLOCK";

type ModerateArgs = {
  text: string;
  isUnlocked: boolean;
};

type ModerateResult = {
  action: Action;
  categories: Category[];
  sanitizedText: string;
  messageForUser?: string;
};

function normalize(input: string) {
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function redactPII(input: string) {
  let t = input;

  t = t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email verwijderd]");

  t = t.replace(
    /(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g,
    (m) => (m.replace(/\D/g, "").length >= 9 ? "[telefoon verwijderd]" : m)
  );

  t = t.replace(/\b([A-Z]{2}\d{2}[A-Z0-9]{11,30})\b/g, "[iban verwijderd]");

  t = t.replace(/(^|\s)@([a-z0-9_]{3,30})\b/gi, "$1[@handle verwijderd]");

  return t;
}

function detectLinks(input: string) {
  return /(https?:\/\/|www\.)\S+/i.test(input);
}

function neutralizeLinks(input: string) {
  return input
    .replace(/https?:\/\//gi, (m) => (m.toLowerCase().startsWith("https") ? "hxxps://" : "hxxp://"))
    .replace(/\bwww\./gi, "w\u200Bw.")
    .replace(/\b([a-z0-9-]+)\.([a-z]{2,})(\b|\/)/gi, (_m, a, b, tail) => `${a}[.]${b}${tail}`)
    .replace(/(^|\s)@([a-z0-9_]{2,32})\b/gi, (_m, pre, u) => `${pre}@\u200B${u}`);
}

function containsExplicitSexual(input: string) {
  const t = input.toLowerCase();
  const hard = ["neuken", "pijpen", "blowjob", "sex met", "anal", "cum", "porn", "naaktfoto", "nudes", "dickpic"];
  return hard.some((w) => t.includes(w));
}

function containsHarassmentOrHate(input: string) {
  const t = input.toLowerCase();
  const bad = ["kanker", "hoer", "mongool", "idioot", "ga dood"];
  return bad.some((w) => t.includes(w));
}

function containsThreat(input: string) {
  const t = input.toLowerCase();
  const bad = ["ik vermoord", "ik maak je kapot", "ik vind je", "ik kom je halen", "ik steek je neer"];
  return bad.some((w) => t.includes(w));
}

function containsGrooming(input: string) {
  const t = input.toLowerCase();
  const bad = ["ben je 15", "ben je 14", "ben je minderjarig", "stuur foto zonder kleren", "geheim houden"];
  return bad.some((w) => t.includes(w));
}

function containsScam(input: string) {
  const t = input.toLowerCase();
  const bad = ["whatsapp", "telegram", "crypto", "investment", "investeer", "cashapp", "stuur geld", "bankrekening", "onlyfans"];
  return bad.some((w) => t.includes(w));
}

function detectPII(input: string) {
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(input);
  const digits = input.replace(/\D/g, "");
  const hasPhone = digits.length >= 9 && digits.length <= 15;
  const hasIban = /\b([A-Z]{2}\d{2}[A-Z0-9]{11,30})\b/i.test(input);
  const hasHandle = /(^|\s)@([a-z0-9_]{3,30})\b/i.test(input);
  return hasEmail || hasPhone || hasIban || hasHandle;
}

export function redactForEvidence(text: string) {
  const n = normalize(text);
  return redactPII(n);
}

/**
 * ✅ Use this for GET endpoints (threads/messages) when match is locked.
 * It prevents auto-linking in clients even if they render plain text.
 */
export function neutralizeLinksForDisplay(text: string, isUnlocked: boolean) {
  const n = normalize(text);
  if (isUnlocked) return n;
  return neutralizeLinks(n);
}

export function moderateChatText(args: ModerateArgs): ModerateResult {
  const base = normalize(args.text);
  if (!base) {
    return { action: "SOFT_BLOCK", categories: ["SPAM"], sanitizedText: "", messageForUser: "Leeg bericht." };
  }

  const categories: Category[] = [];
  let action: Action = "ALLOW";
  let out = base;

  if (detectLinks(out)) {
    categories.push("LINK");
    if (!args.isUnlocked) out = neutralizeLinks(out);
  }

  if (detectPII(out)) {
    categories.push("PII");
    if (!args.isUnlocked) {
      action = "SOFT_BLOCK";
      return {
        action,
        categories,
        sanitizedText: redactPII(out),
        messageForUser: "Deel geen contactgegevens voor de unlock (telefoon/e-mail/IBAN/handles).",
      };
    } else {
      out = redactPII(out);
    }
  }

  if (containsScam(out)) {
    categories.push("SCAM");
    action = args.isUnlocked ? "SOFT_BLOCK" : "HARD_BLOCK";
  }

  if (containsThreat(out)) {
    categories.push("THREAT");
    action = "HARD_BLOCK";
  }

  if (containsGrooming(out)) {
    categories.push("GROOMING");
    action = "HARD_BLOCK";
  }

  if (containsHarassmentOrHate(out)) {
    categories.push("HARASSMENT");
    action = action === "HARD_BLOCK" ? "HARD_BLOCK" : "SOFT_BLOCK";
  }

  if (containsExplicitSexual(out)) {
    categories.push("SEXUAL");
    action = "HARD_BLOCK";
  }

  if (categories.length === 0) return { action: "ALLOW", categories: [], sanitizedText: out };

  if (action === "SOFT_BLOCK") {
    return {
      action,
      categories,
      sanitizedText: out,
      messageForUser: "Dit bericht is niet verstuurd. Hou het respectvol en deel geen gevoelige info.",
    };
  }

  return {
    action: "HARD_BLOCK",
    categories,
    sanitizedText: out,
    messageForUser: "Dit bericht is geblokkeerd wegens ongepaste of onveilige inhoud.",
  };
}