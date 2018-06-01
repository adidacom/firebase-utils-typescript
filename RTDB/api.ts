import {escapeFirebaseKey} from './util'
import fetch from 'node-fetch'

const getNewsfeed = async (username, page=1) => {

	username = escapeFirebaseKey(username)
	
	try {
		const response = await fetch(`https://us-central1-rozet-486af.cloudfunctions.net/getNewsfeed?username=${username}&page=${page}`)
		const json = await response.json()
		return json
	}
	catch (e) {console.log(e)}
}

export {getNewsfeed}