const axios = require('axios');
const formatProjectItems = require('./formatProjectItems');

/**
 *
 * @param {WebtaskContext} ctx https://webtask.io/docs/context
 * @param {Function} cb Callback function
 */
function todoistAccess(ctx, cb) {
  const query = ctx.query || ctx.data;
  const projectName = query.projectName && query.projectName.toUpperCase();

  if (!projectName)
    return cb(
      new Error(`Undefined parameter 'projectName'.`)
    );

  const { TODOIST_API_TOKEN } = ctx.secrets;
  const projectId = ctx.secrets[`TODOIST_PROJECT_ID_${projectName}`];

  if (!projectId)
    return cb(
      new Error(`Invalid project name ('${projectName}'); project id not found.`)
    );

  // API REFERENCE: https://developer.todoist.com/sync/v7
  const todoistInstance = axios.create({
    baseURL: 'https://todoist.com/api/v7',
    headers: {
      'Authorization': `Bearer ${TODOIST_API_TOKEN}`
    }
  });

  function onFetchProjectData(res) {
    const projectItems = formatProjectItems(res.data);
    return cb(null, projectItems);
  }

  todoistInstance.post('projects/get_data', { project_id: projectId })
    .then(onFetchProjectData)
    .catch(err => cb(err));
}


//#region [main] teste local

if (process.env.NODE_ENV === 'test') {
  const path = require('path');
  require('dotenv').load({
    path: path.join(__dirname, '.env'),
  });


  todoistAccess({secrets: process.env, data: {projectName: 'artigos'}}, (err, response) => {
    if (err) console.error('ERROR>>', err.message);
    else console.log(response);
  });
}

//#endregion


module.exports = todoistAccess;
