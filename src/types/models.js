/**
 * @typedef {Object} Note
 * @property {string} id - Unique identifier
 * @property {string} title - Note title
 * @property {string} content - Note content
 * @property {'text' | 'url' | 'image' | 'word'} type - Note type
 * @property {string} [url] - URL for url/image types
 * @property {string} [previewData] - Preview data (JSON string)
 * @property {string[]} [tags] - Array of tags
 * @property {string} [context] - Internet context
 * @property {boolean} [isEncrypted] - Whether note is encrypted
 * @property {boolean} [pinned] - Whether note is pinned
 * @property {string} [folderId] - Parent folder ID
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Folder} [folder] - Parent folder object (optional include)
 * @property {Relation[]} [relationsFrom] - Relations from this note (optional include)
 */

/**
 * @typedef {Object} Folder
 * @property {string} id - Unique identifier
 * @property {string} name - Folder name
 * @property {string} [parentFolderId] - Parent folder ID
 * @property {'slate' | 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'pink'} [color] - Folder color
 * @property {string} [icon] - Folder icon
 * @property {number} [order] - Display order
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Object} [_count] - Count of related items (optional include)
 * @property {number} [_count.notes] - Number of notes in folder
 * @property {number} [_count.subfolders] - Number of subfolders
 */

/**
 * @typedef {Object} Relation
 * @property {string} id - Unique identifier
 * @property {string} noteFromId - Source note ID
 * @property {string} noteToId - Target note ID
 * @property {'reference' | 'related' | 'duplicate' | 'child'} [relationType] - Type of relation
 * @property {number} [strength] - Relation strength (0-1)
 * @property {string} [context] - Relation context
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

export {};
