const core = require("@actions/core");
const github = require("@actions/github");
const { execute } = require("./src/workflow");

(async () => {
  const commentId = await execute({
    ghToken: core.getInput("ghToken", { required: true }),
    ghOwner: github.context.repo.owner,
    ghRepo: github.context.repo.repo,
    ghPullNumber: github.context.issue.number,
    ghEventPayload: github.context.payload,
    apiKey: core.getInput("apiKey", { required: true }),
    projectId: core.getInput("projectId", { required: true }),
    projectClosedStage: core.getInput("projectClosedStage"),
    messagePrefix: core.getInput("messagePrefix"),
    closePrefix: core.getInput("closePrefix"),
    logger: function (msg) {
      core.info(msg);
    },
  });

  core.setOutput("commentId", commentId);
})().catch((err) => {
  core.setFailed(err);
});
