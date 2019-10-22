// Todoist's API Reference: https://developer.todoist.com/sync/v8
const axios = require('axios');

const REGEX_ITEM_CONTENT = /^(?:\{([^}]+)\}\s*)?([^(\s]+)(?:\s*\((.+)\))?/;
const REGEX_PLAYLIST_CONTENT = /\bplaylist\b/;
const REGEX_IGNORE_ITEM = /✖️:?$/;
const REGEX_CATEGORY_ITEM = /:$/;
const NIL = -1;


function formatDate(dateAdded) {
  const [, day, month, year] = dateAdded.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return `${month} ${day}, ${year}`;
}

function formatContent(content) {
  const matches = content.match(REGEX_ITEM_CONTENT);
  if (!matches) return { text: content };

  const [, rawTag, link, text] = matches;

  if (!link || !text) return { text: content };

  const contentMetadata = {
    link,
    text,
  };

  const tag = rawTag
            ? rawTag.toLowerCase()
            : ( REGEX_PLAYLIST_CONTENT.test(content) && 'playlist' );

  return tag
       ? { ...contentMetadata, tag }
       : contentMetadata;
}

function formatProjectItems({ items }, minIndent = 2) {
  const formatItem = item => ({
    checked: !!item.checked,
    dateAdded: formatDate(item.date_added),
    id: item.id,
    priority: item.priority,
    content: formatContent(item.content),
  });

  const selectedItems = [];
  let lastSkippedParentId = NIL;

  for (const item of items) { // Filter and format items
    const {
      id: currId,
      parent_id: currParentId,
      content: currContent,
    } = item;

    if (REGEX_IGNORE_ITEM.test(currContent)) { // Skip this item and nested ones
      lastSkippedParentId = currId;
      continue;
    }

    const isCategory = REGEX_CATEGORY_ITEM.test(currContent);
    const parentSkipped = currParentId == lastSkippedParentId;
    const skipItem = (parentSkipped || isCategory);

    if (!skipItem) {
      selectedItems.push( formatItem(item) );
    }

    if (currParentId !== lastSkippedParentId) {
      lastSkippedParentId = NIL;
    }

    if (isCategory && parentSkipped) {
      lastSkippedParentId = currId;
    }
  }

  return selectedItems;
}

function makeInstance(apiToken) {
  const conn = axios.create({
    baseURL: 'https://api.todoist.com/sync/v8',
    headers: {
      'Authorization': `Bearer ${apiToken}`
    }
  });

  const getProjectItems = projectId =>
    conn.post('projects/get_data', { project_id: projectId })
        //.then(({ data }) => data) // DEBUG mode
        .then(({ data }) => formatProjectItems(data))

  return {
    getProjectItems,
  }
}


module.exports = makeInstance
