import { Cursor, TerminalKindExtensions } from "@nomicfoundation/slang/cst";

export function ignoreLeadingTrivia(cursor: Cursor) {
  if (
    cursor.node.isTerminalNode() &&
    !TerminalKindExtensions.isTrivia(cursor.node.kind)
  ) {
    // if we are already in a terminal node that is not a trivia, we just return
    return;
  }

  while (
    cursor.goToNextTerminal() &&
    cursor.node.isTerminalNode() &&
    TerminalKindExtensions.isTrivia(cursor.node.kind)
  ) {
    // ignore trivia
  }
}
