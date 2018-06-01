import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import {isSafePermalink, ConvertType, incrementNewAverage, incrementRecalculatedAverage, parsePermalink, exists, getSnapshot, update, increment, decrementToZero, usernameToUid} from '../util'

const handleNewReply = async (event) =>{

	// get the review details
	const current = event.data.current.val()
	const replyUid = event.params.replyUid
	if ( !isSafePermalink(current.permalink) ) throw Error('unsafe permalink')

	// get uid of the sender
	const ownUsername = event.params.ownUsername
	const ownUid = await usernameToUid(ownUsername)
	if (!ownUid) return

	// get uid of the user or topic to review, if it's a user, get his actual uid instead of his username
	let {username, replyUids} = parsePermalink(current.permalink)
	const uidToReplyTo = await usernameToUid(username)

	// add missing fields to current snapshot
	const recipient = await getReplyRecipientFromPermalink(current.permalink)
	const sender = await getSnapshot(`users/${ownUid}`)

	current.recipientsEthAddress = recipient.ethAddress || null
	current.recipient = recipient
	current.sendersEthAddress = sender.ethAddress || null
	current.averageRatingFromReplies = 0.5
	current.replyCount = 0
	current.synced = false
	
	// handle increment counts in /users/
	await increment(`users/${uidToReplyTo}/replyCount`)
	await increment(`users/${ownUid}/repliesSentCount`)	

	const receivingNode = removeLastReplyFromPermalink(current.permalink)
	const receivingNodeSnapshot = await getSnapshot(`${receivingNode}`)

	// handle reply tree counts
	await increment(`${receivingNode}/replyCount`)

	// handle average reply rating
	await incrementNewAverage(
		current.rating, 
		receivingNodeSnapshot.replyCount,
		`${receivingNode}/averageRatingFromReplies`,
		{min:-1, max: 1}
	)

	// handle updating repliesSent, repliesReceived and actual permalink tree
	let updates = {}
	updates[`${current.permalink}`] = current
	updates[`repliesSent/${ownUsername}/${replyUid}/`] = current
	updates[`repliesReceived/${recipient}/${replyUid}`] = current
	await update(updates)

	// handle notification
	updates = {}
	updates[`notifications/${recipient}/${replyUid}/content`] = current.content
	updates[`notifications/${recipient}/${replyUid}/from`] = current.sender
	updates[`notifications/${recipient}/${replyUid}/permalink`] = current.permalink
	updates[`notifications/${recipient}/${replyUid}/rating`] = current.rating
	updates[`notifications/${recipient}/${replyUid}/read`] = false
	updates[`notifications/${recipient}/${replyUid}/replyCount`] = current.replyCount
	updates[`notifications/${recipient}/${replyUid}/synced`] = current.synced 
	updates[`notifications/${recipient}/${replyUid}/timestamp`] = current.timestamp
	updates[`notifications/${recipient}/${replyUid}/to`] = current.recipient
	updates[`notifications/${recipient}/${replyUid}/type`] = 'reply'
	await update(updates)

}

const handleReplyEdit = async (event) => {

	/* 
		update sender's counts
		update receiver's counts
		create duplicates: 
			repliesReceived, 
			repliesSent, 
			notifications, 
			users/user/replyCount, 
			users/user/repliesSentCount, 
			userAliases/user/replyCount, 
			userAliases/user/repliesSentCount 
	
	*/

}

const getReplyRecipientFromPermalink = async (permalink) => {

	let {type, username, reviewUid, replyUids} = parsePermalink(permalink)
	const isReplyToReview = (replyUids.length == 1) 

	let recipient
	if (isReplyToReview) {
		const res = await getSnapshot(`${type}/${username}/${reviewUid}`)
		recipient = res.sender
	}
	else {
		permalink = removeLastReplyFromPermalink(permalink)
		const res = await getSnapshot(permalink)
		recipient = res.sender
	}
	return recipient
}

const removeLastReplyFromPermalink = (permalink) => {
	permalink = permalink.replace(/\/+$/g, '')
	permalink = permalink.replace(/\/replies\/[^\/]+$/, '')
	return permalink
}

const __private = {
	removeLastReplyFromPermalink,
	getReplyRecipientFromPermalink
}

export {
	__private,
	handleNewReply,
	handleReplyEdit
}