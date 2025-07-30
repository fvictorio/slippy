import type { ZodType } from "zod";
import * as z from "zod";

type UnwrapZodType<F> = F extends ZodType<infer T> ? T : never;
type Predicate = (x: unknown) => boolean;
type UnwrapConditionalUnionType<
  T extends ReadonlyArray<[Predicate, ZodType<any>]>,
> = ZodType<UnwrapZodType<T[number][1]>>;

export const conditionalUnionType = <
  T extends ReadonlyArray<[Predicate, ZodType<any>]>,
>(
  cases: [...T],
  noMatchMessage: string,
): UnwrapConditionalUnionType<T> =>
  z.any().superRefine((data, ctx) => {
    const matchingCase = cases.find(([predicate]) => predicate(data));
    if (matchingCase === undefined) {
      ctx.addIssue({
        code: "custom",
        message: noMatchMessage,
      });
      return;
    }

    const zodeType = matchingCase[1];

    const parsedData = zodeType.safeParse(data);
    if (parsedData.error !== undefined) {
      for (const issue of parsedData.error.issues) {
        ctx.addIssue({
          ...issue,
          code: "custom",
        });
      }
    }
  });
