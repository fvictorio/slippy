import { Cursor, TerminalKindExtensions } from "@nomicfoundation/slang/cst";

export function ignoreLeadingTrivia(cursor: Cursor) {
  while (
    cursor.goToNextTerminal() &&
    cursor.node.isTerminalNode() &&
    TerminalKindExtensions.isTrivia(cursor.node.kind)
  ) {
    // ignore trivia
  }
}
