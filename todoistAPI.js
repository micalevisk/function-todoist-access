// Todoist's API Reference: https://developer.todoist.com/sync/v7
const axios = require('axios');

const REGEX_ITEM_CONTENT = /^(?:\{([^}]+)\}\s*)?([^(\s]+)(?:\s*\((.+)\))?/;
const REGEX_PLAYLIST_CONTENT = /\bplaylist\b/;


function formatDate(dateAdded) {
  //return dateAdded.replace(/\w+\s(\d+)\s(\w+)\s(\d+).*/, '$2 $1, $3');
  const [, day, month, year] = dateAdded.split(' ', 4);
  return `${month} ${day}, ${year}`;
}

function formatContent(content) {
  const matches = content.match(REGEX_ITEM_CONTENT);
  if (!matches) return content;

  const contentMetadata = {
    link: matches[2],
    text: matches[3],
  };

  const tag = matches[1]
            ? matches[1].toLowerCase()
            : ( REGEX_PLAYLIST_CONTENT.test(content) && 'playlist' );

  return tag
       ? { ...contentMetadata, tag }
       : contentMetadata;
}

function formatProjectItems({ items }, minIndent = 2) {
  const formatItem = item => ({
    indent: item.indent,
    checked: item.checked,
    dateAdded: formatDate(item.date_added),
    id: item.id,
    priority: item.priority,
    content: formatContent(item.content),
  });

  let selectedItems = [];
  let indentOfLastExcluded = null;

  for (const item of items) {
    if (item.content.endsWith('✖️')) { // item onde os 'filhos' também devem ser excluídos
      indentOfLastExcluded = item['indent'];
    } else {
      if (item['indent'] <= indentOfLastExcluded) {
        indentOfLastExcluded = null;
      }
      if (item['indent'] < minIndent || item.content.startsWith('~ ')) {
        continue;
      } else if (indentOfLastExcluded === null) {
        selectedItems.push( formatItem(item) );
      }
    }
  }

  return selectedItems;
}

function makeInstance(apiToken) {
  const conn = axios.create({
    baseURL: 'https://todoist.com/api/v7',
    headers: {
      'Authorization': `Bearer ${apiToken}`
    }
  });

  const getProjectItems = projectId =>
    conn.post('projects/get_data', { project_id: projectId })
        .then(({ data }) => formatProjectItems(data))

  return {
    getProjectItems,
  }
}


module.exports = makeInstance
