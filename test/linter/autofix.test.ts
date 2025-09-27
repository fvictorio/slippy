import { describe, it, expect } from "vitest";
import { Linter } from "../../src/linter.js";
import {
    mockConfigLoaderWithRules,
    mockSingleRuleConfigLoader,
} from "../helpers/config.js";
import { StubNoForbiddenIdentifiers } from "../helpers/stub-rules/stub-no-forbidden-identifiers.js";
import {
    SlippyParsingErrorAfterFixError,
    SlippyTooManyFixesError,
} from "../../src/errors.js";
import { StubReplaceUintWithInvalidType } from "../helpers/stub-rules/stub-replace-uint-with-invalid-type.js";
import { StubSwapFirstTwoStateVars } from "../helpers/stub-rules/stub-swap-first-two-state-vars.js";
import {
    changeOverlaps,
    getAppliableFixes,
} from "../../src/internal/autofix.js";
import { Range } from "../../src/rules/types.js";

describe("autofix", function () {
    it("should return fixed content when autofix is enabled", async function () {
        const sources = `
contract A {
  uint foo;
}
`;

        const linter = new Linter(
            mockSingleRuleConfigLoader("stub-no-forbidden-identifiers", [
                { foo: "bar" },
            ]),
        );
        linter.addRule(StubNoForbiddenIdentifiers);

        const { diagnostics, fixedContent } = await linter.lintText(
            sources,
            "contract.sol",
            { fix: true },
        );

        expect(diagnostics).toHaveLength(0);
        expect(fixedContent).toMatchInlineSnapshot(`
      "
      contract A {
        uint bar;
      }
      "
    `);
    });

    it("shouldn't return fixed content when autofix is enabled but there are no fixes", async function () {
        const sources = `
contract A {
  uint something;
}
`;

        const linter = new Linter(
            mockSingleRuleConfigLoader("stub-no-forbidden-identifiers", [
                { foo: "bar" },
            ]),
        );
        linter.addRule(StubNoForbiddenIdentifiers);

        const { diagnostics, fixedContent } = await linter.lintText(
            sources,
            "contract.sol",
            { fix: true },
        );

        expect(diagnostics).toHaveLength(0);
        expect(fixedContent).toBeUndefined();
    });

    it("shouldn't return fixed content when autofix is disabled", async function () {
        const sources = `
contract A {
  uint foo;
}
`;

        const linter = new Linter(
            mockSingleRuleConfigLoader("stub-no-forbidden-identifiers", [
                { foo: "bar" },
            ]),
        );
        linter.addRule(StubNoForbiddenIdentifiers);

        const { diagnostics, fixedContent } = await linter.lintText(
            sources,
            "contract.sol",
            { fix: false },
        );

        expect(diagnostics).toHaveLength(1);
        expect(fixedContent).toBeUndefined();
    });

    it("should return fixed content when autofix is enabled", async function () {
        const sources = `
contract A {
  uint foo1;
  uint foo2;
}
`;

        const linter = new Linter(
            mockSingleRuleConfigLoader("stub-no-forbidden-identifiers", [
                { foo1: "bar1", foo2: "bar2" },
            ]),
        );
        linter.addRule(StubNoForbiddenIdentifiers);

        const { diagnostics, fixedContent } = await linter.lintText(
            sources,
            "contract.sol",
            { fix: true },
        );

        expect(diagnostics).toHaveLength(0);
        expect(fixedContent).toMatchInlineSnapshot(`
          "
          contract A {
            uint bar1;
            uint bar2;
          }
          "
        `);
    });

    it("should apply fixes that depend on previous fixes", async function () {
        const sources = `
contract A {
  uint foo;
}
`;

        const linter = new Linter(
            mockSingleRuleConfigLoader("stub-no-forbidden-identifiers", [
                { foo: "bar", bar: "baz", baz: "qux" },
            ]),
        );
        linter.addRule(StubNoForbiddenIdentifiers);

        const { diagnostics, fixedContent } = await linter.lintText(
            sources,
            "contract.sol",
            { fix: true },
        );

        expect(diagnostics).toHaveLength(0);
        expect(fixedContent).toMatchInlineSnapshot(`
          "
          contract A {
            uint qux;
          }
          "
        `);
    });

    it("should throw the proper error if too many fixes are applied", async function () {
        const sources = `
contract A {
  uint foo;
}
`;

        const linter = new Linter(
            mockSingleRuleConfigLoader("stub-no-forbidden-identifiers", [
                { foo: "bar", bar: "foo" },
            ]),
        );
        linter.addRule(StubNoForbiddenIdentifiers);

        await expect(
            linter.lintText(sources, "contract.sol", { fix: true }),
        ).rejects.toThrow(SlippyTooManyFixesError);
    });

    it("should throw the proper error if an autofix produces a syntax error", async function () {
        const sources = `
contract A {
  uint foo;
}
`;

        const linter = new Linter(
            mockSingleRuleConfigLoader("stub-replace-uint-with-invalid-type"),
        );
        linter.addRule(StubReplaceUintWithInvalidType);

        await expect(
            linter.lintText(sources, "contract.sol", { fix: true }),
        ).rejects.toThrow(SlippyParsingErrorAfterFixError);
    });

    it("should work when a fix involves more than one change", async function () {
        const sources = `
contract A {
  uint foo;
  uint bar;
}
`;

        const linter = new Linter(
            mockSingleRuleConfigLoader("stub-swap-first-two-state-vars"),
        );
        linter.addRule(StubSwapFirstTwoStateVars);

        const { diagnostics, fixedContent } = await linter.lintText(
            sources,
            "contract.sol",
            { fix: true },
        );

        expect(diagnostics).toHaveLength(0);
        expect(fixedContent).toMatchInlineSnapshot(`
          "
          contract A {
            uint bar;
            uint foo;
          }
          "
        `);
    });

    it("should work even when fixes overlap", async function () {
        const sources = `
contract A {
  uint foo;
  uint bar;
}
`;

        const linter = new Linter(
            mockConfigLoaderWithRules({
                "stub-swap-first-two-state-vars": ["error"],
                "stub-no-forbidden-identifiers": ["error", { bar: "qux" }],
            }),
        );
        linter.addRule(StubSwapFirstTwoStateVars);
        linter.addRule(StubNoForbiddenIdentifiers);

        const { diagnostics, fixedContent } = await linter.lintText(
            sources,
            "contract.sol",
            { fix: true },
        );

        expect(diagnostics).toHaveLength(0);
        expect(fixedContent).toMatchInlineSnapshot(`
          "
          contract A {
            uint qux;
            uint foo;
          }
          "
        `);
    });

    it("changeOverlaps should work correctly", async function () {
        const fixtures: Array<{ range1: Range; range2: Range; expected: boolean }> =
            [
                {
                    range1: [0, 5],
                    range2: [6, 10],
                    expected: false,
                },
                {
                    range1: [0, 5],
                    range2: [5, 10],
                    expected: false,
                },
                {
                    range1: [0, 5],
                    range2: [2, 6],
                    expected: true,
                },
                {
                    range1: [0, 5],
                    range2: [2, 5],
                    expected: true,
                },
                {
                    range1: [0, 5],
                    range2: [2, 4],
                    expected: true,
                },
                {
                    range1: [0, 5],
                    range2: [0, 6],
                    expected: true,
                },
                {
                    range1: [0, 5],
                    range2: [0, 5],
                    expected: true,
                },
                {
                    range1: [0, 5],
                    range2: [0, 4],
                    expected: true,
                },
            ];

        for (const { range1, range2, expected } of fixtures) {
            expect(changeOverlaps(range1, range2)).toEqual(expected);
            expect(changeOverlaps(range2, range1)).toEqual(expected);
        }
    });

    it("getAppliableFixes should work correctly", async function () {
        const fixtures: Array<{ fixes: Array<Range[]>; expected: Array<Range[]> }> =
            [
                { fixes: [], expected: [] },
                {
                    fixes: [[[1, 5]]],
                    expected: [[[1, 5]]],
                },
                {
                    fixes: [[[1, 5]], [[4, 7]]],
                    expected: [[[4, 7]]],
                },
                {
                    fixes: [
                        [
                            [1, 5],
                            [6, 10],
                        ],
                        [
                            [15, 20],
                            [9, 13],
                        ],
                    ],
                    expected: [
                        [
                            [15, 20],
                            [9, 13],
                        ],
                    ],
                },
                {
                    fixes: [
                        [
                            [1, 5],
                            [6, 10],
                            [11, 15],
                        ],
                        [[0, 20]],
                    ],
                    expected: [[
                        [11, 15],
                        [6, 10],
                        [1, 5],
                    ]],
                },
                {
                    fixes: [
                        [
                            [1, 5],
                            [6, 10],
                            [11, 15],
                        ],
                        [[3, 9]],
                    ],
                    expected: [
                        [
                            [11, 15],
                            [6, 10],
                            [1, 5],
                        ],
                    ],
                },
                {
                    fixes: [
                        [
                            [6, 10],
                            [1, 5],
                            [11, 15],
                        ],
                    ],
                    expected: [
                        [
                            [11, 15],
                            [6, 10],
                            [1, 5],
                        ],
                    ],
                },
                {
                    fixes: [[[6, 10]], [[1, 5]], [[11, 15]]],
                    expected: [
                        [[11, 15]],
                        [[6, 10]],
                        [[1, 5]],
                    ],
                },
                {
                    fixes: [[[6, 10]], [[1, 5]], [[11, 15]], [[15, 20]]],
                    expected: [
                        [[15, 20]],
                        [[11, 15]],
                        [[6, 10]],
                        [[1, 5]],
                    ],
                },
            ];

        for (const {
            fixes: fixesWithoutReplacement,
            expected: expectedWithoutReplacement,
        } of fixtures) {
            const fixes = fixesWithoutReplacement.map((fix) =>
                fix.map((range) => ({ range, replacement: "" })),
            );
            const expected = expectedWithoutReplacement.map((fix) =>
                fix.map((range) => ({ range, replacement: "" })),
            );

            expect(getAppliableFixes(fixes)).toEqual(expected);
        }
    });
});
