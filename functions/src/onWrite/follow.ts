import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import {exists, getSnapshot, update, increment, decrementToZero, usernameToUid} from '../util'

const handleFollow = async (event) =>{

	const previous = event.data.previous.val()
	const current = event.data.current.val()

	const ownUsername = event.params.ownUsername
	const usernameToFollow = event.params.usernameToFollow

	const ownUid = await usernameToUid(ownUsername)
	const uidToFollow = await usernameToUid(usernameToFollow)
	if (!ownUid) return

	const isFollow = (current !== null && previous === null) 
	const isUnfollow = (current === null && previous !== null)

	let type
	if (isFollow) type = current.type
	if (isUnfollow) type = previous.type
	const topicNameOrUserUidToFollow = (type == 'users') ? uidToFollow : usernameToFollow

	// handle increment counts in /users/ and in /${type}/
	if (isFollow) {
		await increment(`${type}/${topicNameOrUserUidToFollow}/followerCount`)
		await increment(`users/${ownUid}/followingCount`)
	}

	// handle decrement counts in /users/ and in /${type}/
	if (isUnfollow) {
		await decrementToZero(`${type}/${topicNameOrUserUidToFollow}/followerCount`)
		await decrementToZero(`users/${ownUid}/followingCount`)
	}

	// handle /followers/ duplicate
	if (isFollow || isUnfollow) {
		const updates = {}
		updates[`followers/${usernameToFollow}/${ownUsername}`] = current
		await update(updates)
	}

	// TODO create /notification/

}

export {
	handleFollow
}