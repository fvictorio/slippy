import { Rule, LintResult, RuleContext } from "./types.js";
import { Query } from "@nomicfoundation/slang/cst";

export class SortImports implements Rule {
  public static ruleName = "sort-imports";
  public static recommended = false;

  public run({ file }: RuleContext): LintResult[] {
    const cursor = file.createTreeCursor();

    const matches = cursor.query([
      Query.create(`
      [ImportDirective
        @importKeyword import_keyword: [ImportKeyword]
        clause: [ImportClause [_ [StringLiteral @importPath variant: [_]]]]
      ]
    `),
    ]);

    const importPaths = [...matches]
      .flatMap((match) => match.captures.importPath ?? [])
      .map((cursor) => {
        return {
          cursor,
          path: cursor.node.unparse().trim().slice(1, -1),
        };
      });

    const sortedPaths = importPaths
      .slice()
      .sort((a, b) => compareImportPaths(a.path, b.path));

    for (let i = 0; i < importPaths.length; i++) {
      if (importPaths[i].cursor.node.id !== sortedPaths[i].cursor.node.id) {
        return [
          {
            rule: SortImports.ruleName,
            sourceId: file.id,
            message: `Import of "${importPaths[i].path}" should come after import of "${sortedPaths[i].path}"`,
            line: importPaths[i].cursor.textRange.start.line,
            column: importPaths[i].cursor.textRange.start.column,
          },
        ];
      }
    }

    return [];
  }
}

export function compareImportPaths(a: string, b: string): number {
  const aIsRelative = a.startsWith(".");
  const bIsRelative = b.startsWith(".");

  if (a === b) {
    return 0;
  }

  if (!aIsRelative && bIsRelative) {
    return -1;
  }
  if (aIsRelative && !bIsRelative) {
    return 1;
  }
  if (!aIsRelative && !bIsRelative) {
    return a.localeCompare(b);
  }

  const aParts = a.split("/");
  const bParts = b.split("/");

  const aStartsWithDot = aParts[0] === ".";
  const bStartsWithDot = bParts[0] === ".";

  if (aStartsWithDot && !bStartsWithDot) {
    return 1;
  }
  if (!aStartsWithDot && bStartsWithDot) {
    return -1;
  }

  // Compare the rest of the path segments
  const minLength = Math.min(aParts.length, bParts.length);
  for (let i = 0; i < minLength; i++) {
    if (aParts[i] !== bParts[i]) {
      return aParts[i].localeCompare(bParts[i]);
    }
  }

  // If all compared segments are equal, the shorter path is "less than" the longer one
  if (aParts.length !== bParts.length) {
    return aParts.length - bParts.length;
  }

  // If the segments are equal in length and content, they are equal
  // and we should not reach here
  throw new Error("Unreachable code: paths are equal but not caught earlier");
}
