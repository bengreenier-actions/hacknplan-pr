const { getHAPClient, getGithubClient } = require("./util");

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

  describe("HAPClient", () => {
    const workItemId = process.env.HNP_WORKITEM_ID;
    const client = getHAPClient(
      process.env.HNP_PROJECT_ID,
      process.env.HNP_TOKEN
    );
    let workItem = undefined;

    it("should get the workItem", async () => {
      workItem = await client.getHAPWorkItem(workItemId);

      expect(workItem).not.toBeUndefined();
    });

    it("should get the stages", async () => {
      const stages = await client.getHAPWorkItemStages();

      expect(stages).not.toBeUndefined();
    });

    it("should update stages", async () => {
      await client.setHAPWorkItemStage(workItemId, workItem.stageId);
    });

    it("should comment", async () => {
      await client.addHAPWorkItemComment(workItemId, "test 123!");
    });
  });

  describe("GitHubClient", () => {
    const pullNumberId = process.env.GITHUB_PR_ID;
    const client = getGithubClient(
      process.env.GITHUB_TOKEN,
      process.env.GITHUB_OWNER,
      process.env.GITHUB_REPO
    );

    it("should scan for items", async () => {
      const commits = await client.findItems(
        pullNumberId,
        "HAP#s{0,}([0-9]+)",
        "closes, fixes"
      );

      expect(commits.length).toBeGreaterThan(0);
    });

    let existingCommentId = -1;

    it("should check if theres an existing comment", async () => {
      const [hasComment, commentId] = await client.hasExistingComment(
        pullNumberId
      );

      existingCommentId = commentId;

      expect(typeof hasComment).toBe("boolean");
      expect(commentId).not.toBeUndefined();
    });

    it("should create or update comment", async () => {
      await client.createOrUpdateComment(
        pullNumberId,
        `hello ${new Date().toISOString()}`,
        existingCommentId == -1 ? undefined : existingCommentId
      );
    });
  });
});
