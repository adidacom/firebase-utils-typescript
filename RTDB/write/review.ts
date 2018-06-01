import firebase from 'firebase'
import {update, escapeFirebaseKey, getNewFirebaseKey, formatPermalink, escapeUndefineds} from '../util'

const createReview = async (ownUsername, userOrTopicName, reviewType, {content, title, image, video, banner, rating}) => {
	/* review types are books, users, movies, etc. */

	userOrTopicName = escapeFirebaseKey(userOrTopicName)
	ownUsername = escapeFirebaseKey(ownUsername)

	const reviewUid = getNewFirebaseKey(`/reviewsSent/${ownUsername}`)
	const permalink = formatPermalink(`${reviewType}/${userOrTopicName}/${reviewUid}`)

	let updates = {}

	// custom input
	updates[`reviewsSent/${ownUsername}/${reviewUid}/content`] = content
	updates[`reviewsSent/${ownUsername}/${reviewUid}/title`] = title
	updates[`reviewsSent/${ownUsername}/${reviewUid}/image`] = image
	updates[`reviewsSent/${ownUsername}/${reviewUid}/video`] = video
	updates[`reviewsSent/${ownUsername}/${reviewUid}/banner`] = banner
	updates[`reviewsSent/${ownUsername}/${reviewUid}/rating`] = rating // number between 0-5
	updates[`reviewsSent/${ownUsername}/${reviewUid}/permalink`] = permalink

	// pre-dertermined input
	updates[`reviewsSent/${ownUsername}/${reviewUid}/sender`] = ownUsername
	updates[`reviewsSent/${ownUsername}/${reviewUid}/timestamp`] = firebase.database.ServerValue.TIMESTAMP

	escapeUndefineds(updates)
	await update(updates)

	return permalink
}

const editReview = async (permalink, {content, title, image, video, banner, rating}) => {
	// only editable within 1 hour of creating per firebase rules

	let updates = {}

	// custom input
	updates[`${permalink}/content`] = content
	updates[`${permalink}/title`] = title
	updates[`${permalink}/image`] = image
	updates[`${permalink}/video`] = video
	updates[`${permalink}/banner`] = banner
	updates[`${permalink}/rating`] = rating

	escapeUndefineds(updates)
	await update(updates)

	return 'success'
}

export {createReview, editReview}


