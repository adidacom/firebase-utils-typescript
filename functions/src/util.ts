// put all utility / common functions here
import * as values from 'object.values'
import * as admin from 'firebase-admin'

const userExists = (uid, users) => {
	if (uid in users) return true
	else return false
}

const exists = async (path) => {
	const snapshot = await admin.database().ref(path).once('value')
	return snapshot.exists()
}

const getSnapshot = async (path) => {
	const snapshot = await admin.database().ref(path).once('value')
	return snapshot.val()
}

const usernameToUid = async (username) => {
	return await getSnapshot(`/userAliases/${username}/uid`)
}

const update = async (pathsToUpdate={}) => {
	await admin.database().ref().update(pathsToUpdate)
}

const ipIsUnique = (ip, currentUid, users) => {
	let isUnique = true

	for (const uid in users) {
		if ( uid !== currentUid && users[uid].ip === ip ) isUnique = false
	}
	return isUnique
}

const tokenToUid = async (token) => {
	const decodedToken = await admin.auth().verifyIdToken(token)
	const uid = decodedToken.uid
	return uid
}

const increment = (path) => {
	const ref = admin.database().ref(path)
	void ref.transaction( (value) => {
		let newVal = value
		;(newVal) ? newVal++ : newVal = 1
		return newVal
	})
}

const incrementNewAverage = (newNumber, oldCount, path, {min=0, max=5}={min:0, max:5}) => {
	const ref = admin.database().ref(path)
	void ref.transaction( (value) => {
		if (value === null || value === undefined) return newNumber

		const oldAverage = value
		const total = oldAverage * oldCount
		let newAverage = (newNumber+total) / (oldCount+1)
	
		if ( typeof newAverage !== 'number' 
			|| isNaN(newAverage)
			|| newAverage > max
			|| newAverage < min 
		) throw Error(`average must be a number between ${min} and ${max}`)

		return newAverage
	})
}

const incrementRecalculatedAverage = (newNumber, oldNumber, count, path, {min=0, max=5}={min:0, max:5}) => {
	const ref = admin.database().ref(path)
	void ref.transaction( (value) => {
		if (value === null || value === undefined) return newNumber

		const oldAverage = value
		const total = oldAverage * count
		const newTotal = total - oldNumber + newNumber
		let newAverage = newTotal / count

		if ( typeof newAverage !== 'number' 
			|| isNaN(newAverage)
			|| newAverage > max
			|| newAverage < min 
		) throw Error('average must be a number between 0 and 5')

		return newAverage
	})
}

const decrement = (path) => {
	const ref = admin.database().ref(path)
	void ref.transaction( (value) => {
		let newVal = value
		;(newVal) ? newVal-- : newVal = -1
		return newVal
	})
}

const decrementToZero = (path) => {
	const ref = admin.database().ref(path)
	void ref.transaction( (value) => {
		let newVal = value
		;(newVal) ? newVal-- : newVal = -1
		if (newVal < 0) newVal = 0
		return newVal
	})
}

const sortBy = (array, property, {order='ascending'}={order:'ascending'}) => {

	if (typeof array == 'object') array = values(array)

	let deepCopyArray = array.slice(0)
	deepCopyArray.sort( (a,b) => a[property] - b[property])

	if (order == 'descending') deepCopyArray = deepCopyArray.reverse()

	return deepCopyArray
}

const parsePermalink = (permalink) => {

	permalink = permalink
		.split('/')
		.filter(s => s !== '')

	const parsed = {
		type: null, 
		username: null, 
		reviewUid: null, 
		replyUids: [], 
		currentReplyUid: null,
		permalinkType: null
	}

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

	parsed.permalinkType = (parsed.replyUids.length) ? 'reply' : 'review'

	return parsed
}

const ConvertType = (reviewType) => {
	if ( /Reviews/.test(reviewType) ) {
		reviewType = reviewType.replace(/Reviews/, '')
		reviewType += 's'
	}
	else {
		reviewType = reviewType.replace(/s$/, '')
		reviewType += 'Reviews'
	}

	if (reviewType == 'amazons') reviewType = 'amazon'

	return reviewType
}

const isSafePermalink = (permalink) => {
	permalink = formatPermalink(permalink)
	const count = permalink.split("/").length - 1
	if (count >= 2) return true
	else return false
}

const formatPermalink = (string) => {
	if (typeof string != 'string') return

	string = string.replace(/\/+/g, '/')
	string = string.replace(/^\//g, '')
	string = string.replace(/\/$/g, '')

	return string
}

export {
	isSafePermalink,
	formatPermalink,
	ConvertType,
	usernameToUid,
	exists,
	userExists, 
	getSnapshot,
	update,
	ipIsUnique,
	tokenToUid,
	increment,
	incrementNewAverage,
	incrementRecalculatedAverage,
	decrement,
	decrementToZero,
	sortBy,
	parsePermalink
}