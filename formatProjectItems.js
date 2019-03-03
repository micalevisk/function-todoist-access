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

function formatProjectItems(projectData, minIndent = 2) {
  const filteredItems = projectData.items
    .filter(item => !item.content.startsWith('~ ') &&
                    !item.content.endsWith('✖️') &&
                     item.indent >= minIndent);

  return filteredItems.map(item => ({
    indent: item.indent,
    checked: item.checked,
    dateAdded: formatDate(item.date_added),
    id: item.id,
    priority: item.priority,
    content: formatContent(item.content),
  }));
}


module.exports = formatProjectItems
