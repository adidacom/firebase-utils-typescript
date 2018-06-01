// modules
import * as assert from 'assert'
import {init} from '../../RTDB/util'
import {logIn} from './util'
import {setUniqueUsername, usernameIsSet, __private} from '../../RTDB/authentication'

describe('authentication', () => {

	it('usernameIsUnique should check if username is unique', async () => {
		
		let unique = await __private.usernameIsUnique('awesomemarc31977')

		assert.equal(unique, false)

		unique = await __private.usernameIsUnique('uniqueusername')

		assert.equal(unique, true)

	})

	it('usernameIsSet should check if username is set', async () => {
		
		let isSet = await usernameIsSet('02da5126e97bdb3b5c9724311fa593')

		assert.equal(isSet, true)

		isSet = await usernameIsSet('03db52718212e2b4d971129b18a5d5')

		assert.equal(isSet, false)

	})

	/* This test cannot be automated

	it('setUniqueUserName should set a unique username', async () => {
		
		await logIn('admin@rozet.io', 'password')

		await setUniqueUsername('zp0CeageZ4ge3Q5dPLLWEegmFxp2', 'awesomemarc3193377')

	})
	*/


})

