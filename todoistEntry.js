const TodoistAPI = require('./todoistAPI');

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

  return TodoistAPI(TODOIST_API_TOKEN).getProjectItems(projectId)
    .then(projectItems => cb(null, projectItems))
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
