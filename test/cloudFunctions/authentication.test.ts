// modules
import * as assert from 'assert'
import {restoreStubs, createStubs} from './stub'
import * as mockDb1 from '../mockDbs/mockDb1.json'
import {getDbPath} from '../util'

// globals
let myFunctions
const stubs = {}

describe('authentication', () => {

	beforeEach( () => {
		createStubs(stubs)
		myFunctions = require('../../functions/src/authentication')
	})

	afterEach( () => {
		restoreStubs(stubs)
	})

	describe('handleReferral', () => {

		const request = { query: {token: 'testToken'}, ip: '1.1.1.1' }
		const response = null

		it('handleReferral should handleReferral if user\'s ip is already there', async () => {

			const users = mockDb1.users
			const user1Uid = Object.values(users)[0].uid

			await myFunctions.handleReferral(request, response)

			// called verifyIdToken with token
			const arg = stubs.verifyIdToken.args[0][0]
			assert.equal( arg , 'testToken' )

			// check that ip does not get updated because ip is already there
			assert(!stubs.update.called)

		})

		describe('handleReferral', () => {

			// change user's ip
			const users = mockDb1.users
			const user1Uid = Object.values(users)[0].uid
			const originalIp = users[user1Uid].ip

			before( () => {
				users[user1Uid].ip = null
			})

			after( () => {
				users[user1Uid].ip = originalIp
			})

			it('handleReferral should handleReferral if user\'s ip is not there', async () => {

				await myFunctions.handleReferral(request, response)

				// called getSnapshot and got correct user
				let arg = stubs.ref.args[0][0]
				const user1Path = `users/${user1Uid}`
				assert.equal(arg, `/${user1Path}`)

				// check if ip gets updated
				arg = stubs.update.args[0][0]
				assert.equal(arg[`${user1Path}/ip`], '1.1.1.1')

				// check if incremented if referrer is unique
				assert(stubs.transaction.called)
				
				// check if not incremented if ip is not unique
				const user2Uid = Object.values(users)[1].uid
				users[user2Uid].ip = '1.1.1.1'
				await myFunctions.handleReferral(request, response)	
				arg = stubs.update.args[1][0]
				assert.equal(arg[`${user1Path}/ip`], '1.1.1.1')
				assert(stubs.transaction.calledOnce)

				// change user's ip back
				users[user1Uid].ip = originalIp

			})

		})

	})

	it('initializeUser should initialize user', async () => {

		const uid = 'testUser'
		const timestamp = Date.now()

		const updates = {}
		updates[`users/${uid}/email`] = "john@email.com"
		updates[`users/${uid}/name`] = "John Smith"
		updates[`users/${uid}/uid`] = uid
		updates[`users/${uid}/roz`] = 0
		updates[`users/${uid}/reviewCount`] = 0
		updates[`users/${uid}/reviewsSentCount`] = 0
		updates[`users/${uid}/repliesSentCount`] = 0 
		updates[`users/${uid}/replyCount`] = 0
		updates[`users/${uid}/timestamp`] = timestamp
		updates[`users/${uid}/image`] = "https://example.com/photo.jpg"
		updates[`users/${uid}/followingCount`] = 0
		updates[`users/${uid}/followerCount`] = 0

		// for onTrigger cloud functions, the argument is the event being passed 
		await myFunctions.initializeUser({
			timestamp: timestamp,
			data: {
				uid: uid,
				email: "john@email.com",
				displayName: "John Smith",
				photoURL: "https://example.com/photo.jpg"
			}
		})

		// first argument for the first time the update stub was called
		const arg = stubs.update.args[0][0]

		assert.deepEqual(updates, arg)

	})

	it('updateUserAlias should update user alias', async () => {

		const uid = 'testUser'
		const timestamp = Date.now()

		const current = {username: 'testUser', name: 'John Smith'}

		await myFunctions.updateUserAlias({
			data: {
				val: () => {},
				current: { val: () => current },
				previous: { val: () => {} } 
			},
			params: {uid: uid}
		})

		const arg = stubs.update.args[0][0]

		assert.deepEqual(arg, { 'userAliases/testUser/': { username: 'testUser', name: 'John Smith' } })

	})


})


