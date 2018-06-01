// modules
import * as assert from 'assert'
import {restoreStubs, createStubs} from './stub'
import * as mockDb1 from '../mockDbs/mockDb1.json'
import {getDbPath} from '../util'
import {__private} from '../../functions/src/newsfeed'

// globals
let myFunctions
const stubs = {}

describe('newsfeed', () => {

	beforeEach( () => {
		createStubs(stubs)
		myFunctions = require('../../functions/src/')
	})

	afterEach( () => {
		restoreStubs(stubs)
	})

	it('getNewsfeed should get newsfeed', async () => {

		const users = mockDb1.users
		const username = Object.values(users)[0].username

		let result

		const request = { query: {username: username, page: 1} }
		const response = { send: (arg) => assert(arg.length) }

		await myFunctions.getNewsfeed(request, response)

	})

	it('getNotificationsFromFollowing should get all notifications from every topic/user a user is following', async () => {

		const users = mockDb1.users
		const username = Object.values(users)[0].username
		const following = mockDb1.following[username]

		const followingNotifications = await __private.getNotificationsFromFollowing(following)

		assert(typeof followingNotifications == 'object')
		assert(Object.values(followingNotifications).length !== 0)
		assert(typeof Object.values(followingNotifications)[0].type == 'string')

		let containsFollow = false

		for (const key in followingNotifications) {
			if (followingNotifications[key].type == 'follow') containsFollow = true
		}

		assert(containsFollow === false)

	})

	it('fillUserNotifications && fillFollowingNotifications should fill the dashboard page', () => {

		const array = [10,9,8,7,6,5,4,3,2,1]
		const newArray = []

		__private.fillUserNotifications(newArray, array, {itemsPerPage: 8, percentToFill: 0.25})

		assert.deepEqual(newArray, [10,9])
		assert.deepEqual(array, [8,7,6,5,4,3,2,1])

		__private.fillFollowingNotifications(newArray, array, {itemsPerPage: 8})

		assert.deepEqual(newArray, [10,9,8,7,6,5,4,3])
		assert.deepEqual(array, [2,1])

	})


})


