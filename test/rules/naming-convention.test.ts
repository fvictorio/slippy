import { describe, expect, it } from "vitest";
import { RuleTester, RuleTestFixture } from "../helpers/rule-tester.js";
import {
  Schema,
  MetaSelectors,
  normalizeConfig,
  Selectors,
} from "../../src/rules/naming-convention.js";

describe("config validation", function () {
  it("should reject invalid configs", function () {
    const invalidConfigs = [
      {},
      { selector: "default" }, // missing format
      { format: ["camelCase"] }, // missing selector
      { selector: "default", format: "camelCase" }, // format should be an array
      { selector: "defaul", format: ["camelCase"] }, // invalid selector
      { selector: "default", format: ["camelcase"] }, // invalid format
    ];

    for (const config of invalidConfigs) {
      const result = Schema.safeParse(config);
      expect(result.error).toBeDefined();
    }
  });
});

describe("config normalization", function () {
  it("should give individual selectors higher priority than to meta selectors", async () => {
    expect(
      normalizeConfig([
        {
          selector: "contract",
          format: ["PascalCase"],
        },
        {
          selector: "typeLike",
          format: ["camelCase"],
        },
      ]).map((x) => x.selector),
    ).toEqual([Selectors.contract, MetaSelectors.typeLike]);

    expect(
      normalizeConfig([
        {
          selector: "typeLike",
          format: ["camelCase"],
        },
        {
          selector: "contract",
          format: ["PascalCase"],
        },
      ]).map((x) => x.selector),
    ).toEqual([Selectors.contract, MetaSelectors.typeLike]);

    expect(
      normalizeConfig([
        {
          selector: "variableLike",
          format: ["camelCase"],
        },
        {
          selector: "contract",
          format: ["PascalCase"],
        },
      ]).map((x) => x.selector),
    ).toEqual([Selectors.contract, MetaSelectors.variableLike]);
  });

  it("should sort individual selectors by higher enum position", async () => {
    expect(
      normalizeConfig([
        {
          selector: "contract",
          format: ["PascalCase"],
        },
        {
          selector: "interface",
          format: ["camelCase"],
        },
      ]).map((x) => x.selector),
    ).toEqual([Selectors.interface, Selectors.contract]);

    expect(
      normalizeConfig([
        {
          selector: "interface",
          format: ["camelCase"],
        },
        {
          selector: "contract",
          format: ["PascalCase"],
        },
      ]).map((x) => x.selector),
    ).toEqual([Selectors.interface, Selectors.contract]);
  });
});

const ruleName = "naming-convention";

const fixtures: RuleTestFixture[] = [
  {
    description: "default convention",
    content: `
    function myFunction() {
      uint localVariable;
    }

    error MyError(string myParameter);
    event MyEvent(string myParameter);
    enum MyEnum {
      MyEnumMember,
      MyOtherEnumMember
    }

    contract MyContract {}
    interface MyInterface {}
    library MyLibrary {}

    contract TestContract {
      function test_Something() {}
      function testFork_Something() {}
      function testFuzz_Something(uint256 x) {}
      function testForkFuzz_Something(uint256 x) {}

      function test_RevertWhen_Something() {}
      function test_RevertIf_Something() {}

      function testFork_RevertWhen_Something() {}
      function testFork_RevertIf_Something() {}

      function testFuzz_RevertWhen_Something(uint256 x) {}
      function testFuzz_RevertIf_Something(uint256 x) {}

      function testForkFuzz_RevertWhen_Something(uint256 x) {}
      function testForkFuzz_RevertIf_Something(uint256 x) {}
    }
    `,
  },
  {
    description: "should allow selecting contracts",
    content: `
    contract camelCaseContract {}
             ^^^^^^^^^^^^^^^^^
    `,
    config: [
      [
        {
          selector: "contract",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should allow selecting interfaces",
    content: `
          interface camelCaseInterface {}
                    ^^^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "interface",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should allow selecting libraries",
    content: `
          library camelCaseLibrary {}
                  ^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "library",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description:
      "should give higher priority to individual selectors over group selectors",
    content: `
          contract camelCaseContract {}
          interface camelCaseInterface {}
                    ^^^^^^^^^^^^^^^^^^
          library camelCaseLibrary {}
                  ^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "contract",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support state variables",
    content: `
          contract MyContract {
            uint256 myVariable;
            mapping(uint x => uint y) MyVariable;
                                      ^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "stateVariable",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description:
      "should support state variables with types that are identifier paths",
    content: `
          contract MyContract {
            Foo.Bar myVariable;
          }
        `,
    config: [
      [
        {
          selector: "stateVariable",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support functions",
    content: `
          contract MyContract {
            function myFunction() {}
            function MyFunction() {}
                     ^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support local variables",
    content: `
          contract MyContract {
            function myFunction() {
              uint256 myVariable;
              uint256 MyVariable;
                      ^^^^^^^^^^
            }
          }
        `,
    config: [
      [
        {
          selector: "variable",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support tuple assignments",
    content: `
          contract MyContract {
            function myFunction() {
              (uint256 myVariable, uint256 MyVariable) = (1, 2);
                                           ^^^^^^^^^^
            }
          }
        `,
    config: [
      [
        {
          selector: "variable",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support structs",
    content: `
          contract MyContract {
            struct myStruct {}
                   ^^^^^^^^
            struct MyStruct {}
          }
        `,
    config: [
      [
        {
          selector: "struct",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support struct members",
    content: `
          contract MyContract {
            struct MyStruct {
              uint256 myMember;
              uint256 MyMember;
                      ^^^^^^^^
            }
          }
        `,
    config: [
      [
        {
          selector: "structMember",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description:
      "should support struct members with types that are identifier paths",
    content: `
          contract MyContract {
            struct MyStruct {
              Foo.Bar myMember;
            }
          }
        `,
    config: [
      [
        {
          selector: "structMember",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support enums",
    content: `
          contract MyContract {
            enum myEnum {}
                 ^^^^^^
            enum MyEnum {}
          }
        `,
    config: [
      [
        {
          selector: "enum",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support enum members",
    content: `
          contract MyContract {
            enum MyEnum {
              myMember,
              ^^^^^^^^
              my_member,
              ^^^^^^^^^
              MY_MEMBER
            }
          }
        `,
    config: [
      [
        {
          selector: "enumMember",
          format: ["UPPER_CASE"],
        },
      ],
    ],
  },
  {
    description: "should support parameters",
    content: `
          contract MyContract {
            function myFunction(uint256 myParameter, uint256 MyParameter) public {}
                                                             ^^^^^^^^^^^
            function myOtherFunction() public returns (
              uint256 my_return_parameter,
                      ^^^^^^^^^^^^^^^^^^^
              uint256 myReturnParameter
          ) {}
          }
        `,
    config: [
      [
        {
          selector: "parameter",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support modifiers",
    content: `
          contract MyContract {
            modifier myModifier() {}
            modifier MyModifier() {}
                     ^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "modifier",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support events",
    content: `
          contract MyContract {
            event myEvent();
                  ^^^^^^^
            event MyEvent();
          }
        `,
    config: [
      [
        {
          selector: "event",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support event parameters",
    content: `
          contract MyContract {
            event MyEvent(uint256 myParameter, uint256 MyParameter);
                                                       ^^^^^^^^^^^
            event EventWithoutParameters();
            event EventWithUnnamedParameter(uint);
          }
        `,
    config: [
      [
        {
          selector: "eventParameter",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support user defined value types",
    content: `
          contract MyContract {
            type myType is uint256;
                 ^^^^^^
            type MyType is uint256;
          }
        `,
    config: [
      [
        {
          selector: "userDefinedValueType",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support errors",
    content: `
          contract MyContract {
            error myError();
                  ^^^^^^^
            error MyError();
          }
        `,
    config: [
      [
        {
          selector: "error",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support error parameters",
    content: `
          contract MyContract {
            error MyError(uint256 myParameter, uint256 MyParameter);
                                                       ^^^^^^^^^^^
            error ErrorWithoutParameters();
          }
        `,
    config: [
      [
        {
          selector: "errorParameter",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support mapping parameters",
    content: `
          contract MyContract {
            mapping(uint256 myKey => uint256 MyValue) m1;
                                             ^^^^^^^
            mapping(uint256 MyKey => uint256 myValue) m2;
                            ^^^^^
            mapping(uint256 => uint256 MyValue) m3;
                                       ^^^^^^^
            mapping(uint256 MyKey => uint256) m4;
                            ^^^^^
            mapping(uint256 => uint256) m5;
          }
        `,
    config: [
      [
        {
          selector: "mappingParameter",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should only match identifiers that match a filter",
    content: `
          contract notMyContract {}
          contract MyContract {}
          contract MyOther_contract {}
                   ^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "contract",
          filter: {
            match: true,
            regex: "^My",
          },
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description:
      "should only lint identifiers that don't match a negative filter",
    content: `
          contract notMyContract {}
                   ^^^^^^^^^^^^^
          contract MyContract {}
          contract MyOther_contract {}
        `,
    config: [
      [
        {
          selector: "contract",
          filter: {
            match: false,
            regex: "^My",
          },
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should accept strings as filters",
    content: `
          contract notMyContract {}
          contract MyContract {}
          contract MyOther_contract {}
                   ^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "contract",
          filter: "^My",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should accept arrays of selectors",
    content: `
          contract camelCaseContract {}
                   ^^^^^^^^^^^^^^^^^
          interface camelCaseInterface {}
                    ^^^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: ["contract", "interface"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should allow selecting type like identifiers",
    content: `
          type camelCaseType is uint256;
               ^^^^^^^^^^^^^

          contract camelCaseContract {
                   ^^^^^^^^^^^^^^^^^
            struct camelCaseStruct {
                   ^^^^^^^^^^^^^^^
              uint256 struct_member_are_not_type_like;
            }
            enum camelCaseEnum {
                 ^^^^^^^^^^^^^
              enum_members_are_not_type_like,
              enum_members_are_not_type_like_2
            }
            error camelCaseError(uint error_parameter_are_not_type_like);
                  ^^^^^^^^^^^^^^
            event camelCaseEvent(uint event_parameter_are_not_type_like);
                  ^^^^^^^^^^^^^^
            function functions_are_not_type_like(uint parameters_are_not_type_like) {}
          }
          interface camelCaseInterface {}
                    ^^^^^^^^^^^^^^^^^^
          library camelCaseLibrary {}
                  ^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should allow selecting variable like identifiers",
    content: `
          contract MyContract {
            uint256 public MyVariable;
                           ^^^^^^^^^^
            mapping(uint256 MyKey => uint256 myValue) public myMapping;
                            ^^^^^
            mapping(uint256 myKey => uint256 MyValue) public myOtherMapping;
                                             ^^^^^^^

            struct structsAre_notVariableLike {
              uint256 MyStructMember;
                      ^^^^^^^^^^^^^^
            }

            enum enumsAre_notVariableLike {
              enumMembers_areNot_variableLike
            }

            event eventsAre_notVariableLike(uint256 MyEventParameter);
                                                    ^^^^^^^^^^^^^^^^

            error errorsAre_notVariableLike(uint256 MyErrorParameter);
                                                    ^^^^^^^^^^^^^^^^

            function MyFunction(
                     ^^^^^^^^^^
                uint SomeParameter
                     ^^^^^^^^^^^^^
              ) public returns (uint256 SomeReturnValue) {
                                        ^^^^^^^^^^^^^^^
              uint256 MyLocalVariable;
                      ^^^^^^^^^^^^^^^
            }

            modifier MyModifier() {
                     ^^^^^^^^^^
              _;
            }
          }
        `,
    config: [
      [
        {
          selector: "variableLike",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should allow selecting all identifiers",
    content: `
          contract MyContract {}
                   ^^^^^^^^^^
          interface MyInterface {}
                    ^^^^^^^^^^^
          library MyLibrary {}
                  ^^^^^^^^^

          contract myContract {
            uint public MyStateVariable;
                        ^^^^^^^^^^^^^^^

            function MyFunction() public {
                     ^^^^^^^^^^
              uint256 MyLocalVariable;
                      ^^^^^^^^^^^^^^^
            }

            struct MyStruct {
                   ^^^^^^^^
              uint256 MyStructMember;
                      ^^^^^^^^^^^^^^
            }

            enum MyEnum {
                 ^^^^^^
              MyEnumMember
              ^^^^^^^^^^^^
            }

            function myFunction(uint256 MyParameter) public {}
                                        ^^^^^^^^^^^

            modifier MyModifier() {
                     ^^^^^^^^^^
              _;
            }

            event MyEvent(
                  ^^^^^^^
                uint256 MyEventParameter
                        ^^^^^^^^^^^^^^^^
            );
          }

          type MyType is uint256;
               ^^^^^^

          contract myOtherContract {
            error MyError(
                  ^^^^^^^
                uint256 MyErrorParameter
                        ^^^^^^^^^^^^^^^^
            );

            mapping(uint256 MyKey => uint256 myValue) myMapping;
                            ^^^^^
            mapping(uint256 myKey => uint256 MyValue) myOtherMapping;
                                             ^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "default",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description:
      "should report a contract without a leading underscore when required",
    content: `
          contract NoLeadingUnderscore {}
                   ^^^^^^^^^^^^^^^^^^^
          contract _WithLeadingUnderscore {}
        `,
    config: [
      [
        {
          selector: "contract",
          leadingUnderscore: "require",
          format: null,
        },
      ],
    ],
  },
  {
    description:
      "should report a contract without a double leading underscore when required",
    content: `
          contract NoLeadingUnderscore {}
                   ^^^^^^^^^^^^^^^^^^^
          contract _SingleLeadingUnderscore {}
                   ^^^^^^^^^^^^^^^^^^^^^^^^
          contract __WithDoubleLeadingUnderscore {}
        `,
    config: [
      [
        {
          selector: "contract",
          leadingUnderscore: "requireDouble",
          format: null,
        },
      ],
    ],
  },
  {
    description:
      "should report a contract without a trailing underscore when required",
    content: `
          contract NoTrailingUnderscore {}
                   ^^^^^^^^^^^^^^^^^^^^
          contract WithTrailingUnderscore_ {}
        `,
    config: [
      [
        {
          selector: "contract",
          trailingUnderscore: "require",
          format: null,
        },
      ],
    ],
  },
  {
    description:
      "should report a contract without a double trailing underscore when required",
    content: `
          contract NoTrailingUnderscore {}
                   ^^^^^^^^^^^^^^^^^^^^
          contract SingleTrailingUnderscore_ {}
                   ^^^^^^^^^^^^^^^^^^^^^^^^^
          contract WithDoubleTrailingUnderscore__ {}
        `,
    config: [
      [
        {
          selector: "contract",
          trailingUnderscore: "requireDouble",
          format: null,
        },
      ],
    ],
  },
  {
    description:
      "shouldn't report contracts with allowed single leading underscore",
    content: `
          contract NoLeadingUnderscore {}
          contract _WithLeadingUnderscore {}
          contract __WithDoubleLeadingUnderscore {}
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "contract",
          leadingUnderscore: "allow",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description:
      "shouldn't report contracts with allowed double leading underscore",
    content: `
          contract NoLeadingUnderscore {}
          contract _WithLeadingUnderscore {}
                   ^^^^^^^^^^^^^^^^^^^^^^
          contract __WithDoubleLeadingUnderscore {}
        `,
    config: [
      [
        {
          selector: "contract",
          leadingUnderscore: "allowDouble",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description:
      "shouldn't report contracts with allowed single or double leading underscore",
    content: `
          contract NoLeadingUnderscore {}
          contract _WithLeadingUnderscore {}
          contract __WithDoubleLeadingUnderscore {}
        `,
    config: [
      [
        {
          selector: "contract",
          leadingUnderscore: "allowSingleOrDouble",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should report contracts with forbidden leading underscore",
    content: `
          contract NoLeadingUnderscore {}
          contract _WithLeadingUnderscore {}
                   ^^^^^^^^^^^^^^^^^^^^^^
          contract __WithDoubleLeadingUnderscore {}
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "contract",
          leadingUnderscore: "forbid",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should report a contract with a custom validation",
    content: `
          contract MyContract {}
          contract OtherContract {}
                   ^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "contract",
          custom: {
            match: true,
            regex: "^My",
          },
          format: null,
        },
      ],
    ],
  },
  {
    description: "should report custom validations with negative matches",
    content: `
          contract MyContract {}
                   ^^^^^^^^^^
          contract OtherContract {}
        `,
    config: [
      [
        {
          selector: "contract",
          custom: {
            match: false,
            regex: "^My",
          },
          format: null,
        },
      ],
    ],
  },
  {
    description: "should validate the camelCase format",
    content: `
          contract myContract {}
          contract my_contract {}
                   ^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "contract",
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should validate the strictCamelCase format",
    content: `
          contract myErc20Contract {}
          contract myERC20Contract {}
                   ^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "contract",
          format: ["strictCamelCase"],
        },
      ],
    ],
  },
  {
    description: "should validate the PascalCase format",
    content: `
          contract MyContract {}
          contract myContract {}
                   ^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "contract",
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should validate the StrictPascalCase format",
    content: `
          contract MyERC20Contract {}
                   ^^^^^^^^^^^^^^^
          contract MyErc20Contract {}
        `,
    config: [
      [
        {
          selector: "contract",
          format: ["StrictPascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the constant modifier",
    content: `
          contract MyContract {
            uint256 myVariable;
            uint256 MY_CONSTANT_VARIABLE;
                    ^^^^^^^^^^^^^^^^^^^^
            uint256 constant myConstantVariable;
                             ^^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "variableLike",
          format: ["camelCase"],
        },
        {
          selector: "variableLike",
          modifiers: ["constant"],
          format: ["UPPER_CASE"],
        },
      ],
    ],
  },
  {
    description: "should support the immutable modifier",
    content: `
          contract MyContract {
            uint256 myVariable;
            uint256 MY_IMMUTABLE_VARIABLE;
                    ^^^^^^^^^^^^^^^^^^^^^
            uint256 immutable myImmutableVariable;
                              ^^^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "variableLike",
          format: ["camelCase"],
        },
        {
          selector: "variableLike",
          modifiers: ["immutable"],
          format: ["UPPER_CASE"],
        },
      ],
    ],
  },
  {
    description: "should support the public modifier",
    content: `
          contract MyContract {
            function myPublicFunction() public {}
                     ^^^^^^^^^^^^^^^^
            function MyPrivateFunction() private {}
                     ^^^^^^^^^^^^^^^^^
            function MyExternalFunction() external {}
                     ^^^^^^^^^^^^^^^^^^
            function MyInternalFunction() internal {}
                     ^^^^^^^^^^^^^^^^^^

          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["public"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the private modifier",
    content: `
          contract MyContract {
            function MyPublicFunction() public {}
                     ^^^^^^^^^^^^^^^^
            function myPrivateFunction() private {}
                     ^^^^^^^^^^^^^^^^^
            function MyExternalFunction() external {}
                     ^^^^^^^^^^^^^^^^^^
            function MyInternalFunction() internal {}
                     ^^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["private"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the external modifier",
    content: `
          contract MyContract {
            function MyPublicFunction() public {}
                     ^^^^^^^^^^^^^^^^
            function MyPrivateFunction() private {}
                     ^^^^^^^^^^^^^^^^^
            function myExternalFunction() external {}
                     ^^^^^^^^^^^^^^^^^^
            function MyInternalFunction() internal {}
                     ^^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["external"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the internal modifier",
    content: `
          contract MyContract {
            function MyPublicFunction() public {}
                     ^^^^^^^^^^^^^^^^
            function MyPrivateFunction() private {}
                     ^^^^^^^^^^^^^^^^^
            function MyExternalFunction() external {}
                     ^^^^^^^^^^^^^^^^^^
            function myInternalFunction() internal {}
                     ^^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["internal"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the view modifier",
    content: `
          contract MyContract {
            function myViewFunction() public view {}
                     ^^^^^^^^^^^^^^
            function MyPureFunction() public pure {}
                     ^^^^^^^^^^^^^^
            function MyPayableFunction() public payable {}
                     ^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["view"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the pure modifier",
    content: `
          contract MyContract {
            function MyViewFunction() public view {}
                     ^^^^^^^^^^^^^^
            function myPureFunction() public pure {}
                     ^^^^^^^^^^^^^^
            function MyPayableFunction() public payable {}
                     ^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["pure"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the payable modifier",
    content: `
          contract MyContract {
            function MyViewFunction() public view {}
                     ^^^^^^^^^^^^^^
            function MyPureFunction() public pure {}
                     ^^^^^^^^^^^^^^
            function myPayableFunction() public payable {}
                     ^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["payable"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the virtual modifier",
    content: `
          contract MyContract {
            function myVirtualFunction() public virtual {}
                     ^^^^^^^^^^^^^^^^^
            function MyNonVirtualFunction() public {}
                     ^^^^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["virtual"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the override modifier",
    content: `
          contract MyContract {
            function myOverrideFunction() public override {}
                     ^^^^^^^^^^^^^^^^^^
            function MyNonOverrideFunction() public {}
                     ^^^^^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["override"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should support the abstract modifier",
    content: `
          contract camelCaseContract {}
                   ^^^^^^^^^^^^^^^^^
          abstract contract PascalCaseContract {}
                            ^^^^^^^^^^^^^^^^^^
        `,
    config: [
      [
        {
          selector: "contract",
          format: ["PascalCase"],
        },
        {
          selector: "contract",
          modifiers: ["abstract"],
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should have to match all selector modifiers",
    content: `
          contract MyContract {
            function myFunction() public {}
            function myVirtualFunction() public virtual {}
            function myOverrideFunction() public override {}
            function myVirtualOverrideFunction() public virtual override {}
                     ^^^^^^^^^^^^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["virtual", "override"],
          format: ["PascalCase"],
        },
      ],
    ],
  },
  {
    description: "should give higher priority to multiple modifiers",
    content: `
          contract MyContract {
            function myFunction() public {}
            function myVirtualFunction() public virtual {}
            function myOverrideFunction() public override {}
            function MyVirtualOverrideFunction() public virtual override {}
            function my_pure_virtual_override_function() public virtual override pure {}
          }
        `,
    config: [
      [
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "function",
          modifiers: ["virtual", "override"],
          format: ["PascalCase"],
        },
        {
          selector: "function",
          modifiers: ["pure", "virtual", "override"],
          format: ["snake_case"],
        },
      ],
    ],
  },
  {
    description: "should support the noParameter modifier",
    content: `
          contract MyContract {
            function NoParameters() public {}
                     ^^^^^^^^^^^^
            function WithParameters(uint x) public {}
          }
        `,
    config: [
      [
        {
          selector: "function",
          modifiers: ["noParameters"],
          format: ["camelCase"],
        },
      ],
    ],
  },
  {
    description: "should support the hasParameters modifier",
    content: `
          contract MyContract {
            function NoParameters() public {}
            function WithParameters(uint x) public {}
                     ^^^^^^^^^^^^^^
          }
        `,
    config: [
      [
        {
          selector: "function",
          modifiers: ["hasParameters"],
          format: ["camelCase"],
        },
      ],
    ],
  },
];

describe(ruleName, async () => {
  const ruleTester = new RuleTester(ruleName);
  ruleTester.runFixtures(fixtures);
});
