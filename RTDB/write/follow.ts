import firebase from 'firebase'
import {update, escapeFirebaseKey, getNewFirebaseKey} from '../util'

const follow = async (ownUsername, usernameToFollow, reviewType) => {
	/* reviewType is users, books, movies, urls, etc. */

	usernameToFollow = escapeFirebaseKey(usernameToFollow)
	ownUsername = escapeFirebaseKey(ownUsername)

	let updates = {}
	updates[`following/${ownUsername}/${usernameToFollow}/timestamp`] = firebase.database.ServerValue.TIMESTAMP
	updates[`following/${ownUsername}/${usernameToFollow}/type`] = reviewType
	updates[`following/${ownUsername}/${usernameToFollow}/username`] = ownUsername
	await update(updates)

	return 'success'
}

const unfollow = async (ownUsername, usernameToUnfollow) => {
	
	usernameToUnfollow = escapeFirebaseKey(usernameToUnfollow)
	ownUsername = escapeFirebaseKey(ownUsername)

	let updates = {}
	updates[`following/${ownUsername}/${usernameToUnfollow}/`] = null
	await update(updates)

	return 'success'
}

export {follow, unfollow}