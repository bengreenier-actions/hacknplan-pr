const { getHAPClient, getGithubClient } = require("./util");
const { execute } = require("./workflow");

describe("util", () => {
  it("has env HNP_TOKEN", () => {
    expect(process.env.HNP_TOKEN).not.toBeUndefined();
  });

  it("has env HNP_PROJECT_ID", () => {
    expect(process.env.HNP_PROJECT_ID).not.toBeUndefined();
  });

  it("has env HNP_WORKITEM_ID", () => {
    expect(process.env.HNP_WORKITEM_ID).not.toBeUndefined();
  });

  it("has env GITHUB_TOKEN", () => {
    expect(process.env.GITHUB_TOKEN).not.toBeUndefined();
  });

  it("has env GITHUB_OWNER", () => {
    expect(process.env.GITHUB_OWNER).not.toBeUndefined();
  });

  it("has env GITHUB_REPO", () => {
    expect(process.env.GITHUB_REPO).not.toBeUndefined();
  });

  describe("workflow", () => {
    const workItemId = process.env.HNP_WORKITEM_ID;
    const hap = getHAPClient(process.env.HNP_PROJECT_ID, process.env.HNP_TOKEN);
    const pullNumberId = process.env.GITHUB_PR_ID;
    const gh = getGithubClient(
      process.env.GITHUB_TOKEN,
      process.env.GITHUB_OWNER,
      process.env.GITHUB_REPO
    );

    it("should execute (PR opened)", async () => {
      await execute({
        ghToken: process.env.GITHUB_TOKEN,
        ghOwner: process.env.GITHUB_OWNER,
        ghRepo: process.env.GITHUB_REPO,
        ghPullNumber: process.env.GITHUB_PR_ID,
        ghEventPayload: {
          merged: false,
          action: "opened",
        },
        apiKey: process.env.HNP_TOKEN,
        projectId: process.env.HNP_PROJECT_ID,
        projectClosedStage: "Completed",
        messagePrefix: `HAP#\s{0,}([0-9]+)`,
        closePrefix: `fixes, closes, close`,
        logger: console.log,
      });
    });
  });
});
