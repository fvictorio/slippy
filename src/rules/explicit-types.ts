import * as z from "zod";
import {
  Diagnostic,
  RuleContext,
  RuleDefinition,
  RuleWithConfig,
} from "./types.js";
import { TerminalKind, TextRange } from "@nomicfoundation/slang/cst";
import { AssertionError } from "../errors.js";

const ConfigSchema = z.enum(["always", "never"]).default("always");

type Config = z.infer<typeof ConfigSchema>;

export const ExplicitTypes: RuleDefinition<Config> = {
  name: "explicit-types",
  recommended: true,
  parseConfig: (config: unknown) => {
    return ConfigSchema.parse(config);
  },
  create: function (config) {
    return new ExplicitTypesRule(this.name, config);
  },
};

class ExplicitTypesRule implements RuleWithConfig<Config> {
  public constructor(
    public name: string,
    public config: Config,
  ) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    while (
      cursor.goToNextTerminalWithKinds([
        TerminalKind.UintKeyword,
        TerminalKind.IntKeyword,
        TerminalKind.UfixedKeyword,
        TerminalKind.FixedKeyword,
      ])
    ) {
      const typeText = cursor.node.unparse();

      if (this.config === "always") {
        if (
          typeText === "uint" ||
          typeText === "int" ||
          typeText === "ufixed" ||
          typeText === "fixed"
        ) {
          diagnostics.push(
            this._buildDiagnostic(typeText, file.id, cursor.textRange),
          );
        }
      } else {
        if (
          typeText === "uint256" ||
          typeText === "int256" ||
          typeText === "ufixed128x18" ||
          typeText === "fixed128x18"
        ) {
          diagnostics.push(
            this._buildDiagnostic(typeText, file.id, cursor.textRange),
          );
        }
      }
    }

    return diagnostics;
  }

  private _buildDiagnostic(
    typeText: string,
    sourceId: string,
    textRange: TextRange,
  ): Diagnostic {
    const correctType =
      this.config === "always" ? toExplicit(typeText) : toImplicit(typeText);

    return {
      rule: this.name,
      sourceId,
      message: `${this.config === "always" ? "implicit" : "explicit"} type '${typeText}' should be avoided`,
      line: textRange.start.line,
      column: textRange.start.column,
      fix: [
        {
          range: [textRange.start.utf16, textRange.end.utf16],
          replacement: correctType,
        },
      ],
    };
  }
}

function toExplicit(typeText: string): string {
  if (typeText === "uint") {
    return "uint256";
  } else if (typeText === "int") {
    return "int256";
  } else if (typeText === "ufixed") {
    return "ufixed128x18";
  } else if (typeText === "fixed") {
    return "fixed128x18";
  }

  throw new AssertionError(`Unrecognized type ${typeText}`);
}

function toImplicit(typeText: string): string {
  if (typeText === "uint256") {
    return "uint";
  } else if (typeText === "int256") {
    return "int";
  } else if (typeText === "ufixed128x18") {
    return "ufixed";
  } else if (typeText === "fixed128x18") {
    return "fixed";
  }

  throw new AssertionError(`Unrecognized type ${typeText}`);
}
