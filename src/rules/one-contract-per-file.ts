import * as z from "zod";
import { ignoreLeadingTrivia } from "../slang/trivia.js";
import {
  Diagnostic,
  RuleContext,
  RuleDefinitionWithConfig,
  RuleWithConfig,
} from "./types.js";
import { Cursor, NonterminalKind } from "@nomicfoundation/slang/cst";
import { AssertionError } from "../errors.js";

const ExceptionSchema = z
  .object({
    contracts: z.number().default(0),
    interfaces: z.number().default(0),
    libraries: z.number().default(0),
  })
  .refine((o) => {
    return o.contracts > 0 || o.interfaces > 0 || o.libraries > 0;
  }, "At least one of contracts, interfaces, or libraries must be specified and positive");

const Schema = z
  .object({
    allow: z.array(ExceptionSchema),
  })
  .default({ allow: [] });

type Config = z.infer<typeof Schema>;

export const OneContractPerFile: RuleDefinitionWithConfig<Config> = {
  name: "one-contract-per-file",
  recommended: false,
  parseConfig: (config: unknown) => Schema.parse(config),
  create: function (config: Config) {
    return new OneContractPerFileRule(this.name, config);
  },
};

class OneContractPerFileRule implements RuleWithConfig<Config> {
  public constructor(
    public name: string,
    public config: Config,
  ) {}

  public run({ file }: RuleContext): Diagnostic[] {
    const cursor = file.createTreeCursor();

    let contracts = 0;
    let interfaces = 0;
    let libraries = 0;

    let invalidNode: Cursor | undefined;

    while (
      cursor.goToNextNonterminalWithKinds([
        NonterminalKind.ContractDefinition,
        NonterminalKind.InterfaceDefinition,
        NonterminalKind.LibraryDefinition,
      ])
    ) {
      if (cursor.node.kind === NonterminalKind.ContractDefinition) {
        contracts++;
      } else if (cursor.node.kind === NonterminalKind.InterfaceDefinition) {
        interfaces++;
      } else if (cursor.node.kind === NonterminalKind.LibraryDefinition) {
        libraries++;
      }

      if (
        invalidNode === undefined &&
        !this.checkLimits(contracts, interfaces, libraries)
      ) {
        invalidNode = cursor.spawn();
      }
    }

    if (invalidNode !== undefined) {
      const message = this.buildErrorMessage(contracts, interfaces, libraries);

      ignoreLeadingTrivia(invalidNode);

      return [
        {
          rule: this.name,
          sourceId: file.id,
          message,
          line: invalidNode.textRange.start.line,
          column: invalidNode.textRange.start.column,
        },
      ];
    }

    return [];
  }

  private checkLimits(
    contracts: number,
    interfaces: number,
    libraries: number,
  ): boolean {
    for (const exception of this.config.allow) {
      if (
        contracts <= exception.contracts &&
        interfaces <= exception.interfaces &&
        libraries <= exception.libraries
      ) {
        return true;
      }
    }

    return contracts + interfaces + libraries <= 1;
  }

  private buildErrorMessage(
    contracts: number,
    interfaces: number,
    libraries: number,
  ): string {
    let message = `The file has `;

    if (contracts > 0 && interfaces > 0 && libraries > 0) {
      message += `${contracts} ${pluralize(contracts, "contract", "contracts")}, ${interfaces} ${pluralize(interfaces, "interface", "interfaces")}, and ${libraries} ${pluralize(libraries, "library", "libraries")}`;
    } else if (contracts > 0 && interfaces > 0 && libraries === 0) {
      message += `${contracts} ${pluralize(contracts, "contract", "contracts")} and ${interfaces} ${pluralize(interfaces, "interface", "interfaces")}`;
    } else if (contracts > 0 && interfaces === 0 && libraries > 0) {
      message += `${contracts} ${pluralize(contracts, "contract", "contracts")} and ${libraries} ${pluralize(libraries, "library", "libraries")}`;
    } else if (contracts === 0 && interfaces > 0 && libraries > 0) {
      message += `${interfaces} ${pluralize(interfaces, "interface", "interfaces")} and ${libraries} ${pluralize(libraries, "library", "libraries")}`;
    } else if (contracts > 0 && interfaces === 0 && libraries === 0) {
      message += `${contracts} ${pluralize(contracts, "contract", "contracts")}`;
    } else if (contracts === 0 && interfaces > 0 && libraries === 0) {
      message += `${interfaces} ${pluralize(interfaces, "interface", "interfaces")}`;
    } else if (contracts === 0 && interfaces === 0 && libraries > 0) {
      message += `${libraries} ${pluralize(libraries, "library", "libraries")}`;
    } else {
      throw new AssertionError("Unreachable");
    }

    message += `, which is not allowed`;

    return message;
  }
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
