// modules
import * as assert from 'assert'
import {restoreStubs, createStubs} from './stub'
import {ConvertType, parsePermalink, exists, tokenToUid, ipIsUnique, userExists, decrement, decrementToZero, increment, incrementNewAverage, incrementRecalculatedAverage, getSnapshot, update, sortBy} from '../../functions/src/util'
import * as mockDb1 from '../mockDbs/mockDb1.json'
import {deepCopy} from '../util'

// globals
const stubs = {}

describe('util', () => {

	beforeEach( () => {
		createStubs(stubs)
	})

	afterEach( () => {
		restoreStubs(stubs)
	})

	it('tokenToUid should decode token', async () => {
		
		const uid = await tokenToUid('testToken')

		// decoded token equals 
		assert.equal( uid , Object.values(mockDb1.users)[0].uid )

		// first argument for the first time the update stub was called
		const arg = stubs.verifyIdToken.args[0][0]
		assert.equal( arg , 'testToken' )

	})

	it('ipIsUnique should check for unique ip', () => {
		
		// is unique
		const users = deepCopy( mockDb1.users )
		const user1 = Object.values(users)[0]
		assert( ipIsUnique(user1.ip, user1.uid, users) )

		// is no longer unique
		const user2 = Object.values(users)[1]
		users[user2.uid].ip = user1.ip
		assert.equal( ipIsUnique(user1.ip, user1.uid, users), false )

	})

	it('userExists should check if user exists', () => {
		
		// user exists
		const users = deepCopy( mockDb1.users )
		const user1 = Object.values(users)[0]
		assert( userExists(user1.uid, users) )

		// user no longer exists
		user1.uid += 'a'
		assert.equal( userExists(user1.uid, users), false )

		user1.uid = undefined
		assert.equal( userExists(user1.uid, users), false )

	})

	it('increment should increment', async () => {
		
		await increment()

		let numberToIncrement = 5
		let numberIncremented = stubs.transaction.callArgWith(0, [numberToIncrement])
		assert.equal(numberToIncrement+1, numberIncremented)

		numberToIncrement = 0
		numberIncremented = stubs.transaction.callArgWith(0, [numberToIncrement])
		assert.equal(numberToIncrement+1, numberIncremented)

		numberToIncrement = undefined
		numberIncremented = stubs.transaction.callArgWith(0, [numberToIncrement])
		assert.equal(1, numberIncremented)

		numberToIncrement = 100000000
		numberIncremented = stubs.transaction.callArgWith(0, [numberToIncrement])
		assert.equal(numberToIncrement+1, numberIncremented)

		numberToIncrement = 'string'
		numberIncremented = stubs.transaction.callArgWith(0, [numberToIncrement])
		assert( isNaN( numberIncremented[0]) )

		/* Explanations : 
		 *
		 *	1. callArgWith(0, [args]) is used to test the callbacks that are passed to the transaction stub
		 *	2. Increment() passes 1 callback to transaction stub when we call it ( check increment()'s code to see how )
		 *	3. Then we can recall that same callback with different arguments and test the return values of the callback
		 *
		*/

	})

	it('incrementNewAverage should calculate and increment new average', async () => {
		
		const newNumber = 1
		const oldCount = 4

		await incrementNewAverage(newNumber, oldCount)

		let oldAverage = 5
		let newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(4.2, newAverage)

		oldAverage = '5'
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(4.2, newAverage)

		oldAverage = '1.2'
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(1.16, newAverage)

		oldAverage = 0
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(0.20, newAverage)

		oldAverage = undefined
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(1, newAverage)

		assert.throws( () => {
				oldAverage = 100000000
				newAverage = stubs.transaction.callArgWith(0, oldAverage)
			},
			'average must be a number between 0 and 5'
		)

		assert.throws( () => {
				oldAverage = -1
				newAverage = stubs.transaction.callArgWith(0, oldAverage)
			},
			'average must be a number between 0 and 5'
		)

		assert.throws( () => {
				oldAverage = 'string'
				newAverage = stubs.transaction.callArgWith(0, oldAverage)		
			},
			'average must be a number between 0 and 5'
		)

	})

	it('incrementNewAverage exceptions', async () => {
		
		const newNumber = -1
		const oldCount = 4

		await incrementNewAverage(newNumber, oldCount, null, {min: -1, max: 1})

		let oldAverage = -0.1
		let newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(-0.27999999999999997, newAverage)

		oldAverage = '-0.2'
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(-0.36, newAverage)

		oldAverage = -0.5
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(-0.6, newAverage)

		assert.throws( () => {
				oldAverage = 1000000
				newAverage = stubs.transaction.callArgWith(0, oldAverage)
			},
			'average must be a number between -1 and 1'
		)

		assert.throws( () => {
				oldAverage = 'string'
				newAverage = stubs.transaction.callArgWith(0, oldAverage)		
			},
			'average must be a number between -1 and 1'
		)

	})

	it('incrementNewAverage more exceptions', async () => {
		
		const newNumber = 10000
		const oldCount = 4

		await incrementNewAverage(newNumber, oldCount, null, {min: -1, max: 1})

		assert.throws( () => {
				oldAverage = 1000000
				newAverage = stubs.transaction.callArgWith(0, oldAverage)
			},
			'average must be a number between -1 and 1'
		)

		assert.throws( () => {
				oldAverage = 'string'
				newAverage = stubs.transaction.callArgWith(0, oldAverage)		
			},
			'average must be a number between -1 and 1'
		)

	})

	it('incrementRecalculatedAverage should recalculate and update average', async () => {
		
		let newNumber = 1
		let oldNumber = 5
		const count = 5

		await incrementRecalculatedAverage(newNumber, oldNumber, count)

		let oldAverage = 5
		let newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(4.2, newAverage)

		oldAverage = '5'
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(4.2, newAverage)

		oldAverage = '1.2'
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(0.4, newAverage)

		oldAverage = undefined
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(1, newAverage)

		assert.throws( () => {
				oldAverage = 100000000
				newAverage = stubs.transaction.callArgWith(0, oldAverage)
			},
			'average must be a number between 0 and 5'
		)

		assert.throws( () => {
				oldAverage = -1
				newAverage = stubs.transaction.callArgWith(0, oldAverage)
			},
			'average must be a number between 0 and 5'
		)

		assert.throws( () => {
				oldAverage = 'string'
				newAverage = stubs.transaction.callArgWith(0, oldAverage)		
			},
			'average must be a number between 0 and 5'
		)

	})

	it('incrementRecalculatedAverage exceptions', async () => {

		let count = 5
		let newNumber = 1
		let oldNumber = 0

		await incrementRecalculatedAverage(newNumber, oldNumber, count)

		let oldAverage = 0
		let newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(0.2, newAverage)

		oldAverage = '0'
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(0.2, newAverage)

	})

	it('incrementRecalculatedAverage more exceptions', async () => {

		let count = 5
		let newNumber = 0
		let oldNumber = 5

		await incrementRecalculatedAverage(newNumber, oldNumber, count)

		let oldAverage = 4
		let newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(3, newAverage)

		oldAverage = '1'
		newAverage = stubs.transaction.callArgWith(0, oldAverage)
		assert.equal(0, newAverage)

	})

	it('decrement should decrement', async () => {
		
		await decrement()

		let numberToDecrement = 5
		let numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert.equal(numberToDecrement-1, numberDecremented)

		numberToDecrement = 0
		numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert.equal(numberToDecrement-1, numberDecremented)

		numberToDecrement = undefined
		numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert.equal(-1, numberDecremented)

		numberToDecrement = 100000000
		numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert.equal(numberToDecrement-1, numberDecremented)

		numberToDecrement = 'string'
		numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert( isNaN( numberDecremented[0]) )

	})

	it('decrement should decrement to minimum of 0', async () => {
		
		await decrementToZero()

		let numberToDecrement = 5
		let numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert.equal(numberToDecrement-1, numberDecremented)

		numberToDecrement = 0
		numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert.equal(numberToDecrement, numberDecremented)

		numberToDecrement = undefined
		numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert.equal(0, numberDecremented)

		numberToDecrement = 100000000
		numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert.equal(numberToDecrement-1, numberDecremented)

		numberToDecrement = -100000000
		numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert.equal(0, numberDecremented)

		numberToDecrement = 'string'
		numberDecremented = stubs.transaction.callArgWith(0, [numberToDecrement])
		assert( isNaN( numberDecremented[0]) )

	})

	it('getSnapshot should get a db path', async () => {

		// get user from local json db
		const users = deepCopy( mockDb1.users )
		const user1Uid = Object.values(users)[0].uid

		// get user using mock query
		const snapshot = await getSnapshot(`/users/${user1Uid}`)

		// users are equal
		assert.deepEqual(snapshot, users[user1Uid])

	})	

	it('update should update a db path', async () => {

		const updates = {}
		updates[`users/exampleUser/email`] = 'email@example.com'
		updates[`users/exampleUser/name`] = 'John Smith'

		await update(updates)

		// first argument for the first time the update stub was called
		const arg = stubs.update.args[0][0]

		assert.deepEqual(updates, arg)

	})	

	it('sortBy should sort by property', async () => {

		let array = [{a:99904}, {a:57}, {a:965}]

		array = sortBy(array, 'a')

		assert.deepEqual(array, [{a:57}, {a:965}, {a:99904}])

		array = sortBy(array, 'a', {order:'descending'})

		assert.deepEqual(array, [{a:99904}, {a:965}, {a:57}])

	})	

	it('exists should get if a db path exists', async () => {

		// get user from local json db
		const users = deepCopy( mockDb1.users )
		const user1Uid = Object.values(users)[0].uid

		let doesExist = await exists(`/users/${user1Uid}`)

		assert(doesExist)

		doesExist = await exists(`/users/doesntExist`)

		assert(!doesExist)

	})	

	it('parsePermalink should parse permalinks', async () => {

		let parsedPermalink = parsePermalink('/bookReviews/A Tale of Two Cities by Charles Dickens (414)/0b545a02c99fcd481e65551e79943f/')

		assert.deepEqual(
			parsedPermalink, 
			{
				type: 'bookReviews', 
				username: 'A Tale of Two Cities by Charles Dickens (414)', 
				reviewUid: '0b545a02c99fcd481e65551e79943f',
				replyUids: [], 
				currentReplyUid: null,
				permalinkType: 'review'
			})


		parsedPermalink = parsePermalink('/amazonReviews/B0721SS1B3/8101b4f49c2a227f9e9c4197fe1f52/replies/03057d3481f1060b1993a5a1f0f615/')

		assert.deepEqual(
			parsedPermalink, 
			{
				type: 'amazonReviews', 
				username: 'B0721SS1B3', 
				reviewUid: '8101b4f49c2a227f9e9c4197fe1f52', 
				replyUids: ['03057d3481f1060b1993a5a1f0f615'], 
				currentReplyUid: '03057d3481f1060b1993a5a1f0f615',
				permalinkType: 'reply'
			}
		)

		parsedPermalink = parsePermalink('/amazonReviews/B0721SS1B3/8101b4f49c2a227f9e9c4197fe1f52/replies/123456/replies/123456/replies/123456/replies/123456/replies/03057d3481f1060b1993a5a1f0f615/')

		assert.deepEqual(
			parsedPermalink, 
			{
				type: 'amazonReviews', 
				username: 'B0721SS1B3', 
				reviewUid: '8101b4f49c2a227f9e9c4197fe1f52', 
				replyUids: ['123456', '123456', '123456', '123456', '03057d3481f1060b1993a5a1f0f615'], 
				currentReplyUid: '03057d3481f1060b1993a5a1f0f615',
				permalinkType: 'reply'
			}
		)

	})

	it('ConvertType converts type', async () => {

		let type = ConvertType('amazonReviews')
		assert.equal(type, 'amazon')

		type = ConvertType('amazon')
		assert.equal(type, 'amazonReviews')

		type = ConvertType('users')
		assert.equal(type, 'userReviews')

		type = ConvertType('userReviews')
		assert.equal(type, 'users')


		type = ConvertType('books')
		assert.equal(type, 'bookReviews')

		type = ConvertType('bookReviews')
		assert.equal(type, 'books')

	})

	

	

})

