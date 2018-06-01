import firebase from 'firebase'

const init = () => {
	const config = { 
		apiKey: "AIzaSyBS7_HQSqI3ldA1nYr9680JhtE-5wBxllw",
		authDomain: "rozet-486af.firebaseapp.com",
		databaseURL: "https://rozet-486af.firebaseio.com",
		projectId: "rozet-486af",
		storageBucket: "rozet-486af.appspot.com",
		messagingSenderId: "376253458864"
	}
	return firebase.initializeApp(config)
}

const update = (pathsToUpdate) => {
	firebase.database().ref().update(pathsToUpdate)
}

const getNewFirebaseKey = (firebasePathToPushTo) => {
	return firebase.database().ref().child(firebasePathToPushTo).push().key
}

const set = (objectToInsert, firebasePath) => {
	firebase.database().ref(firebasePath).set(objectToInsert)
}

const getOnlyNew = (ref, event='value') => {

	return (cb) => {
		let initialDataLoaded = false
		const listener = firebase.database().ref(ref).on(event, (snapshot) => {
			if (initialDataLoaded) {
				const data = snapshot.val()
				const key = snapshot.key
				cb(data, key)
			}
		})

		firebase.database().ref(ref).once('value', (snapshot) => {
			initialDataLoaded = true
		})

		return listener
	}
}

const getOldAndNew = (ref, {event='value', orderByChild, limitToLast, limitToFirst, startAt, endAt}={event:'value'}) => {

	ref = firebase.database().ref(ref)

	if (orderByChild) ref = ref.orderByChild(orderByChild)
	if (limitToFirst) ref = ref.limitToFirst(limitToFirst)
	if (limitToLast) ref = ref.limitToLast(limitToLast)
	if (startAt) ref = ref.startAt(startAt)
	if (endAt) ref = ref.endAt(endAt)

	return (cb) => {
		ref.on(event, (snapshot) => {
			const data = snapshot.val()
			const key = snapshot.key
			cb(data, key)
		})
		return ref
	}
}

const getSnapshot = async (path, event='value') => {
	const snapshot = await firebase.database().ref(path).once(event)
	return snapshot.val()
}

const exists = async (path, event='value') => {
	const snapshot = await firebase.database().ref(path).once(event)
	return snapshot.exists()
}

const escapeFirebaseKey = (string) => {
	if (typeof string != 'string') return

	string = string.replace(/\./g, '%2E')
	string = string.replace(/\$/g, '%24')
	string = string.replace(/\[/g, '%5B')
	string = string.replace(/\]/g, '%5D')
	string = string.replace(/\#/g, '%23')
	string = string.replace(/\//g, '%2F')

	return string
}

const unEscapeFirebaseKey = (string) => {
	if (typeof string != 'string') return

	string = string.replace(/%2E/g, '.')
	string = string.replace(/%24/g, '$')
	string = string.replace(/%5B/g, '[')
	string = string.replace(/%5D/g, ']')
	string = string.replace(/%23/g, '#')
	string = string.replace(/%2F/g, '/')

	return string
}

const formatPermalink = (string) => {
	if (typeof string != 'string') return

	string = string.replace(/\/+/g, '/')
	string = string.replace(/^\//g, '')
	string = string.replace(/\/$/g, '')

	return string
}

const escapeUndefineds = (obj) => {
	if (typeof obj != 'object') return

	for (const key in obj) {
		if (obj[key] === undefined) obj[key] = null
	}
}

const getUidFromPermalink = (string) => {
	if (typeof string != 'string') return

	string = string.replace(/\/$/g, '')
	string = string.match(/\/[^\/]+$/)
	string = (string && string[0]) ? string[0].replace(/\/+/g, '') : null
	return string
}

const parsePermalink = (permalink) => {

	/* Usage:

	   Transform a permalink into an object with the following properties:

	{
		type: ''
		username: ''
		reviewUid: ''
		replyUids: ['', '', '']
		currentReplyUid: ''
	}

	*/

	permalink = permalink
		.split('/')
		.filter(s => s !== '')

	const parsed = {}
	parsed.type = permalink.shift()
	parsed.username = permalink.shift()
	parsed.reviewUid = permalink.shift()

	// handling replies
	const length = permalink.length
	for (let i=0; i<length; i++) {
		const reply = permalink.shift()
		if (!reply) break

		if (reply != 'replies') {
			if (!parsed.replyUids) parsed.replyUids = []

			parsed.replyUids.push(reply)
		}
	}

	// handling current reply
	if (parsed.replyUids && parsed.replyUids.length) {
		parsed.currentReplyUid = parsed.replyUids[parsed.replyUids.length-1]
	}

	return parsed
}

export {parsePermalink, update, getUidFromPermalink, escapeUndefineds, formatPermalink, getNewFirebaseKey, set, init, getOnlyNew, getOldAndNew, getSnapshot, exists, escapeFirebaseKey, unEscapeFirebaseKey}