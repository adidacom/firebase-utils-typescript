// modules
import * as assert from 'assert'
import firebase from 'firebase'

const logIn = async (email, password) => {

	return new Promise( (resolve, reject) => {
		firebase.auth().signInWithEmailAndPassword(email, password).catch(e => {console.log(e); return reject(e)})

		// listen for login 
		firebase.auth().onAuthStateChanged( (user) => {
			if (user) {
				//console.log('logged in', user.email)
				return resolve()
			}
			//else console.log('logged out')
		})
	})
}

const exists = async (path, event='value') => {
	const snapshot = await firebase.database().ref(path).once(event)
	return snapshot.exists()
}

const getSnapshot = async (path, event='value') => {
	const snapshot = await firebase.database().ref(path).once(event)
	return snapshot.val()
}

export {logIn, exists, getSnapshot}