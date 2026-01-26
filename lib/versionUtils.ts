/**
 * Version comparison utilities for semver-like version strings
 * Supports formats like "1.0.0", "1.0", "1.0.3"
 */

/**
 * Parse a version string into an array of numbers
 * @param version - Version string like "1.0.0" or "1.0"
 * @returns Array of version numbers [major, minor, patch]
 */
export function parseVersion(version: string): number[] {
  if (!version || typeof version !== 'string') {
    return [0, 0, 0];
  }

  const parts = version.split('.').map((part) => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });

  // Ensure we always have at least 3 parts [major, minor, patch]
  while (parts.length < 3) {
    parts.push(0);
  }

  return parts.slice(0, 3);
}

/**
 * Compare two version strings
 * @param versionA - First version string
 * @param versionB - Second version string
 * @returns -1 if versionA < versionB, 0 if equal, 1 if versionA > versionB
 */
export function compareVersions(versionA: string, versionB: string): -1 | 0 | 1 {
  const partsA = parseVersion(versionA);
  const partsB = parseVersion(versionB);

  for (let i = 0; i < 3; i++) {
    if (partsA[i] < partsB[i]) return -1;
    if (partsA[i] > partsB[i]) return 1;
  }

  return 0;
}

/**
 * Check if version A is less than version B
 */
export function isVersionLessThan(versionA: string, versionB: string): boolean {
  return compareVersions(versionA, versionB) === -1;
}

/**
 * Check if version A is greater than version B
 */
export function isVersionGreaterThan(versionA: string, versionB: string): boolean {
  return compareVersions(versionA, versionB) === 1;
}

/**
 * Check if version A is less than or equal to version B
 */
export function isVersionLessThanOrEqual(versionA: string, versionB: string): boolean {
  return compareVersions(versionA, versionB) <= 0;
}

/**
 * Check if version A is greater than or equal to version B
 */
export function isVersionGreaterThanOrEqual(versionA: string, versionB: string): boolean {
  return compareVersions(versionA, versionB) >= 0;
}

/**
 * Check if two versions are equal
 */
export function isVersionEqual(versionA: string, versionB: string): boolean {
  return compareVersions(versionA, versionB) === 0;
}

/**
 * Validate that a string is a valid version format
 */
export function isValidVersion(version: string): boolean {
  if (!version || typeof version !== 'string') {
    return false;
  }

  const pattern = /^\d+(\.\d+){0,2}$/;
  return pattern.test(version);
}
