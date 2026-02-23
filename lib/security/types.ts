export const RiskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type RiskLevel = (typeof RiskLevels)[number];

export const SecurityEventTypes = [
  "REGISTER",
  "LOGIN_SUCCESS",
  "LOGIN_FAIL",
  "LOGOUT",
  "OTP_REQUEST",
  "OTP_VERIFY_SUCCESS",
  "OTP_VERIFY_FAIL",
  "PASSWORD_CHANGE",
  "PROFILE_UPDATE",
  "PHOTO_UPLOAD",
  "PHOTO_DELETE",
  "PHOTO_SWAP",
  "DISCOVER_VIEW",
  "LIKE",
  "SUPERLIKE",
  "SKIP",
  "MESSAGE_SEND",
  "MESSAGE_BLOCKED", // ✅ NEW
  "MATCH_CREATE",
  "PHOTOS_UNLOCK",
  "RATE_LIMIT_HIT",
  "CSRF_BLOCK",
  "SAME_ORIGIN_BLOCK",
  "BLOCKED_ACTION",
  "DEVICE_NEW",
  "DEVICE_MISMATCH",
  "IP_CHANGE",
  "CITY_CHANGE",
  "RAPID_ACTIONS",
  "SUSPICIOUS_PATTERN",
  "REPORT_CREATE", // ✅ NEW (handig)
  "USER_BLOCK",    // ✅ NEW (handig)
] as const;

export type SecurityEventType = (typeof SecurityEventTypes)[number];