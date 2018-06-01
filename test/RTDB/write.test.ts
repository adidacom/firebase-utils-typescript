// modules
import * as assert from 'assert'
import {logIn, exists, getSnapshot} from './util'
import {follow, unfollow, createReview, editReview, createReply, editReply, editSettings} from '../../RTDB/write/'
import {getUidFromPermalink} from '../../RTDB/util'
import {getOwnUid} from '../../RTDB/authentication'

describe('write', async () => {
	
	const ownUsername = 'iAmAdmin'

	it('should log in', async () => {
		await logIn('admin@rozet.io', 'password')
	})

	it('follow and unfollow should handle follows', async () => {

		const usernameToFollow = 'regularjonas39895'

		let doesExist = await exists(`following/${ownUsername}/${usernameToFollow}/`)

		assert.equal(doesExist, false)

		await follow(ownUsername, usernameToFollow, 'users')

		doesExist = await exists(`following/${ownUsername}/${usernameToFollow}/`)

		assert.equal(doesExist, true)

		await unfollow(ownUsername, usernameToFollow)

		doesExist = await exists(`following/${ownUsername}/${usernameToFollow}/`)

		assert.equal(doesExist, false)

	})

	it('createReview and editReview should create and edit reviews', async () => {

		const userOrTopicName = 'testUser'
		const reviewType = 'userReviews'
		let content = 'this is my content'
		const title = 'this is my title'
		const image = 'https://image.com/image.jpg'
		const video = 'https://video.com/video'
		const banner = 'https://image.com/banner.jpg'
		const rating = 2

		let permalink = await createReview(ownUsername, userOrTopicName, reviewType, {content, title, image, video, /*banner,*/ rating})

		const reviewUid = getUidFromPermalink(permalink)
		permalink = `reviewsSent/${ownUsername}/${reviewUid}`

		let snapshot = await getSnapshot(permalink)

		assert.equal(snapshot.content, 'this is my content')
		assert(!snapshot.banner)

		content = 'this is my edited content'

		await editReview(permalink, {content, title, image, video, banner, rating})

		snapshot = await getSnapshot(permalink)

		assert.equal(snapshot.content, 'this is my edited content')
		assert.equal(snapshot.banner, 'https://image.com/banner.jpg')

	})

	it('createReply and editReply should create and edit replies', async () => {

		const permalinkOfReplyRecipient = '/userReviews/testUser/-L7QoxafwwO0AyJUkFo-/'
		let content = 'this is my content'
		const image = 'https://image.com/image.jpg'
		const video = 'https://video.com/video'
		const rating = -1

		let permalink = await createReply(ownUsername, permalinkOfReplyRecipient, {content, /*image,*/ video, rating})

		const replyUid = getUidFromPermalink(permalink)
		permalink = `repliesSent/${ownUsername}/${replyUid}`

		let snapshot = await getSnapshot(permalink)

		assert.equal(snapshot.content, 'this is my content')
		assert(!snapshot.banner)

		content = 'this is my edited content'

		await editReply(permalink, {content, image, video, rating})

		snapshot = await getSnapshot(permalink)

		assert.equal(snapshot.content, 'this is my edited content')
		assert.equal(snapshot.image, 'https://image.com/image.jpg')

	})

	it('editSettings should edit settings', async () => {

		const uid = getOwnUid()

		assert.equal(uid, 'zp0CeageZ4ge3Q5dPLLWEegmFxp2')

		let name = 'my test name'
		const country = 'wonderland'
		const bio = 'I am cool.'
		const url = 'https://google.com'
		const image = 'https://image.com/image.jpg'
		const banner = "https://banner.com/banner.jpg"

		await editSettings(uid, {name, country, bio, url, /*image,*/ banner})

		const permalink = `users/${uid}`

		let snapshot = await getSnapshot(permalink)

		assert.equal(snapshot.name, 'my test name')
		assert(!snapshot.image)

		name = 'this is my edited name'

		await editSettings(uid, {name, country, bio, url, image, banner})

		snapshot = await getSnapshot(permalink)

		assert.equal(snapshot.name, 'this is my edited name')
		assert.equal(snapshot.image, 'https://image.com/image.jpg')

	})

})


