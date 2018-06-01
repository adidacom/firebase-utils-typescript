// modules
import * as assert from 'assert'
import {init} from '../../RTDB/util'
import {parsePermalink, escapeFirebaseKey, unEscapeFirebaseKey, formatPermalink, getUidFromPermalink} from '../../RTDB/util'

describe('util', () => {

	it('escapeFirebaseKey and unEscapeFirebaseKey should escape Firebase keys', async () => {
		
		let initialString = '.sdf$sdf[sdf]sdf#/sdf'

		let string = escapeFirebaseKey(initialString)

		assert.equal(string, '%2Esdf%24sdf%5Bsdf%5Dsdf%23%2Fsdf')

		string = unEscapeFirebaseKey(string)

		assert.equal(string, initialString)

		initialString = '.sdf$.$$sdf[[[[sdf]s...df####/s$$df'

		string = escapeFirebaseKey(initialString)

		assert.equal(string, '%2Esdf%24%2E%24%24sdf%5B%5B%5B%5Bsdf%5Ds%2E%2E%2Edf%23%23%23%23%2Fs%24%24df')

		string = unEscapeFirebaseKey(string)

		assert.equal(string, initialString)

	})

	it('formatPermalink should format permalinks', async () => {
		
		let permalink = '/users/something//something/'

		permalink = formatPermalink(permalink)

		assert.equal(permalink, 'users/something/something')

		permalink = 'users/something//something/'

		permalink = formatPermalink(permalink)

		assert.equal(permalink, 'users/something/something')

		permalink = '///users/something//something//'

		permalink = formatPermalink(permalink)

		assert.equal(permalink, 'users/something/something')

	})

	it('formatPermalink should format permalinks', async () => {
		
		let permalink = '/users/something//something/'

		const uid = getUidFromPermalink(permalink)

		assert.equal(uid, 'something')

	})

	it('parsePermalink should parse permalinks', async () => {

		let parsedPermalink = parsePermalink('/bookReviews/A Tale of Two Cities by Charles Dickens (414)/0b545a02c99fcd481e65551e79943f/')

		assert.deepEqual(parsedPermalink, {type: 'bookReviews', username: 'A Tale of Two Cities by Charles Dickens (414)', reviewUid: '0b545a02c99fcd481e65551e79943f'})

		parsedPermalink = parsePermalink('/amazonReviews/B0721SS1B3/8101b4f49c2a227f9e9c4197fe1f52/replies/03057d3481f1060b1993a5a1f0f615/')

		assert.deepEqual(
			parsedPermalink, 
			{
				type: 'amazonReviews', 
				username: 'B0721SS1B3', 
				reviewUid: '8101b4f49c2a227f9e9c4197fe1f52', 
				replyUids: ['03057d3481f1060b1993a5a1f0f615'], 
				currentReplyUid: '03057d3481f1060b1993a5a1f0f615'
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
				currentReplyUid: '03057d3481f1060b1993a5a1f0f615'
			}
		)

	})

	

})

