import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import {exists, userExists, getSnapshot, update, ipIsUnique, tokenToUid, increment} from './util'

/* 
**  USER CREATION FLOW
**
**  1. User creates account using RTDB logIn()
**  2. initializeUser is trigged onCreate
**  3. if (user ip is not set) send post request to handleReferral https function which securly increments referral if IP is unique
**  4. prompt user to enter a unique username, call RTDB setUniqueUserName()
**  5. if unique username is set, updateUserAlias onWrite is triggered
*/

const handleReferral = async (request, response) => {
	
	// Usage: https://appname.cloudfunctions.net/addIpToNewAccount?token={tokenString}

	// get token
	const token = request.query.token
	const uid = await tokenToUid(token)
	// get user
	const user = await getSnapshot(`/users/${uid}`)

	if (user.ip) return

	// update ip
	const ip = request.ip
	const updates = {}
	updates[`users/${uid}/ip`] = ip
	await update(updates)

	// increment referrer's referralCount if unique
	const users = await getSnapshot(`/users/`)
	const referrerUid = user.referredBy

	if (referrerUid) {
		if ( ipIsUnique(ip, uid, users) && userExists(referrerUid, users) ) {
			increment(`/users/${referrerUid}/referralCount`)

			// TODO create referral in /referrals/
			// TODO create /notification/

		}
	}
}

const initializeUser = async (event) => {

	const uid = event.data.uid

	if ( await exists(`/users/${uid}/`) ) return 

	const updates = {}
	updates[`users/${uid}/email`] = event.data.email
	updates[`users/${uid}/name`] = event.data.displayName
	updates[`users/${uid}/uid`] = uid
	updates[`users/${uid}/roz`] = 0
	updates[`users/${uid}/reviewCount`] = 0
	updates[`users/${uid}/reviewsSentCount`] = 0
	updates[`users/${uid}/repliesSentCount`] = 0 
	updates[`users/${uid}/replyCount`] = 0
	updates[`users/${uid}/timestamp`] = event.timestamp
	updates[`users/${uid}/image`] = event.data.photoURL
	updates[`users/${uid}/followingCount`] = 0
	updates[`users/${uid}/followerCount`] = 0

	await update(updates)

}

const updateUserAlias = async (event) =>{

	const newData = event.data.val()
	const previous = event.data.previous.val()
	const current = event.data.current.val()
	const key = event.data.key

	const username = current.username
	const uid = event.params.uid

	if (!username) return

	const updates = {}
	updates[`userAliases/${username}/`] = current

	await update(updates)

	// update/create user alias but using username as keys instead of uid
	// /userAliases/ should be a duplicate of /users/ but using usernames as keys instead of uids
	// it should only have public data, not private like referral counts
	// it must include uids

}

export {
	handleReferral,
	initializeUser,
	updateUserAlias
}
