// Allure 3 report settings, used by `npm run test:allure` and `npm run report:allure`.
// The results come from the allure-playwright reporter in playwright.config.ts.
export default {
  name: 'Tasklane E2E',
  output: './allure-report',
  plugins: {
    awesome: {
      options: {
        // One self-contained index.html: opens without a server, e.g. from a CI artifact.
        singleFile: true,
        reportLanguage: 'en',
        groupBy: ['parentSuite', 'suite', 'subSuite'],
      },
    },
  },
};
