/*
  This file includes code adapted from the `naming-convention` rule and related utilities in typescript-eslint:
  https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/rules/naming-convention.ts

  The original code is licensed under the MIT License:
  https://github.com/typescript-eslint/typescript-eslint/blob/main/LICENSE

  Significant parts of this file are derived from that source, with modifications for Solidity.
*/
import { File as SlangFile } from "@nomicfoundation/slang/compilation";
import {
  Diagnostic,
  RuleContext,
  RuleDefinition,
  RuleWithConfig,
} from "./types.js";
import {
  assertNonterminalNode,
  Cursor,
  NonterminalKind,
  TerminalKind,
  TextRange,
} from "@nomicfoundation/slang/cst";
import * as z from "zod";
import { AssertionError } from "../errors.js";

enum PredefinedFormats {
  camelCase = 1,
  strictCamelCase,
  PascalCase,
  StrictPascalCase,
  snake_case,
  UPPER_CASE,
}

type PredefinedFormatsString = keyof typeof PredefinedFormats;

enum UnderscoreOptions {
  forbid = 1,
  allow,
  require,
  requireDouble,
  allowDouble,
  allowSingleOrDouble,
}

type UnderscoreOptionsString = keyof typeof UnderscoreOptions;

export enum Selectors {
  contract = 1 << 0,
  interface = 1 << 1,
  library = 1 << 2,
  stateVariable = 1 << 3,
  function = 1 << 4,
  variable = 1 << 5,
  struct = 1 << 6,
  structMember = 1 << 7,
  enum = 1 << 8,
  enumMember = 1 << 9,
  parameter = 1 << 10,
  modifier = 1 << 11,
  event = 1 << 12,
  eventParameter = 1 << 13,
  userDefinedValueType = 1 << 14,
  error = 1 << 15,
  errorParameter = 1 << 16,
  mappingParameter = 1 << 17,
}

type SelectorsString = keyof typeof Selectors;

export enum MetaSelectors {
  default = -1,
  typeLike = 0 |
    Selectors.contract |
    Selectors.interface |
    Selectors.library |
    Selectors.struct |
    Selectors.enum |
    Selectors.error |
    Selectors.event |
    Selectors.userDefinedValueType,
  variableLike = 0 |
    Selectors.stateVariable |
    Selectors.function |
    Selectors.variable |
    Selectors.structMember |
    Selectors.parameter |
    Selectors.modifier |
    Selectors.eventParameter |
    Selectors.errorParameter |
    Selectors.mappingParameter,
}
type MetaSelectorsString = keyof typeof MetaSelectors;

type IndividualAndMetaSelectorsString = MetaSelectorsString | SelectorsString;

enum Modifiers {
  constant = 1 << 0,
  immutable = 1 << 1,
  public = 1 << 2,
  internal = 1 << 3,
  private = 1 << 4,
  external = 1 << 5,
  view = 1 << 6,
  pure = 1 << 7,
  payable = 1 << 8,
  virtual = 1 << 9,
  override = 1 << 10,
  abstract = 1 << 11,
  noParameters = 1 << 12,
  hasParameters = 1 << 13,
  contract = 1 << 14,
  interface = 1 << 15,
  library = 1 << 16,
}

type ModifiersString = keyof typeof Modifiers;

interface MatchRegex {
  match: boolean;
  regex: string;
}

interface Selector {
  custom?: MatchRegex;
  filter?: string | MatchRegex;
  // format options
  format: PredefinedFormatsString[] | null;
  leadingUnderscore?: UnderscoreOptionsString;
  modifiers?: ModifiersString[];
  // selector options
  selector:
    | IndividualAndMetaSelectorsString
    | IndividualAndMetaSelectorsString[];
  trailingUnderscore?: UnderscoreOptionsString;
}

interface NormalizedMatchRegex {
  match: boolean;
  regex: RegExp;
}
interface NormalizedSelector {
  custom: NormalizedMatchRegex | null;
  filter: NormalizedMatchRegex | null;
  // format options
  format: PredefinedFormats[] | null;
  leadingUnderscore: UnderscoreOptions | null;
  modifiers: Modifiers[] | null;
  // calculated ordering weight based on modifiers
  modifierWeight: number;
  // selector options
  selector: MetaSelectors | Selectors;
  trailingUnderscore: UnderscoreOptions | null;
}

type NamingConventionUserConfig = Selector[];
type NamingConventionNormalizedConfig = NormalizedSelector[];

const DEFAULT_CONFIG: NamingConventionUserConfig = [
  {
    selector: "default",
    format: ["camelCase"],
    leadingUnderscore: "allow",
    trailingUnderscore: "allow",
  },
  {
    selector: "typeLike",
    format: ["PascalCase"],
  },
  {
    selector: "enumMember",
    format: ["PascalCase"],
  },
];

type PartialRecord<TKey extends PropertyKey, TValue> = {
  [key in TKey]?: TValue;
};

type NodeMetadata = {
  selector: Selectors;
  extractNames: (cursor: Cursor) => IdentifierWithTextRange[];
};

interface IdentifierWithTextRange {
  name: string;
  textRange: TextRange;
}

const extractFirstIdentifier = (cursor: Cursor): IdentifierWithTextRange[] => {
  if (!cursor.goToNextTerminalWithKind(TerminalKind.Identifier)) {
    return [];
  }
  return [
    {
      name: cursor.node.unparse(),
      textRange: cursor.textRange,
    },
  ];
};

const extractIdentifierAfter = (
  cursor: Cursor,
  nonterminalToIgnore: NonterminalKind,
): IdentifierWithTextRange[] => {
  if (!cursor.goToNextNonterminalWithKind(nonterminalToIgnore)) {
    return [];
  }
  if (!cursor.goToNextSibling()) {
    return [];
  }

  return extractFirstIdentifier(cursor);
};

const extractAllIdentifiers = (cursor: Cursor): IdentifierWithTextRange[] => {
  const identifiers: IdentifierWithTextRange[] = [];
  while (cursor.goToNextTerminalWithKind(TerminalKind.Identifier)) {
    identifiers.push({
      name: cursor.node.unparse(),
      textRange: cursor.textRange,
    });
  }

  return identifiers;
};

const nonterminalKindToMetadata: PartialRecord<NonterminalKind, NodeMetadata> =
  {
    [NonterminalKind.ContractDefinition]: {
      selector: Selectors.contract,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.InterfaceDefinition]: {
      selector: Selectors.interface,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.LibraryDefinition]: {
      selector: Selectors.library,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.StateVariableDefinition]: {
      selector: Selectors.stateVariable,
      extractNames: (cursor) =>
        extractIdentifierAfter(cursor, NonterminalKind.TypeName),
    },
    [NonterminalKind.FunctionDefinition]: {
      selector: Selectors.function,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.VariableDeclarationStatement]: {
      selector: Selectors.variable,
      extractNames: (cursor) =>
        extractIdentifierAfter(cursor, NonterminalKind.VariableDeclarationType),
    },
    [NonterminalKind.TypedTupleMember]: {
      selector: Selectors.variable,
      extractNames: (cursor) =>
        extractIdentifierAfter(cursor, NonterminalKind.TypeName),
    },
    [NonterminalKind.StructDefinition]: {
      selector: Selectors.struct,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.StructMember]: {
      selector: Selectors.structMember,
      extractNames: (cursor) =>
        extractIdentifierAfter(cursor, NonterminalKind.TypeName),
    },
    [NonterminalKind.EnumDefinition]: {
      selector: Selectors.enum,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.EnumMembers]: {
      selector: Selectors.enumMember,
      extractNames: extractAllIdentifiers,
    },
    [NonterminalKind.Parameter]: {
      selector: Selectors.parameter,
      extractNames: (cursor) =>
        extractIdentifierAfter(cursor, NonterminalKind.TypeName),
    },
    [NonterminalKind.ModifierDefinition]: {
      selector: Selectors.modifier,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.EventDefinition]: {
      selector: Selectors.event,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.EventParameter]: {
      selector: Selectors.eventParameter,
      extractNames: (cursor) =>
        extractIdentifierAfter(cursor, NonterminalKind.TypeName),
    },
    [NonterminalKind.UserDefinedValueTypeDefinition]: {
      selector: Selectors.userDefinedValueType,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.ErrorDefinition]: {
      selector: Selectors.error,
      extractNames: extractFirstIdentifier,
    },
    [NonterminalKind.ErrorParameter]: {
      selector: Selectors.errorParameter,
      extractNames: (cursor) =>
        extractIdentifierAfter(cursor, NonterminalKind.TypeName),
    },
    [NonterminalKind.MappingKey]: {
      selector: Selectors.mappingParameter,
      extractNames: (cursor) =>
        extractIdentifierAfter(cursor, NonterminalKind.MappingKeyType),
    },
    [NonterminalKind.MappingValue]: {
      selector: Selectors.mappingParameter,
      extractNames: (cursor) =>
        extractIdentifierAfter(cursor, NonterminalKind.TypeName),
    },
  };

export function normalizeConfig(
  userConfig: Config,
): NamingConventionNormalizedConfig {
  return userConfig.flatMap(normalizeOption).sort((a, b) => {
    if (a.selector === b.selector) {
      // in the event of the same selector, order by modifier weight
      // sort descending - the type modifiers are "more important"
      return b.modifierWeight - a.modifierWeight;
    }

    const aIsMeta = isMetaSelector(a.selector);
    const bIsMeta = isMetaSelector(b.selector);

    // non-meta selectors should go ahead of meta selectors
    if (aIsMeta && !bIsMeta) {
      return 1;
    }
    if (!aIsMeta && bIsMeta) {
      return -1;
    }

    return b.selector - a.selector;
  });
}

const MatchRegexSchema = z.object({
  match: z.boolean(),
  regex: z.string(),
});
const SelectorsStringSchema = z.enum(
  Object.keys(Selectors).filter((x) => isNaN(Number(x))) as SelectorsString[],
);
const MetaSelectorsStringSchema = z.enum(
  Object.keys(MetaSelectors).filter((x) =>
    isNaN(Number(x)),
  ) as MetaSelectorsString[],
);
const IndividualAndMetaSelectorsStringSchema = z.union([
  SelectorsStringSchema,
  MetaSelectorsStringSchema,
]);
const PredefinedFormatsStringSchema = z.enum(
  Object.keys(PredefinedFormats).filter((x) =>
    isNaN(Number(x)),
  ) as PredefinedFormatsString[],
);
const UnderscoreOptionsStringSchema = z.enum(
  Object.keys(UnderscoreOptions).filter((x) =>
    isNaN(Number(x)),
  ) as UnderscoreOptionsString[],
);
const ModifiersStringSchema = z.enum(
  Object.keys(Modifiers).filter((x) => isNaN(Number(x))) as ModifiersString[],
);

export const Schema = z
  .array(
    z.object({
      custom: z.optional(MatchRegexSchema),
      filter: z.optional(z.union([z.string(), MatchRegexSchema])),
      format: z.nullable(z.array(PredefinedFormatsStringSchema)),
      leadingUnderscore: z.optional(UnderscoreOptionsStringSchema),
      modifiers: z.optional(z.array(ModifiersStringSchema)),
      selector: z.union([
        IndividualAndMetaSelectorsStringSchema,
        z.array(IndividualAndMetaSelectorsStringSchema),
      ]),
      trailingUnderscore: z.optional(UnderscoreOptionsStringSchema),
    }),
  )
  .default(DEFAULT_CONFIG);

type Config = z.infer<typeof Schema>;

export const NamingConvention: RuleDefinition<Config> = {
  name: "naming-convention",
  recommended: false,
  parseConfig: (config: unknown) => {
    return Schema.parse(config);
  },
  create: function (config) {
    return new NamingConventionRule(this.name, config);
  },
};

class NamingConventionRule implements RuleWithConfig<Config> {
  private normalizedConfig: NamingConventionNormalizedConfig;

  public constructor(
    public name: string,
    public config: Config,
  ) {
    this.normalizedConfig = normalizeConfig(config);
  }

  public run({ file }: RuleContext): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const cursor = file.createTreeCursor();

    const definitionCursor = cursor.spawn();

    while (
      definitionCursor.goToNextNonterminalWithKinds(
        Object.keys(nonterminalKindToMetadata) as NonterminalKind[],
      )
    ) {
      assertNonterminalNode(definitionCursor.node);
      const nonterminalMetadata =
        nonterminalKindToMetadata[definitionCursor.node.kind];
      if (nonterminalMetadata === undefined) {
        throw new AssertionError(
          `Couldn't find selector for node kind: ${definitionCursor.node.kind}`,
        );
      }

      const identifierCursor = definitionCursor.spawn();
      const identifiersWithTextRange =
        nonterminalMetadata.extractNames(identifierCursor);

      for (const {
        name: originalName,
        textRange,
      } of identifiersWithTextRange) {
        for (const config of this.normalizedConfig) {
          if (!matchesSelector(config.selector, nonterminalMetadata.selector)) {
            continue;
          }

          if (
            config.filter?.regex.test(originalName) !== config.filter?.match
          ) {
            // name does not match the filter
            continue;
          }

          if (
            config.modifiers?.some(
              (modifier) => !hasModifier(definitionCursor.clone(), modifier),
            ) === true
          ) {
            // does not have the required modifiers
            continue;
          }

          let name: string | null = originalName;
          let diagnostic;

          diagnostic = this.validateUnderscore(
            "leading",
            config,
            name,
            textRange,
            file,
            originalName,
          );
          if (typeof diagnostic === "string") {
            name = diagnostic;
          } else {
            diagnostics.push(diagnostic);
            break;
          }

          diagnostic = this.validateUnderscore(
            "trailing",
            config,
            name,
            textRange,
            file,
            originalName,
          );
          if (typeof diagnostic === "string") {
            name = diagnostic;
          } else {
            diagnostics.push(diagnostic);
            break;
          }

          const customDiagnostic = this.validateCustom(
            config,
            name,
            textRange,
            file,
            originalName,
          );
          if (customDiagnostic !== undefined) {
            diagnostics.push(customDiagnostic);
            break;
          }

          const predefinedFormatDiagnostic = this.validatePredefinedFormat(
            config,
            name,
            textRange,
            file,
            originalName,
          );
          if (predefinedFormatDiagnostic !== undefined) {
            diagnostics.push(predefinedFormatDiagnostic);
            break;
          }

          // if we reach here, the selector matches and the name is valid
          break;
        }
      }
    }

    return diagnostics;
  }

  private validateUnderscore(
    position: "leading" | "trailing",
    config: NormalizedSelector,
    name: string,
    textRange: TextRange,
    file: SlangFile,
    originalName: string,
  ): string | Diagnostic {
    const option =
      position === "leading"
        ? config.leadingUnderscore
        : config.trailingUnderscore;
    if (option === null) {
      return name;
    }

    const hasSingleUnderscore =
      position === "leading"
        ? (): boolean => name.startsWith("_")
        : (): boolean => name.endsWith("_");
    const trimSingleUnderscore =
      position === "leading"
        ? (): string => name.slice(1)
        : (): string => name.slice(0, -1);

    const hasDoubleUnderscore =
      position === "leading"
        ? (): boolean => name.startsWith("__")
        : (): boolean => name.endsWith("__");
    const trimDoubleUnderscore =
      position === "leading"
        ? (): string => name.slice(2)
        : (): string => name.slice(0, -2);

    switch (option) {
      // ALLOW - no conditions as the user doesn't care if it's there or not
      case UnderscoreOptions.allow: {
        if (hasSingleUnderscore()) {
          return trimSingleUnderscore();
        }

        return name;
      }

      case UnderscoreOptions.allowDouble: {
        if (hasDoubleUnderscore()) {
          return trimDoubleUnderscore();
        }

        return name;
      }

      case UnderscoreOptions.allowSingleOrDouble: {
        if (hasDoubleUnderscore()) {
          return trimDoubleUnderscore();
        }

        if (hasSingleUnderscore()) {
          return trimSingleUnderscore();
        }

        return name;
      }

      // FORBID
      case UnderscoreOptions.forbid: {
        if (hasSingleUnderscore()) {
          return {
            rule: this.name,
            sourceId: file.id,
            line: textRange.start.line,
            column: textRange.start.column,
            message: `'${originalName}' should not have a ${position} underscore`,
          };
        }

        return name;
      }

      // REQUIRE
      case UnderscoreOptions.require: {
        if (!hasSingleUnderscore()) {
          return {
            rule: this.name,
            sourceId: file.id,
            line: textRange.start.line,
            column: textRange.start.column,
            message: `'${originalName}' should have a ${position} underscore`,
          };
        }

        return trimSingleUnderscore();
      }

      case UnderscoreOptions.requireDouble: {
        if (!hasDoubleUnderscore()) {
          return {
            rule: this.name,
            sourceId: file.id,
            line: textRange.start.line,
            column: textRange.start.column,
            message: `'${originalName}' should have a ${position} double underscore`,
          };
        }

        return trimDoubleUnderscore();
      }
    }
  }

  private validateCustom(
    config: NormalizedSelector,
    name: string,
    textRange: TextRange,
    file: SlangFile,
    originalName: string,
  ): Diagnostic | undefined {
    const custom = config.custom;
    if (!custom) {
      return;
    }

    const matches = custom.regex.test(name);
    if (custom.match && matches) {
      return;
    }
    if (!custom.match && !matches) {
      return;
    }

    return {
      rule: this.name,
      sourceId: file.id,
      line: textRange.start.line,
      column: textRange.start.column,
      message: `'${originalName}' must ${custom.match ? "match" : "not match"} the RegExp ${custom.regex.toString()}`,
    };
  }
  public validatePredefinedFormat(
    config: NormalizedSelector,
    name: string,
    textRange: TextRange,
    file: SlangFile,
    originalName: string,
  ): Diagnostic | undefined {
    const formats = config.format;
    if (formats === null || formats.length === 0) {
      return;
    }

    for (const format of formats) {
      const checker = PredefinedFormatToCheckFunction[format];
      if (checker(name)) {
        return;
      }
    }

    const formatsString = formats?.map((f) => PredefinedFormats[f]).join(", ");

    return {
      rule: this.name,
      sourceId: file.id,
      line: textRange.start.line,
      column: textRange.start.column,
      message: `'${originalName}' does not match the required format(s): ${formatsString}`,
    };
  }
}

function matchesSelector(
  selector: NormalizedSelector["selector"],
  kind: Selectors,
): boolean {
  return (selector & kind) !== 0 || selector === MetaSelectors.default;
}

function isMetaSelector(
  selector: IndividualAndMetaSelectorsString | MetaSelectors | Selectors,
): selector is MetaSelectorsString {
  return selector in MetaSelectors;
}

function normalizeOption(option: Selector): NormalizedSelector[] {
  let weight = 0;
  option.modifiers?.forEach((mod) => {
    weight |= Modifiers[mod];
  });

  // give selectors with a filter the _highest_ priority
  if (option.filter !== undefined) {
    weight |= 1 << 30;
  }

  const normalizedOption = {
    // format options
    custom: option.custom
      ? {
          match: option.custom.match,
          regex: new RegExp(option.custom.regex, "u"),
        }
      : null,
    filter:
      option.filter != null
        ? typeof option.filter === "string"
          ? {
              match: true,
              regex: new RegExp(option.filter, "u"),
            }
          : {
              match: option.filter.match,
              regex: new RegExp(option.filter.regex, "u"),
            }
        : null,
    format: option.format
      ? option.format.map((f) => PredefinedFormats[f])
      : null,
    leadingUnderscore:
      option.leadingUnderscore != null
        ? UnderscoreOptions[option.leadingUnderscore]
        : null,
    modifiers: option.modifiers?.map((m) => Modifiers[m]) ?? null,
    trailingUnderscore:
      option.trailingUnderscore != null
        ? UnderscoreOptions[option.trailingUnderscore]
        : null,
    // calculated ordering weight based on modifiers
    modifierWeight: weight,
  };

  const selectors = Array.isArray(option.selector)
    ? option.selector
    : [option.selector];

  return selectors.map((selector) => ({
    selector: isMetaSelector(selector)
      ? MetaSelectors[selector]
      : Selectors[selector],
    ...normalizedOption,
  }));
}

function hasKeyword(cursor: Cursor, keyword: TerminalKind): boolean {
  const spawned = cursor.spawn();
  return spawned.goToNextTerminalWithKind(keyword);
}

const hasModifierMap: Record<Modifiers, (cursor: Cursor) => boolean> = {
  [Modifiers.constant]: (cursor) =>
    hasKeyword(cursor, TerminalKind.ConstantKeyword),
  [Modifiers.immutable]: (cursor) =>
    hasKeyword(cursor, TerminalKind.ImmutableKeyword),
  [Modifiers.public]: (cursor) =>
    hasKeyword(cursor, TerminalKind.PublicKeyword),
  [Modifiers.internal]: (cursor) =>
    hasKeyword(cursor, TerminalKind.InternalKeyword),
  [Modifiers.private]: (cursor) =>
    hasKeyword(cursor, TerminalKind.PrivateKeyword),
  [Modifiers.external]: (cursor) =>
    hasKeyword(cursor, TerminalKind.ExternalKeyword),
  [Modifiers.view]: (cursor) => hasKeyword(cursor, TerminalKind.ViewKeyword),
  [Modifiers.pure]: (cursor) => hasKeyword(cursor, TerminalKind.PureKeyword),
  [Modifiers.payable]: (cursor) =>
    hasKeyword(cursor, TerminalKind.PayableKeyword),
  [Modifiers.virtual]: (cursor) =>
    hasKeyword(cursor, TerminalKind.VirtualKeyword),
  [Modifiers.override]: (cursor) =>
    hasKeyword(cursor, TerminalKind.OverrideKeyword),
  [Modifiers.abstract]: (cursor) =>
    hasKeyword(cursor, TerminalKind.AbstractKeyword),
  [Modifiers.noParameters]: (cursor) =>
    !hasDescendant(cursor, NonterminalKind.Parameter),
  [Modifiers.hasParameters]: (cursor) =>
    hasDescendant(cursor, NonterminalKind.Parameter),
  [Modifiers.contract]: (cursor) =>
    hasAncestor(cursor, NonterminalKind.ContractDefinition),
  [Modifiers.interface]: (cursor) =>
    hasAncestor(cursor, NonterminalKind.InterfaceDefinition),
  [Modifiers.library]: (cursor) =>
    hasAncestor(cursor, NonterminalKind.LibraryDefinition),
};

function hasAncestor(cursor: Cursor, kind: NonterminalKind): boolean {
  while (cursor.goToParent()) {
    if (cursor.node.kind === kind) {
      return true;
    }
  }
  return false;
}

function hasDescendant(cursor: Cursor, kind: NonterminalKind): boolean {
  const spawned = cursor.spawn();
  return spawned.goToNextNonterminalWithKind(kind);
}

function hasModifier(cursor: Cursor, modifier: Modifiers): boolean {
  return hasModifierMap[modifier](cursor);
}

const PredefinedFormatToCheckFunction: Readonly<
  Record<PredefinedFormats, (name: string) => boolean>
> = {
  [PredefinedFormats.camelCase]: isCamelCase,
  [PredefinedFormats.PascalCase]: isPascalCase,
  [PredefinedFormats.snake_case]: isSnakeCase,
  [PredefinedFormats.strictCamelCase]: isStrictCamelCase,
  [PredefinedFormats.StrictPascalCase]: isStrictPascalCase,
  [PredefinedFormats.UPPER_CASE]: isUpperCase,
};

function isPascalCase(name: string): boolean {
  return (
    name.length === 0 ||
    (name[0] === name[0].toUpperCase() && !name.includes("_"))
  );
}
function isStrictPascalCase(name: string): boolean {
  return (
    name.length === 0 ||
    (name[0] === name[0].toUpperCase() && hasStrictCamelHumps(name, true))
  );
}

function isCamelCase(name: string): boolean {
  return (
    name.length === 0 ||
    (name[0] === name[0].toLowerCase() && !name.includes("_"))
  );
}
function isStrictCamelCase(name: string): boolean {
  return (
    name.length === 0 ||
    (name[0] === name[0].toLowerCase() && hasStrictCamelHumps(name, false))
  );
}

function hasStrictCamelHumps(name: string, isUpper: boolean): boolean {
  function isUppercaseChar(char: string): boolean {
    return char === char.toUpperCase() && char !== char.toLowerCase();
  }

  if (name.startsWith("_")) {
    return false;
  }
  for (let i = 1; i < name.length; ++i) {
    if (name[i] === "_") {
      return false;
    }
    if (isUpper === isUppercaseChar(name[i])) {
      if (isUpper) {
        return false;
      }
    } else {
      isUpper = !isUpper;
    }
  }
  return true;
}

function isSnakeCase(name: string): boolean {
  return (
    name.length === 0 ||
    (name === name.toLowerCase() && validateUnderscores(name))
  );
}

function isUpperCase(name: string): boolean {
  return (
    name.length === 0 ||
    (name === name.toUpperCase() && validateUnderscores(name))
  );
}

function validateUnderscores(name: string): boolean {
  if (name.startsWith("_")) {
    return false;
  }
  let wasUnderscore = false;
  for (let i = 1; i < name.length; ++i) {
    if (name[i] === "_") {
      if (wasUnderscore) {
        return false;
      }
      wasUnderscore = true;
    } else {
      wasUnderscore = false;
    }
  }
  return !wasUnderscore;
}
