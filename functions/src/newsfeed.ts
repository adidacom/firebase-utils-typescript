import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import {getSnapshot, sortBy} from './util'

const getNewsfeed = async (request, response) => {

	// this is a rest API query to get mix of user notifications and news from people/topics they are following, paginated 20 per page
	// Usage: https://appname.cloudfunctions.net/getNewsfeed?username={username}&page={number}

	const username = request.query.username
	const userNotifications = await getUserNotifications(username)

	const following = await getSnapshot(`/following/${username}`)
	const followingNotifications = await getNotificationsFromFollowing(following)

	// paginate
	const percentToFillWithUserNotifications = 0.25
	const pages = []
	const itemsPerPage = 50
	const page = request.query.page || 1
	let currentPage = 1

	while ( currentPage <= page ) {

		// stop if all arrays are empty
		if (!followingNotifications.length && !userNotifications.length) {
			break
		}

		// store the items inside pages
		const itemsFilled = []
		pages[currentPage] = itemsFilled

		// fill pages with items
		fillUserNotifications(itemsFilled, userNotifications, {itemsPerPage, percentToFill: percentToFillWithUserNotifications})
		fillFollowingNotifications(itemsFilled, followingNotifications, {itemsPerPage})
		
		currentPage++
	}

	response.send(pages[page])

}

const fillUserNotifications = (itemsFilled, userNotifications, {itemsPerPage, percentToFill}) => {

	const itemsToFill = itemsPerPage * percentToFill

	for (let i=0; i<itemsToFill; i++) {
		if (!userNotifications.length) break

		itemsFilled.push( userNotifications[0] )
		userNotifications.shift()
	}
	
}

const fillFollowingNotifications = (itemsFilled, followingNotifications, {itemsPerPage}) => {

	let counter = followingNotifications.length

	for (let i=0; i < counter; i++) {

		if (itemsFilled.length < itemsPerPage) {
			itemsFilled.push(followingNotifications[0])
			followingNotifications.shift()
		}
		else break
	}

}

const getUserNotifications = async (username) => {
	let userNotifications = await getSnapshot(`/notifications/${username}`)
	userNotifications = sortBy(userNotifications, 'timestamp', {order:'descending'})
	return userNotifications
}

const getNotificationsFromFollowing = async (following) => {
	
	let allNotifications = []

	for (const key in following) {
		following[key]

		const notifications = await getSnapshot(`/notifications/${key}`)
		for (const key in notifications) {
			if (notifications[key].type == 'follow') continue
			if (notifications[key].type == 'referral') continue
			
			allNotifications.push(notifications[key])
		}
	}

	allNotifications = sortBy(allNotifications, 'timestamp', {order:'descending'})

	return allNotifications
}


const __private = {getNotificationsFromFollowing, fillUserNotifications, fillFollowingNotifications}

export {getNewsfeed, __private}

