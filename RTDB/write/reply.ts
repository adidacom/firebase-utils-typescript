import firebase from 'firebase'
import {update, escapeFirebaseKey, getNewFirebaseKey, formatPermalink, escapeUndefineds} from '../util'

const createReply = async (ownUsername, permalinkOfReplyRecipient, {content, image, video, rating}) => {
	/* reply types are books, users, movies, etc. */

	ownUsername = escapeFirebaseKey(ownUsername)

	const replyUid = getNewFirebaseKey(`/repliesSent/${ownUsername}`)
	const permalink = formatPermalink(`${permalinkOfReplyRecipient}/replies/${replyUid}`)

	let updates = {}

	// custom input
	updates[`repliesSent/${ownUsername}/${replyUid}/content`] = content
	updates[`repliesSent/${ownUsername}/${replyUid}/image`] = image
	updates[`repliesSent/${ownUsername}/${replyUid}/video`] = video
	updates[`repliesSent/${ownUsername}/${replyUid}/rating`] = rating // number between -1 and 1
	updates[`repliesSent/${ownUsername}/${replyUid}/permalink`] = permalink

	// pre-dertermined input
	updates[`repliesSent/${ownUsername}/${replyUid}/sender`] = ownUsername
	updates[`repliesSent/${ownUsername}/${replyUid}/timestamp`] = firebase.database.ServerValue.TIMESTAMP

	escapeUndefineds(updates)
	await update(updates)

	return permalink
}

const editReply = async (permalink, {content, title, image, video, banner, rating}) => {
	// only editable within 1 hour of creating per firebase rules

	let updates = {}

	// custom input
	updates[`${permalink}/content`] = content
	updates[`${permalink}/image`] = image
	updates[`${permalink}/video`] = video
	updates[`${permalink}/rating`] = rating

	escapeUndefineds(updates)
	await update(updates)

	return 'success'
}

export {createReply, editReply}


