import { Cursor, Query } from "@nomicfoundation/slang/cst";

export function matchesQuery(cursor: Cursor, query: string): boolean {
  const matches = [...cursor.query([Query.create(query)])];
  return matches.length > 0;
}
