// modules
import * as assert from 'assert'
import {init} from '../../RTDB/util'
import {logIn, exists, getSnapshot} from './util'
import {follow, unfollow, createReview, editReview, createReply, editReply, editSettings} from '../../RTDB/write/'
import {getUidFromPermalink} from '../../RTDB/util'
import {getOwnUid} from '../../RTDB/authentication'

/*
describe('writeSingleReview', async () => {

	const ownUsername = 'iAmAdmin'

	it('should log in', async () => {
		const app = init()
		setTimeout( () => {
			app.delete() 
			process.exit()
		}, 10000 )
		await logIn('admin@rozet.io', 'password')
	})

	it('createReview and editReview should create and edit reviews', async () => {

		const userOrTopicName = 'A Tale of Two Cities by Charles Dickens (414)'
		const reviewType = 'bookReviews'
		let content = 'this is my content'
		const title = 'this is my title'
		const image = 'https://image.com/image.jpg'
		const video = 'https://video.com/video'
		const banner = 'https://image.com/banner.jpg'
		const rating = 2

		let permalink = await createReview(ownUsername, userOrTopicName, reviewType, {content, title, image, video, rating})

	})

})
*/

describe('writeSingleReply', async () => {

	const ownUsername = 'iAmAdmin'

	it('should log in', async () => {
		const app = init()
		setTimeout( () => {
			app.delete() 
			process.exit()
		}, 10000 )
		await logIn('admin@rozet.io', 'password')
	})

	it('createReply and editReply should create and edit replies', async () => {

		const permalinkOfReplyRecipient = 'userReviews/awesomemarc51588/0678fc1fd7b6a5f88bf4337f0c3ff4'
		let content = 'this is my content'
		const image = 'https://image.com/image.jpg'
		const video = 'https://video.com/video'
		const rating = 0

		let permalink = await createReply(ownUsername, permalinkOfReplyRecipient, {content, video, rating})

	})

})