// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://slippy-lint.github.io",
  base: "/slippy",
  integrations: [
    starlight({
      title: "Slippy",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/slippy-lint/slippy",
        },
      ],
      sidebar: [
        {
          label: "Guides",
          items: [
            { label: "Getting started", slug: "guides/getting-started" },
            { label: "Configuring Slippy", slug: "guides/configuration" },
            { label: "Slippy vs Solhint", slug: "guides/slippy-vs-solhint" },
          ],
        },
        {
          label: "Reference",
          items: [{ label: "List of rules", slug: "reference/rules" }],
        },

        {
          label: "Rules",
          collapsed: true,
          autogenerate: { directory: "rules" },
        },
      ],
    }),
  ],
});
