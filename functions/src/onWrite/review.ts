import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import {isSafePermalink, ConvertType, incrementNewAverage, incrementRecalculatedAverage, parsePermalink, exists, getSnapshot, update, increment, decrementToZero, usernameToUid} from '../util'

const handleNewReview = async (event) => {

	// get the review details
	const current = event.data.current.val()
	const reviewUid = event.params.reviewUid
	if ( !isSafePermalink(current.permalink) ) throw Error('unsafe permalink')

	// get uid of the sender
	const ownUsername = event.params.ownUsername
	const ownUid = await usernameToUid(ownUsername)
	if (!ownUid) return

	// get uid of the user or topic to review, if it's a user, get his actual uid instead of his username
	let {username, type} = parsePermalink(current.permalink)
	const uidToReview = (type == 'userReviews') ? await usernameToUid(username) : username
	const typeToFetchProfile = ConvertType(type)

	// add missing fields to current snapshot
	const recipient = await getSnapshot(`${typeToFetchProfile}/${uidToReview}`)
	const sender = await getSnapshot(`users/${ownUid}`)

	current.recipientsEthAddress = (type == 'userReviews') ? recipient.ethAddress || null : null
	current.recipient = username
	current.sendersEthAddress = sender.ethAddress || null
	current.averageRatingFromReplies = 0.5
	current.replyCount = 0
	current.synced = false
	
	// handle increment counts in /users/ and in /${type}/
	await increment(`${typeToFetchProfile}/${uidToReview}/reviewCount`)
	await increment(`users/${ownUid}/reviewsSentCount`)

	// handle average
	await incrementNewAverage(current.rating, recipient.reviewCount ,`${typeToFetchProfile}/${uidToReview}/averageRating`)

	// handle updating reviewsSent and /{$type}/${username}
	let updates = {}
	updates[`reviewsSent/${ownUsername}/${reviewUid}/`] = current
	updates[`${type}/${username}/${reviewUid}`] = current
	await update(updates)

	// handle notification
	updates = {}
	updates[`notifications/${username}/${reviewUid}/content`] = current.content
	updates[`notifications/${username}/${reviewUid}/from`] = current.sender
	updates[`notifications/${username}/${reviewUid}/permalink`] = current.permalink
	updates[`notifications/${username}/${reviewUid}/rating`] = current.rating
	updates[`notifications/${username}/${reviewUid}/read`] = false
	updates[`notifications/${username}/${reviewUid}/replyCount`] = current.replyCount
	updates[`notifications/${username}/${reviewUid}/synced`] = current.synced 
	updates[`notifications/${username}/${reviewUid}/timestamp`] = current.timestamp
	updates[`notifications/${username}/${reviewUid}/to`] = current.recipient
	updates[`notifications/${username}/${reviewUid}/title`] = current.title
	updates[`notifications/${username}/${reviewUid}/type`] = 'review'
	await update(updates)

}

const handleReviewEdit = async (event) => {

	// get the review details
	const current = event.data.current.val()
	const previous = event.data.previous.val()
	const reviewUid = event.params.reviewUid

	// get uid of the sender
	const ownUsername = event.params.ownUsername
	const ownUid = await usernameToUid(ownUsername)
	if (!ownUid) return

	// get uid of the user or topic to review, if it's a user, get his actual uid instead of his username
	let {username, type} = parsePermalink(current.permalink)
	const uidToReview = (type == 'userReviews') ? await usernameToUid(username) : username
	const typeToFetchProfile = ConvertType(type)

	const recipient = await getSnapshot(`${typeToFetchProfile}/${uidToReview}`)

	// handle average
	await incrementRecalculatedAverage(current.rating, previous.rating, recipient.reviewCount ,`${typeToFetchProfile}/${uidToReview}/averageRating`)

	// handle updating /{$type}/${username}
	let updates = {}
	updates[`${type}/${username}/${reviewUid}/content`] = current.content
	updates[`${type}/${username}/${reviewUid}/title`] = current.title
	updates[`${type}/${username}/${reviewUid}/image`] = current.image || null
	updates[`${type}/${username}/${reviewUid}/video`] = current.video ||  null
	updates[`${type}/${username}/${reviewUid}/banner`] = current.banner || null
	updates[`${type}/${username}/${reviewUid}/rating`] = current.rating
	await update(updates)

	// handle notification
	updates = {}
	updates[`notifications/${username}/${reviewUid}/content`] = current.content
	updates[`notifications/${username}/${reviewUid}/rating`] = current.rating
	updates[`notifications/${username}/${reviewUid}/title`] = current.title
	await update(updates)

}

export {
	handleNewReview,
	handleReviewEdit
}