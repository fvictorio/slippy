import { Fix } from "../rules/types.js";

export function getAppliableFixes(fixes: Fix[]): Fix[] {
  const sortedFixes = fixes
    .map((fix) => fix.slice().sort((a, b) => b.range[0] - a.range[0]))
    .sort((a, b) => b[0].range[0] - a[0].range[0]);

  const appliableFixes = sortedFixes.slice(0, 1);

  for (const existingFix of sortedFixes.slice(1)) {
    if (appliableFixes.some((fix) => fixOverlaps(existingFix, fix))) {
      continue;
    }

    appliableFixes.push(existingFix);
  }

  return appliableFixes;
}

function fixOverlaps(fixA: Fix, fixB: Fix): boolean {
  for (const changeA of fixA) {
    for (const changeB of fixB) {
      if (changeOverlaps(changeA.range, changeB.range)) {
        return true;
      }
    }
  }

  return false;
}

export function changeOverlaps(
  changeA: [number, number],
  changeB: [number, number],
): boolean {
  return changeA[0] < changeB[1] && changeB[0] < changeA[1];
}
