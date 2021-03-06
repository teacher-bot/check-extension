const defaultsShape = {
  name: 'string',
  extension: 'string',
  detailsURL: 'string',
  success: 'string',
  failure: 'string'
};

function checkForDefaults(defaults) {
  const errors = Object.keys(defaultsShape).filter(key => !Object.prototype.hasOwnProperty.call(defaults, key));
  if (errors.length > 0) errors.forEach(err => console.error(`Key \`${err}\` of type \`${defaultsShape[err]}\` is missing.`));
}

/**
 * Checks to see if the filenames of the files in a PR start with `_pins/`.
 * @param {object} context - Context argument from a Robot .on() hook.
 * @returns {object}
 */
const checkExtensions = async (robot, context, config) => {
  const {number, pull_request: pr} = context.payload;
  const {data: files} = await context.github.pullRequests.getFiles(context.repo({
    number
  }));

  // Check that all the filenames of files in the PR start with `_pins/`.
  // Returns true if there are no issues, false if there are files that do
  // not start with `_pins/`.
  const properExtension = files.filter(file => !file.filename.endsWith(config.extension)).length === 0;


  return context.repo({
    sha: pr.head.sha,
    context: config.name,
    state: properExtension ? 'success' : 'failure',
    target_url: config.detailsURL,
    description: properExtension ? config.success : config.failure
  });
};

/**
 * @typedef {Object} Config
 * @prop {string} message
 *
 * Anytime a user merges a pull request, they are reminded to delete their branch.
 * @param {Object} robot
 * @param {Config} defaults
 * @param {String} [configFilename]
 */
module.exports = (robot, defaults, configFilename = 'checkextension.yml') => {

  checkForDefaults(defaults);

  const runTests = async context => {
    let config;
    try {
      const {checkExtension} = await context.config(configFilename);
      config = Object.assign({}, defaults, checkExtension);
      } catch (err) {
      config = defaults;
    }

    const pinCheck = await checkExtensions(robot, context, config);
    return context.github.repos.createStatus(pinCheck);
  }

  robot.on('pull_request.opened', runTests);
  robot.on('pull_request.edited', runTests);
  robot.on('pull_request.reopened', runTests);
  robot.on('pull_request.synchronize', runTests);


  console.log('Yay, the teacher-bot/tests plugin was loaded!');

  // For more information on building plugins:
  // https://github.com/probot/probot/blob/master/docs/plugins.md

  // To get your plugin running against GitHub, see:
  // https://github.com/probot/probot/blob/master/docs/development.md

};
