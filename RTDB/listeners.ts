import firebase from 'firebase'
import {getOnlyNew, getOldAndNew, escapeFirebaseKey} from './util'


 /* Usage:
 **
 **  const listener = userNotifications.on( username, (event) => {
 **      console.log(event)
 **  })
 **
 **	 listener.off()
 **  
 **  1. .on gets past and future events.
 **  2. .new only gets new events
 **  3. You can turn off listeners with .off()
 **  4. All theses listenners are public, except privateUser which needs the user
 **     to be authenticated with its uid.
 */


const userNotification = {

	// Get user notifications sorted by new last 50
	// Used on all pages

	new: (username, cb) => getOnlyNew(`/notifications/${username}`, { event: 'child_added' })(cb),
	on: (username, cb) => 
		getOldAndNew(`/notifications/${username}`, { 
			event: 'child_added', 
			orderByChild: 'timestamp',
			limitToLast: 50 
		})(cb)
}

const privateUser = {

	// Get authenticated user details
	// Used on settings (/settings) && dashboard page (/dashboard)

	on: (uid, cb) => getOldAndNew(`/users/${uid}`, {event: 'value'})(cb)
}

const publicUser = {

	// Get public user details
	// Used on public profile page (/users/${username})

	on: (username, cb) => getOldAndNew(`/userAliases/${username}`, {event: 'value'})(cb)
}

const topic = {

	// Get topic details
	// Used on topic page. Example "Men in Black" movie page (/${type}/${topicUid})

	on: (topicUid, type, cb) => getOldAndNew(`/${type}/${topicUid}`, {event: 'value'})(cb)
	
}

const following = {

	// Get following sorted by new
	// Used on users/Topics I follow page (/following)
	// cursor is the last's element's timestamp, this is used to create pagination

	on: (username, {cursor}, cb) => 
		getOldAndNew(`/following/${username}`, { event: 'child_added', 
			orderByChild: 'timestamp',
			limitToLast: 20,
			endAt: cursor 
		})(cb)
}

const followers = {

	// Get followers sorted by new
	// Used on my followers page (/followers)
	// cursor is the last's element's timestamp, this is used to create pagination

	on: (username, {cursor}, cb) => 
		getOldAndNew(`/followers/${username}`, { 
			event: 'child_added', 
			orderByChild: 'timestamp',
			limitToLast: 20,
			endAt: cursor 
		})(cb)
}

const review = {

	// Get ${user/topic}Reviews/${username}/${reviewKey}. 
	// Example: /bookReviews/Candide by Voltaire (130)/26cbaa13a00f37eb14acaa33a46cfc
	// This is used for permalinks to specific reviews

	on: (permalink, cb) => getOldAndNew(`${permalink}`, {event: 'value'})(cb)
}

const reply = {

	// Get ${user/topic}Reviews/${username}/${reviewKey}
	// This is used for permalinks to specific replies, note that replies of replies can go infinitely deep
	
	on: (permalink, cb) => getOldAndNew(`${permalink}`, {event: 'value'})(cb)
}

const reviews = {

	// Get user/topic reviews received sorted by popular & paginated 20 per page
	// Get user/topic reviews received sorted by new & paginated 20 per page
	// Get user/topic reviews received sorted by rating & paginated 20 per page
	
	// Used on user/topic page. Example "Men in Black" movie page (/${type}/${topicUid} or /users/${username})
	
	// review types are movieReviews, userReviews, bookReviews, etc
	// sortedBy choices are popular, new, positive (rating), negative (rating)
	// cursor is to get next 20 results, for "new" it should be the last timestamp,
	// for "popular" it should be the last replyCount and for rating it should be last rating

	on: (reviewType, topicOrUserName, {sortBy, cursor}, cb) => {

		const resultPerPage = 20

		let orderByChild
		if (sortBy == 'popular') orderByChild = 'replyCount'
		if (sortBy == 'new') orderByChild = 'timestamp'
		if (sortBy == 'positive') orderByChild = 'rating'
		if (sortBy == 'negative') orderByChild = 'rating'

		let limitToLast, limitToFirst, startAt, endAt
		
		if (sortBy == 'negative') {
			limitToFirst = resultPerPage
			startAt = cursor
		}
		else {
			limitToLast = resultPerPage
			endAt = cursor
		}

		return getOldAndNew(`/${reviewType}/${topicOrUserName}`, { 
			event: 'child_added', 
			orderByChild: orderByChild,
			limitToLast: limitToLast,
			limitToFirst: limitToFirst,
			startAt: startAt,
			endAt: endAt 
		})(cb)
	}
}

const userActivity = {

	// get my reviews sent && my replies sent sorted by new & paginated 20 per page
	// returns an object with .off() method to turn off all listeners
	
	on: (username, {cursor}, cb) => {

		const replyListener = 
			getOldAndNew(`/repliesSent/${username}`, { 
				event: 'child_added', 
				orderByChild: 'timestamp',
				limitToLast: 10,
				endAt: cursor 
			})(cb)

		const reviewListener = 
			getOldAndNew(`/reviewsSent/${username}`, { 
				event: 'child_added', 
				orderByChild: 'timestamp',
				limitToLast: 10,
				endAt: cursor 
			})(cb)

		const listeners = []
		listeners.push(replyListener)
		listeners.push(reviewListener)

		const turnOffListeners = () => {
			for (const listener of listeners) {
				listener.off()
			}
		}

		return { off: turnOffListeners }
	}
}

const topTopics = {

	// Get /${topic}/ sorted by most followers & paginated 20 per page
	// Get /${topic}/ sorted by most reviews & paginated 20 per page
	// Get /${topic}/ sorted by average ratings & paginated 20 per page

	// Used on browse users / top users page
	
	// sortedBy choices are popular, followerCount, positive (rating), negative (rating)
	// cursor is to get next 20 results, for "followerCount" it should be the last followerCount,
	// for "popular" it should be the last reviewCount and for rating it should be last averageRating

	on: (topicType, {sortBy, cursor}, cb) => {

		const resultPerPage = 20

		let orderByChild
		if (sortBy == 'followerCount') orderByChild = 'followerCount'
		if (sortBy == 'popular') orderByChild = 'reviewCount'
		if (sortBy == 'positive') orderByChild = 'averageRating'
		if (sortBy == 'negative') orderByChild = 'averageRating'

		let limitToLast, limitToFirst, startAt, endAt
		
		if (sortBy == 'negative') {
			limitToFirst = resultPerPage
			startAt = cursor
		}
		else {
			limitToLast = resultPerPage
			endAt = cursor
		}

		return getOldAndNew(`/${topicType}/`, { 
			event: 'child_added', 
			orderByChild: orderByChild,
			limitToLast: limitToLast,
			limitToFirst: limitToFirst,
			startAt: startAt,
			endAt: endAt 
		})(cb)
	}
}

const topUsers = {

	// Get ${/users/} sorted by most followers & paginated 20 per page
	// Get ${/users/} sorted by most reviews & paginated 20 per page
	// Get ${/users/} sorted by average ratings & paginated 20 per page
	
	// Used on browse users / top users page
	
	// sortedBy choices are popular, followerCount, positive (rating), negative (rating)
	// cursor is to get next 20 results, for "followerCount" it should be the last followerCount,
	// for "popular" it should be the last reviewCount and for rating it should be last averageRating

	on: ({sortBy, cursor}, cb) => {

		const resultPerPage = 20

		let orderByChild
		if (sortBy == 'followerCount') orderByChild = 'followerCount'
		if (sortBy == 'popular') orderByChild = 'reviewCount'
		if (sortBy == 'positive') orderByChild = 'averageRating'
		if (sortBy == 'negative') orderByChild = 'averageRating'

		let limitToLast, limitToFirst, startAt, endAt
		
		if (sortBy == 'negative') {
			limitToFirst = resultPerPage
			startAt = cursor
		}
		else {
			limitToLast = resultPerPage
			endAt = cursor
		}

		return getOldAndNew(`/userAliases/`, { 
			event: 'child_added', 
			orderByChild: orderByChild,
			limitToLast: limitToLast,
			limitToFirst: limitToFirst,
			startAt: startAt,
			endAt: endAt 
		})(cb)
	}
}

export {
	userNotification, 
	publicUser, 
	privateUser,
	topic, 
	review, 
	reply, 
	reviews, 
	userActivity, 
	topTopics, 
	topUsers,
	following,
	followers
}


