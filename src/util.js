const request = require("request");
const github = require("@actions/github");

const commentMarker = `<span id="hacknplan-pr-marker" />`;

const fetch = async (conf) => {
  return new Promise((resolve, reject) => {
    request(conf, (err, response, body) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          response,
          body,
        });
      }
    });
  });
};

const getHAPClient = (projectId, accessToken) => {
  return {
    getHAPWorkItem: function (itemId) {
      return getHAPWorkItem(projectId, accessToken, itemId);
    },
    getHAPWorkItemStages: function () {
      return getHAPWorkItemStages(projectId, accessToken);
    },
    setHAPWorkItemStage: function (itemId, stageId) {
      return setHAPWorkItemStage(projectId, accessToken, itemId, stageId);
    },
    addHAPWorkItemComment: function (itemId, commentText) {
      return addHAPWorkItemComment(projectId, accessToken, itemId, commentText);
    },
  };
};

const getGithubClient = (accessToken, owner, repo) => {
  return {
    findItems: async function (pullNumber, messagePrefix, closePrefix) {
      const comments = await findComments(
        accessToken,
        owner,
        repo,
        pullNumber,
        messagePrefix,
        closePrefix
      );
      const commits = await findCommits(
        accessToken,
        owner,
        repo,
        pullNumber,
        messagePrefix,
        closePrefix
      );

      return comments.concat(commits);
    },
    hasExistingComment: function (pullNumber) {
      return hasExistingComment(accessToken, owner, repo, pullNumber);
    },
    createOrUpdateComment: function (pullNumber, comment, commentId) {
      return createOrUpdateComment(
        accessToken,
        owner,
        repo,
        pullNumber,
        comment,
        commentId
      );
    },
  };
};

const makeHAPUserUrl = (projectId, itemId) => {
  return `https://app.hacknplan.com/p/${projectId}/kanban?&taskId=${itemId}`;
};

const getHAPWorkItem = async (projectId, accessToken, itemId) => {
  const res = await fetch({
    method: "GET",
    url: `https://api.hacknplan.com/v0/projects/${projectId}/workitems/${itemId}`,
    json: true,
    headers: {
      Authorization: `ApiKey ${accessToken}`,
    },
  });

  return {
    title: res.body.title,
    itemId,
    projectId,
    userUrl: makeHAPUserUrl(projectId, itemId),
    description: res.body.description,
    stageId: res.body.stage.stageId,
  };
};

const getHAPWorkItemStages = async (projectId, accessToken) => {
  const res = await fetch({
    method: "GET",
    url: `https://api.hacknplan.com/v0/projects/${projectId}/stages`,
    json: true,
    headers: {
      Authorization: `ApiKey ${accessToken}`,
    },
  });

  return res.body.map(({ stageId, name }) => ({ stageId, name }));
};
const setHAPWorkItemStage = async (projectId, accessToken, itemId, stageId) => {
  const res = await fetch({
    method: "PATCH",
    url: `https://api.hacknplan.com/v0/projects/${projectId}/workitems/${itemId}`,
    json: {
      stageId,
    },
    headers: {
      Authorization: `ApiKey ${accessToken}`,
    },
  });

  if (res.response.statusCode !== 200) {
    throw new Error(`Invalid response ${res.response.statusCode}: ${res.body}`);
  }
};
const addHAPWorkItemComment = async (
  projectId,
  accessToken,
  itemId,
  commentText
) => {
  const res = await fetch({
    method: "POST",
    url: `https://api.hacknplan.com/v0/projects/${projectId}/workitems/${itemId}/comments`,
    json: true,
    body: commentText,
    headers: {
      Authorization: `ApiKey ${accessToken}`,
    },
  });

  if (res.response.statusCode.toString()[0] !== "2") {
    throw new Error(`Invalid response ${res.response.statusCode}: ${res.body}`);
  }
};

const textMatcher = (txt, messagePrefix, closePrefix) => {
  const messagePrefixRe = new RegExp(messagePrefix, "g");
  const closePrefixes = closePrefix.split(",").map((s) => s.trim());

  return txt.map((message) => {
    let closing = false;

    if (closePrefixes.some((l) => message.includes(l))) {
      closing = true;
    }

    const messageMatches = [...message.matchAll(messagePrefixRe)];

    const workItems = messageMatches.map((m) => m[1]);

    return {
      closing,
      workItems,
    };
  });
};

const findCommits = async (
  accessToken,
  owner,
  repo,
  pullNumber,
  messagePrefix,
  closePrefix
) => {
  const octokit = github.getOctokit(accessToken);
  const messagePrefixRe = new RegExp(messagePrefix, "g");

  const commits = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return textMatcher(
    commits.data
      .filter((d) => messagePrefixRe.test(d.commit.message))
      .map((d) => d.commit.message),
    messagePrefix,
    closePrefix
  );
};

const findComments = async (
  accessToken,
  owner,
  repo,
  pullNumber,
  messagePrefix,
  closePrefix
) => {
  const octokit = github.getOctokit(accessToken);
  const messagePrefixRe = new RegExp(messagePrefix, "g");

  const comments = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: pullNumber,
  });

  return textMatcher(
    comments.data
      .filter((d) => !d.body.includes(commentMarker))
      .filter((d) => messagePrefixRe.test(d.body))
      .map((d) => d.body),
    messagePrefix,
    closePrefix
  );
};

const hasExistingComment = async (accessToken, owner, repo, pullNumber) => {
  const octokit = github.getOctokit(accessToken);

  const comments = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: pullNumber,
  });

  const comment = comments.data.find((d) => d.body.includes(commentMarker));

  return [typeof comment !== "undefined", comment ? comment.id : -1];
};

const createOrUpdateComment = async (
  accessToken,
  owner,
  repo,
  pullNumber,
  comment,
  commentId
) => {
  const octokit = github.getOctokit(accessToken);

  let commentResponse;
  if (commentId) {
    commentResponse = await octokit.issues.updateComment({
      owner,
      repo,
      issue_number: pullNumber,
      comment_id: commentId,
      body: comment + `\n\n${commentMarker}`,
    });
  } else {
    commentResponse = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: comment + `\n\n${commentMarker}`,
    });
  }

  return commentResponse.data.id;
};

module.exports = {
  getHAPClient,
  getGithubClient,
};
