const { getHAPClient, getGithubClient } = require("./util");

const execute = async ({
  ghToken,
  ghOwner,
  ghRepo,
  ghPullNumber,
  ghEventPayload,
  apiKey,
  projectId,
  projectClosedStage,
  messagePrefix,
  closePrefix,
  logger,
}) => {
  const gh = getGithubClient(ghToken, ghOwner, ghRepo);
  const items = await gh.findItems(ghPullNumber, messagePrefix, closePrefix);
  const [hasComment, existingCommentId] = await gh.hasExistingComment(
    ghPullNumber
  );

  if (hasComment) {
    logger(`Found existing GH comment: ${existingCommentId}`);
  }

  logger(`Found ${items.length} comments and commits that reference HAP items`);

  const hap = getHAPClient(projectId, apiKey);
  const stages = await hap.getHAPWorkItemStages();
  const closedStage = stages.find((s) => s.name === projectClosedStage);

  if (!closedStage) {
    throw new Error(
      `Invalid closed stage '${projectClosedStage}'. Options are: ${stages
        .map((s) => s.name)
        .join(",")}`
    );
  }

  logger(`Closed Stage '${closedStage.name}' = '${closedStage.stageId}'`);

  const closedStageId = closedStage.stageId;
  const shouldCloseItems =
    ghEventPayload.action === "closed" && ghEventPayload.merged === true;

  if (shouldCloseItems) {
    const closeProms = items
      .filter((i) => i.closing)
      .map((i) => i.workItems)
      .flat()
      .map((wi) => hap.setHAPWorkItemStage(wi, closedStageId));

    logger(`Merge detected, closing items if needed`);
    await Promise.all(closeProms);
  }

  const allItemIds = items.map((i) => i.workItems).flat();

  logger(`Found ${allItemIds.length} HAP items`);

  const allItems = await Promise.all(
    allItemIds.map((id) => hap.getHAPWorkItem(id))
  );

  let comment = `## HackNPlan Items (${allItemIds.length})\n`;
  allItems.forEach((item) => {
    stageIdName = stages.find((s) => s.stageId === item.stageId).name;
    comment +=
      "- [" +
      item.title +
      "](" +
      item.userUrl +
      ") (" +
      stageIdName +
      ")\n```\n" +
      item.description +
      "\n```\n";
  });

  const modifiedCommentId = await gh.createOrUpdateComment(
    ghPullNumber,
    comment,
    hasComment ? existingCommentId : undefined
  );

  logger(
    `Workflow completed. ${
      hasComment ? "Updated" : "Created"
    } comment ${modifiedCommentId} with ${allItemIds.length} HAP items.`
  );

  return modifiedCommentId;
};

module.exports = {
  execute,
};
