// modules
import * as assert from 'assert'
import {restoreStubs, createStubs} from './stub'
import * as mockDb1 from '../mockDbs/mockDb1.json'
import {__private} from '../../functions/src/onWrite/reply'

// globals
const stubs = {}
let myFunctions

describe('onWrite', () => {

	beforeEach( () => {
		createStubs(stubs)
		myFunctions = require('../../functions/src/onWrite')
	})

	afterEach( () => {
		restoreStubs(stubs)
	})

	const users = mockDb1.users
	const user1Username = Object.values(users)[0].username
	const user2Username = Object.values(users)[1].username
	const user5Username = Object.values(users)[4].username

	describe('handleFollow', () => {

		it('should return if own uid doesn\'t exist', async () => {

			let current = {timestamp: Date.now(), type: 'users', username: user2Username}
			let previous = null

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: 'noUidTest',
					usernameToFollow: user2Username
				}
			}
			
			let errMessage
			try {
				await myFunctions.handleFollow(event)
			}
			catch (e) {errMessage = e.message}

			assert.equal(errMessage, 'Cannot read property \'uid\' of undefined')

		})

		it('should so nothing if both isFollow and isUnfollow are null or non-null at the same time', async () => {

			let current = null
			let previous = null

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					usernameToFollow: user2Username
				}
			}

			await myFunctions.handleFollow(event)

			assert(!stubs.transaction.called)
			assert(!stubs.update.called)

			current = {timestamp: Date.now(), type: 'users', username: user2Username}
			previous = {timestamp: Date.now(), type: 'users', username: user2Username}

			event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					usernameToFollow: user2Username
				}
			}

			await myFunctions.handleFollow(event)

			assert(!stubs.transaction.called)
			assert(!stubs.update.called)

		})

		it('isFollow should increment and update', async () => {

			let current = {timestamp: Date.now(), type: 'users', username: user2Username}
			let previous = null

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					usernameToFollow: user2Username
				}
			}

			await myFunctions.handleFollow(event)

			assert(stubs.transaction.callCount == 2)
			assert(stubs.update.callCount == 1)

			// callback incremented
			let number = stubs.transaction.callArgWith(0, [5])[0]
			assert.equal(6, number)

		})

		it('isUnfollow should decrement and update', async () => {

			let current = null
			let previous = {timestamp: Date.now(), type: 'users', username: user2Username}

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					usernameToFollow: user2Username
				}
			}

			await myFunctions.handleFollow(event)

			assert(stubs.transaction.callCount == 2)
			assert(stubs.update.callCount == 1)

			// callback decremented
			let number = stubs.transaction.callArgWith(0, [5])[0]
			assert.equal(4, number)

		})

	})

	describe('handleNewReview', () => {

		const current = {
			permalink: 'users/swimmatt42013/-L7bINDQppDBsOv4JQw1',
			timestamp: 1521077815022,
			synced: false,
			image: 'https://image.com/image.jpg',
			replyCount: 0,
			rating: 2,
			video: 'https://video.com/video',
			content: 'this is my content',
			sender: 'iAmAdmin',
			title: 'this is my title'
		}

		it('should return if own uid doesn\'t exist', async () => {

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: 'noUidTest',
					reviewUid: 'testReviewUid'
				}
			}
			
			let errMessage
			try {
				await myFunctions.handleNewReview(event)
			}
			catch (e) {errMessage = e.message}

			assert.equal(errMessage, 'Cannot read property \'uid\' of undefined')

		})

		it('should handle a user review', async () => {

			let current = { 
				permalink: 'userReviews/swimmatt42013/-L7bINDQppDBsOv4JQw1',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/image.jpg',
				replyCount: 0,
				rating: 2,
				video: 'https://video.com/video',
				content: 'this is my content',
				sender: 'iAmAdmin',
				title: 'this is my title' 
			}

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					reviewUid: 'testReviewUid'
				}
			}
			
			await myFunctions.handleNewReview(event)

			assert.equal(stubs.update.callCount, 2)
			assert.equal(stubs.transaction.callCount, 3)

			const notifications = { 
				'notifications/swimmatt42013/testReviewUid/content': 'this is my content',
				'notifications/swimmatt42013/testReviewUid/from': 'iAmAdmin',
				'notifications/swimmatt42013/testReviewUid/permalink': 'userReviews/swimmatt42013/-L7bINDQppDBsOv4JQw1',
				'notifications/swimmatt42013/testReviewUid/rating': 2,
				'notifications/swimmatt42013/testReviewUid/read': false,
				'notifications/swimmatt42013/testReviewUid/replyCount': 0,
				'notifications/swimmatt42013/testReviewUid/synced': false,
				'notifications/swimmatt42013/testReviewUid/timestamp': 1521077815022,
				'notifications/swimmatt42013/testReviewUid/to': 'swimmatt42013',
				'notifications/swimmatt42013/testReviewUid/title': 'this is my title',
				'notifications/swimmatt42013/testReviewUid/type': 'review' 
			}
			assert.deepEqual(stubs.update.args[1][0], notifications)

			const updates = { 
				'reviewsSent/down-to-earthmarc40417/testReviewUid/': { 
					permalink: 'userReviews/swimmatt42013/-L7bINDQppDBsOv4JQw1',
					timestamp: 1521077815022,
					synced: false,
					image: 'https://image.com/image.jpg',
					replyCount: 0,
					rating: 2,
					video: 'https://video.com/video',
					content: 'this is my content',
					sender: 'iAmAdmin',
					title: 'this is my title',
					recipientsEthAddress: '0x28c98fb29eb938afd9f2e2d59b2fb20e743cf181',
					recipient: 'swimmatt42013',
					sendersEthAddress: '0x421d8635b55d5345dc25042719703afd56508658',
					averageRatingFromReplies: 0.5 
				},
				'userReviews/swimmatt42013/testReviewUid': { 
					permalink: 'userReviews/swimmatt42013/-L7bINDQppDBsOv4JQw1',
					timestamp: 1521077815022,
					synced: false,
					image: 'https://image.com/image.jpg',
					replyCount: 0,
					rating: 2,
					video: 'https://video.com/video',
					content: 'this is my content',
					sender: 'iAmAdmin',
					title: 'this is my title',
					recipientsEthAddress: '0x28c98fb29eb938afd9f2e2d59b2fb20e743cf181',
					recipient: 'swimmatt42013',
					sendersEthAddress: '0x421d8635b55d5345dc25042719703afd56508658',
					averageRatingFromReplies: 0.5 
				} 
			}
			assert.deepEqual(stubs.update.args[0][0], updates)
			
		})

		it('should handle a book reviews', async () => {

			let current = { 
				permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/image.jpg',
				replyCount: 0,
				rating: 2,
				video: 'https://video.com/video',
				content: 'this is my content',
				sender: 'iAmAdmin',
				title: 'this is my title' 
			}

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					reviewUid: 'testReviewUid'
				}
			}
			
			await myFunctions.handleNewReview(event)

			assert.equal(stubs.update.callCount, 2)
			assert.equal(stubs.transaction.callCount, 3)

			const notifications = { 
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/content': 'this is my content',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/from': 'iAmAdmin',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/permalink': 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/rating': 2,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/read': false,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/replyCount': 0,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/synced': false,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/timestamp': 1521077815022,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/to': 'A Tale of Two Cities by Charles Dickens (414)',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/title': 'this is my title',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/type': 'review' 
			}
			assert.deepEqual(stubs.update.args[1][0], notifications)

			const updates = { 
				'reviewsSent/down-to-earthmarc40417/testReviewUid/': { 
					permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
					timestamp: 1521077815022,
					synced: false,
					image: 'https://image.com/image.jpg',
					replyCount: 0,
					rating: 2,
					video: 'https://video.com/video',
					content: 'this is my content',
					sender: 'iAmAdmin',
					title: 'this is my title',
					recipientsEthAddress: null,
					recipient: 'A Tale of Two Cities by Charles Dickens (414)',
					sendersEthAddress: '0x421d8635b55d5345dc25042719703afd56508658',
					averageRatingFromReplies: 0.5 
				},
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid': { 
					permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
					timestamp: 1521077815022,
					synced: false,
					image: 'https://image.com/image.jpg',
					replyCount: 0,
					rating: 2,
					video: 'https://video.com/video',
					content: 'this is my content',
					sender: 'iAmAdmin',
					title: 'this is my title',
					recipientsEthAddress: null,
					recipient: 'A Tale of Two Cities by Charles Dickens (414)',
					sendersEthAddress: '0x421d8635b55d5345dc25042719703afd56508658',
					averageRatingFromReplies: 0.5 
				} 
			}
			assert.deepEqual(stubs.update.args[0][0], updates)
			
		})

	})

	describe('handleReviewEdit', () => {

		const previous = { 
			permalink: 'users/swimmatt42013/-L7bINDQppDBsOv4JQw1',
			timestamp: 1521077815022,
			synced: false,
			image: 'https://image.com/oldimage.jpg',
			replyCount: 0,
			rating: 5,
			video: 'https://video.com/oldvideo',
			content: 'this is my old content',
			sender: 'iAmAdmin',
			title: 'this is my old title' 
		}

		const current = { 
			permalink: 'users/swimmatt42013/-L7bINDQppDBsOv4JQw1',
			timestamp: 1521077815022,
			synced: false,
			image: 'https://image.com/image.jpg',
			replyCount: 0,
			rating: 2,
			video: 'https://video.com/video',
			content: 'this is my content',
			sender: 'iAmAdmin',
			title: 'this is my title' 
		}

		it('should return if own uid doesn\'t exist', async () => {

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: 'noUidTest',
					reviewUid: 'testReviewUid'
				}
			}
			
			let errMessage
			try {
				await myFunctions.handleReviewEdit(event)
			}
			catch (e) {errMessage = e.message}

			assert.equal(errMessage, 'Cannot read property \'uid\' of undefined')

		})

		it('should handle a user review', async () => {

			const previous = { 
				permalink: 'users/swimmatt42013/-L7bINDQppDBsOv4JQw1',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/oldimage.jpg',
				replyCount: 0,
				rating: 5,
				video: 'https://video.com/oldvideo',
				content: 'this is my old content',
				sender: 'iAmAdmin',
				title: 'this is my old title' 
			}

			let current = { 
				permalink: 'userReviews/swimmatt42013/-L7bINDQppDBsOv4JQw1',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/image.jpg',
				replyCount: 0,
				rating: 2,
				video: 'https://video.com/video',
				content: 'this is my content',
				sender: 'iAmAdmin',
				title: 'this is my title' 
			}

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					reviewUid: 'testReviewUid'
				}
			}
			
			await myFunctions.handleReviewEdit(event)

			assert.equal(stubs.update.callCount, 2)
			assert.equal(stubs.transaction.callCount, 1)

			const notifications = { 
				'notifications/swimmatt42013/testReviewUid/content': 'this is my content',
				'notifications/swimmatt42013/testReviewUid/rating': 2,
				'notifications/swimmatt42013/testReviewUid/title': 'this is my title',
			}
			assert.deepEqual(stubs.update.args[1][0], notifications)

			const updates = { 
				'userReviews/swimmatt42013/testReviewUid/content': 'this is my content',
				'userReviews/swimmatt42013/testReviewUid/title': 'this is my title',
				'userReviews/swimmatt42013/testReviewUid/image': 'https://image.com/image.jpg',
				'userReviews/swimmatt42013/testReviewUid/video': 'https://video.com/video',
				'userReviews/swimmatt42013/testReviewUid/banner': null,
				'userReviews/swimmatt42013/testReviewUid/rating': 2 
			}
			assert.deepEqual(stubs.update.args[0][0], updates)
			
		})

		it('should handle a book review', async () => {

			const previous = { 
				permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/oldimage.jpg',
				replyCount: 0,
				rating: 5,
				video: 'https://video.com/oldvideo',
				content: 'this is my old content',
				sender: 'iAmAdmin',
				title: 'this is my old title' 
			}

			let current = { 
				permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/image.jpg',
				replyCount: 0,
				rating: 2,
				video: 'https://video.com/video',
				content: 'this is my content',
				sender: 'iAmAdmin',
				title: 'this is my title' 
			}

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					reviewUid: 'testReviewUid'
				}
			}
			
			await myFunctions.handleReviewEdit(event)

			assert.equal(stubs.update.callCount, 2)
			assert.equal(stubs.transaction.callCount, 1)

			const notifications = { 
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/content': 'this is my content',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/rating': 2,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/title': 'this is my title',
			}
			assert.deepEqual(stubs.update.args[1][0], notifications)

			const updates = { 
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/content': 'this is my content',
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/title': 'this is my title',
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/image': 'https://image.com/image.jpg',
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/video': 'https://video.com/video',
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/banner': null,
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/rating': 2 
			}
			assert.deepEqual(stubs.update.args[0][0], updates)
			
		})

		it('should handle a book review with edit to 0 rating', async () => {

			const previous = { 
				permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/oldimage.jpg',
				replyCount: 0,
				rating: 5,
				video: 'https://video.com/oldvideo',
				content: 'this is my old content',
				sender: 'iAmAdmin',
				title: 'this is my old title' 
			}

			let current = { 
				permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/image.jpg',
				replyCount: 0,
				rating: 0,
				video: 'https://video.com/video',
				content: 'this is my content',
				sender: 'iAmAdmin',
				title: 'this is my title' 
			}

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					reviewUid: 'testReviewUid'
				}
			}
			
			await myFunctions.handleReviewEdit(event)

			assert.equal(stubs.update.callCount, 2)
			assert.equal(stubs.transaction.callCount, 1)

			const notifications = { 
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/content': 'this is my content',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/rating': 0,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/title': 'this is my title',
			}
			assert.deepEqual(stubs.update.args[1][0], notifications)

			const updates = { 
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/content': 'this is my content',
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/title': 'this is my title',
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/image': 'https://image.com/image.jpg',
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/video': 'https://video.com/video',
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/banner': null,
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/rating': 0
			}
			assert.deepEqual(stubs.update.args[0][0], updates)

		})

	})

	describe('handleNewReply', () => {

		const current = { 
			permalink: '/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359',
			timestamp: 1521077815022,
			synced: false,
			image: 'https://image.com/image.jpg',
			replyCount: 0,
			rating: 1,
			video: 'https://video.com/video',
			content: 'this is my content',
			sender: 'iAmAdmin',
		}

		it('should return if own uid doesn\'t exist', async () => {

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: 'noUidTest',
					replyUid: 'testReplyUid'
				}
			}
			
			let errMessage
			try {
				await myFunctions.handleNewReply(event)
			}
			catch (e) {errMessage = e.message}

			assert.equal(errMessage, 'Cannot read property \'uid\' of undefined')

		})

		it('should throw if unsafe permalink', async () => {

			const current = { 
				permalink: 'users/someUsername',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/image.jpg',
				replyCount: 0,
				rating: 1,
				video: 'https://video.com/video',
				content: 'this is my content',
				sender: 'iAmAdmin',
			}

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: 'noUidTest',
					replyUid: 'someUsername'
				}
			}
			
			let errMessage
			try {
				await myFunctions.handleNewReply(event)
			}
			catch (e) {errMessage = e.message}

			assert.equal(errMessage, 'unsafe permalink')

		})

		it('should handle a user review\'s reply', async () => {

			let current = { 
				permalink: '/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359',
				timestamp: 1521077815022,
				image: 'https://image.com/image.jpg',
				rating: 1,
				video: 'https://video.com/video',
				content: 'this is my content',
				sender: 'iAmAdmin',
			}

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					replyUid: 'testReplyUid'
				}
			}
			
			await myFunctions.handleNewReply(event)

			assert.equal(stubs.update.callCount, 2)
			assert.equal(stubs.transaction.callCount, 4)

			const notifications = { 
				'notifications/awesomemarc31977/testReplyUid/content': 'this is my content',
				'notifications/awesomemarc31977/testReplyUid/from': 'iAmAdmin',
				'notifications/awesomemarc31977/testReplyUid/permalink': '/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359',
				'notifications/awesomemarc31977/testReplyUid/rating': 1,
				'notifications/awesomemarc31977/testReplyUid/read': false,
				'notifications/awesomemarc31977/testReplyUid/replyCount': 0,
				'notifications/awesomemarc31977/testReplyUid/synced': false,
				'notifications/awesomemarc31977/testReplyUid/timestamp': 1521077815022,
				'notifications/awesomemarc31977/testReplyUid/to': 'awesomemarc31977',
				'notifications/awesomemarc31977/testReplyUid/type': 'reply' 
			}
			assert.deepEqual(stubs.update.args[1][0], notifications)

			const updates = {
				'/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359': { 
					permalink: '/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359',
					timestamp: 1521077815022,
					image: 'https://image.com/image.jpg',
					rating: 1,
					video: 'https://video.com/video',
					content: 'this is my content',
					sender: 'iAmAdmin',
					recipientsEthAddress: null,
					recipient: 'awesomemarc31977',
					sendersEthAddress: '0x421d8635b55d5345dc25042719703afd56508658',
					averageRatingFromReplies: 0.5,
					replyCount: 0,
					synced: false 
				},
				'repliesSent/down-to-earthmarc40417/testReplyUid/': { 
					permalink: '/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359',
					timestamp: 1521077815022,
					image: 'https://image.com/image.jpg',
					rating: 1,
					video: 'https://video.com/video',
					content: 'this is my content',
					sender: 'iAmAdmin',
					recipientsEthAddress: null,
					recipient: 'awesomemarc31977',
					sendersEthAddress: '0x421d8635b55d5345dc25042719703afd56508658',
					averageRatingFromReplies: 0.5,
					replyCount: 0,
					synced: false 
				},
				'repliesReceived/awesomemarc31977/testReplyUid': { 
					permalink: '/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359',
					timestamp: 1521077815022,
					image: 'https://image.com/image.jpg',
					rating: 1,
					video: 'https://video.com/video',
					content: 'this is my content',
					sender: 'iAmAdmin',
					recipientsEthAddress: null,
					recipient: 'awesomemarc31977',
					sendersEthAddress: '0x421d8635b55d5345dc25042719703afd56508658',
					averageRatingFromReplies: 0.5,
					replyCount: 0,
					synced: false 
				}
			}
			assert.deepEqual(stubs.update.args[0][0], updates)

		})
/*
		it('should handle a book reviews', async () => {

			let current = { 
				permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
				timestamp: 1521077815022,
				synced: false,
				image: 'https://image.com/image.jpg',
				replyCount: 0,
				rating: 2,
				video: 'https://video.com/video',
				content: 'this is my content',
				sender: 'iAmAdmin',
				title: 'this is my title' 
			}

			let event = {
				data: {
					val: () => {},
					current: { val: () => current },
					previous: { val: () => previous } 
				},
				params: {
					ownUsername: user1Username,
					replyUid: 'testReplyUid'
				}
			}
			
			await myFunctions.handleNewReply(event)

			assert.equal(stubs.update.callCount, 2)
			assert.equal(stubs.transaction.callCount, 3)

			const notifications = { 
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/content': 'this is my content',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/from': 'iAmAdmin',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/permalink': 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/rating': 2,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/read': false,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/replyCount': 0,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/synced': false,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/timestamp': 1521077815022,
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/to': 'A Tale of Two Cities by Charles Dickens (414)',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/title': 'this is my title',
				'notifications/A Tale of Two Cities by Charles Dickens (414)/testReviewUid/type': 'review' 
			}
			assert.deepEqual(stubs.update.args[1][0], notifications)

			const updates = { 
				'reviewsSent/down-to-earthmarc40417/testReviewUid/': { 
					permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
					timestamp: 1521077815022,
					synced: false,
					image: 'https://image.com/image.jpg',
					replyCount: 0,
					rating: 2,
					video: 'https://video.com/video',
					content: 'this is my content',
					sender: 'iAmAdmin',
					title: 'this is my title',
					recipientsEthAddress: null,
					recipient: 'A Tale of Two Cities by Charles Dickens (414)',
					sendersEthAddress: '0x421d8635b55d5345dc25042719703afd56508658',
					averageRatingFromReplies: 0.5 
				},
				'bookReviews/A Tale of Two Cities by Charles Dickens (414)/testReviewUid': { 
					permalink: 'bookReviews/A Tale of Two Cities by Charles Dickens (414)/-L7bINDQppDBsOv4JQw1',
					timestamp: 1521077815022,
					synced: false,
					image: 'https://image.com/image.jpg',
					replyCount: 0,
					rating: 2,
					video: 'https://video.com/video',
					content: 'this is my content',
					sender: 'iAmAdmin',
					title: 'this is my title',
					recipientsEthAddress: null,
					recipient: 'A Tale of Two Cities by Charles Dickens (414)',
					sendersEthAddress: '0x421d8635b55d5345dc25042719703afd56508658',
					averageRatingFromReplies: 0.5 
				} 
			}
			assert.deepEqual(stubs.update.args[0][0], updates)
			
		})
*/
		it('getReplyRecipientFromPermalink should get recipient', async () => {
		
			let recipient = await __private.getReplyRecipientFromPermalink('/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359')

			assert.equal(recipient, 'awesomemarc31977')

			let newPermalink = __private.removeLastReplyFromPermalink('/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359/replies/5a50856b3e98a479de72c2eec3f359/')

			assert.equal(newPermalink, '/userReviews/singnatalie66730/11c4e9bc4c99f26375a054aaad7601/replies/5a50856b3e98a479de72c2eec3f359')

		})

	})


})

