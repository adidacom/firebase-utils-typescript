// modules
import * as assert from 'assert'
import {init} from '../../RTDB/util'
import {userNotification, publicUser, privateUser, topic, review, reply, reviews, userActivity, topTopics, topUsers, following, followers} from '../../RTDB/listeners'

describe('listeners', () => {

	it('userNotification should get user notifications sorted by new last 50', async () => {
		
		let counter = 0
		await new Promise( resolve => {
			const listener = userNotification.on( 'awesomemarc31977', (event) => {
				if (counter++ === 0) {
					
					assert.deepEqual(event, { read: false, type: 'review' })

					listener.off(); resolve()
				}
			})
		})

	})

	it('publicUser should get user', async () => {
		
		await new Promise( resolve => {
			const listener = publicUser.on( 'awesomemarc31977', (event) => {

				assert.equal(event.email, 'john32043@gmail.com')
				
				listener.off(); resolve()
			})
		})

	})

	it('topic should get topic', async () => {
		
		await new Promise( resolve => {
			const listener = topic.on( 'B00004T8R2', 'amazon', (event) => {

				assert.deepEqual(event, { averageRating: 3, followerCount: 30, reviewCount: 2 })
				
				listener.off(); resolve()
			})
		})

	})

	it('following should get everything a user is following sorted by new last 20', async () => {
		
		// get last 20 following sorted by new

		let counter = 0
		let timestamp = null
		let firstEvent

		await new Promise( resolve => {
			const listener = following.on( 'awesomemarc31977', {cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				listener.off(); resolve()
			})
		})

		// get next 20 following sorted by new

		counter = 0
		timestamp = firstEvent.timestamp // to get the next 20, put oldest timestamp in {endAt}
		let firstEvent2

		await new Promise( resolve => {
			const listener = following.on( 'awesomemarc31977', {cursor: timestamp},  (event, key) => {

				if (counter++ === 0) {
					firstEvent2 = event
				}
				
				listener.off(); resolve()
			})
		})

		assert.equal(firstEvent.timestamp, 1520023859629)
		assert.equal(firstEvent2.timestamp, 1519221281206)

	})

	it('followers should get followers sorted by new last 20', async () => {
		
		// get last 20 followers sorted by new

		let counter = 0
		let timestamp = null
		let firstEvent

		await new Promise( resolve => {
			const listener = followers.on( 'awesomemarc31977', {cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				listener.off(); resolve()
			})
		})

		// get next 20 followers sorted by new

		counter = 0
		timestamp = firstEvent.timestamp // to get the next 20, put oldest timestamp in {endAt}
		let firstEvent2

		await new Promise( resolve => {
			const listener = followers.on( 'awesomemarc31977', {cursor: timestamp},  (event, key) => {

				if (counter++ === 0) {
					firstEvent2 = event
				}
				
				listener.off(); resolve()
			})
		})

		assert.equal(firstEvent.timestamp, 1518408876367)
		assert.equal(firstEvent2.timestamp, 1518408876367)

	})

	it('review should get a review permalink', async () => {
		
		await new Promise( resolve => {
			const listener = review.on( 'bookReviews/Heart of Darkness by Joseph Conrad (535)/12e8733a8695a1fb5dc1d76443ff26', (event) => {

				assert.equal(event.timestamp, 1519018984114)

				listener.off(); resolve()
			})
		})

	})

	it('reply should get a reply permalink', async () => {
		
		await new Promise( resolve => {
			const listener = reply.on( 'bookReviews/Heart of Darkness by Joseph Conrad (535)/12e8733a8695a1fb5dc1d76443ff26/replies/002a24c06437aeae2b4aabf9db929d', (event) => {

				assert.equal(event.timestamp, 1518479517929)

				listener.off(); resolve()
			})
		})

	})

	it('reviews should get last 20 reviews sorted by multiple params', async () => {
	
		// get last 20 reviews sorted by new

		let counter = 0
		let firstEvent, firstEvent2

		await new Promise( resolve => {
			const listener = reviews.on( 'bookReviews', 'Pride and Prejudice by Jane Austen (1003)', {sortBy: 'new', cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				listener.off(); resolve()
			})
		})

		// get next 20 reviews sorted by new

		counter = 0
		let timestamp = firstEvent.timestamp // to get the next 20, put oldest timestamp in {cursor}

		await new Promise( resolve => {
			const listener = reviews.on( 'bookReviews', 'Pride and Prejudice by Jane Austen (1003)', {sortBy: 'new', cursor: timestamp}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent2 = event
				}

				listener.off(); resolve()
			})
		})

		assert.equal(firstEvent.timestamp, 1520028045626)
		assert.equal(firstEvent2.timestamp, 1519614845653)

		counter = 0

		// get 20 reviews sorted by popular and rating

		await new Promise( resolve => {
			const listener = reviews.on( 'bookReviews', 'Pride and Prejudice by Jane Austen (1003)', {sortBy: 'popular', cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				listener.off(); resolve()
			})
		})

		assert.equal(firstEvent.timestamp, 1520392942697)

		counter = 0

		await new Promise( resolve => {
			const listener = reviews.on( 'bookReviews', 'Pride and Prejudice by Jane Austen (1003)', {sortBy: 'positive', cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				listener.off(); resolve()
			})
		})

		
		assert.equal(firstEvent.timestamp, 1520309406323)

	})

	it('topUsers should get top 20 Users sorted by multiple params', async () => {
	
		let counter = 0
		let firstEvent

		await new Promise( resolve => {
			const listener = topUsers.on( {sortBy: 'popular', cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				listener.off(); resolve()
			})
		})

		assert.equal(firstEvent.reviewCount, 12)

		firstEvent = null
		counter = 0

		await new Promise( resolve => {
			const listener = topUsers.on( {sortBy: 'followerCount', cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				listener.off(); resolve()
			})
		})

		assert.equal(firstEvent.followerCount, 19)

	})

	it('topTopics should get a topicType with top 20 topics sorted by multiple params', async () => {
	
		let counter = 0
		let firstEvent

		await new Promise( resolve => {
			const listener = topTopics.on( 'movies', {sortBy: 'popular', cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				listener.off(); resolve()
			})
		})

		assert.equal(firstEvent.reviewCount, 1)

		firstEvent = null
		counter = 0

		await new Promise( resolve => {
			const listener = topTopics.on( 'movies', {sortBy: 'followerCount', cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				listener.off(); resolve()
			})
		})

		assert.equal(firstEvent.followerCount, 20)

	})

	it('userActivity should get a user\'s last 20 reviews and replies sorted by new', async () => {
		
		// get last 20 replies and reviews sorted by new

		let counter = 0
		let firstEvent

		let listener = await new Promise( resolve => {
			const listener = userActivity.on( 'awesomemarc51588', {cursor: null}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent = event
				}

				if (counter === 11) {
					resolve(listener)
				}
			})
		})
		listener.off()

		// get next 20 replies and reviews sorted by new

		counter = 0
		let timestamp = firstEvent.timestamp // to get the next 20, put oldest timestamp in {endAt}
		let firstEvent2

		listener = await new Promise( resolve => {
			const listener = userActivity.on( 'awesomemarc51588', {cursor: timestamp}, (event, key) => {
				
				if (counter++ === 0) {
					firstEvent2 = event
				}

				if (counter === 11) {
					resolve(listener)
				}
			})
		})
		listener.off()

		assert.equal(firstEvent.timestamp, 1519984908890)
		assert.equal(firstEvent2.timestamp, 1519095054039)

	})


})

