const getDbPath = (path, db) => {

	path = parseDbPath(path)

	for (const node of path) {
		db = db[node]
	}

	return db
}

const parseDbPath = (path) => {

	path = path
		.split('/')
		.filter(s => s !== '')

	return path
}

const deepCopy = (thing) => {
	return JSON.parse( JSON.stringify(thing) )
}

export {getDbPath, deepCopy}