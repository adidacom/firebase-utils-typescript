import * as sinon from 'sinon'
import {getDbPath} from '../util'
import * as mockDb1 from '../mockDbs/mockDb1'

const createStubs = (stubs) => {

	createNestedStubs(stubs)

	// admin stubs
	const admin = require('firebase-admin')
	stubs.init = sinon.stub(admin, 'initializeApp')
	stubs.auth = sinon.stub(admin, 'auth').get( () => () => ({ verifyIdToken: stubs.verifyIdToken }) )
	stubs.database = sinon.stub(admin, 'database').get( () => () => ({ ref: stubs.ref }) )

	// functions stubs
	const functions = require('firebase-functions')
	stubs.config = sinon.stub(functions, 'config').returns(firebaseConfig)

	// init firebase
	admin.initializeApp(functions.config().firebase)
}

const createNestedStubs = (stubs) => {

	const verifyIdToken = sinon.spy( () => ({ uid: Object.values(mockDb1.users)[0].uid }) )

	const ref = sinon.stub()
	const update = sinon.stub()
	const transaction = sinon.stub()
	
	ref.callsFake( (path) => ({ 
		update: update, 
		transaction: transaction,
		once: () => ({ val: () => getDbPath(path, mockDb1), exists: () => Boolean(getDbPath(path, mockDb1)) }),
		on: () => ({ val: () => getDbPath(path, mockDb1) }),
	}) )

	// store stubs and spies
	stubs.transaction = transaction
	stubs.update = update
	stubs.verifyIdToken = verifyIdToken
	stubs.ref = ref

	/* Explanations : 
	 *
	 *	1. All the functions that are used need to be ether mocked, stubbed or spied. 
	 *     You will need to add the ones you use that I haven't convered.
	 *	2. The database read queries are mocked using the local json file with 
	 *     the function getDbPath(). Some are spied so you can see their args.
	 *	3. The database write queries are stubbed so that you can inspect their 
	 *     behavior using the sinon.stub API http://sinonjs.org/releases/v1.17.7/stubs/
	 *  4. Stubs are stored in an object called "stubs" so they can be moved
	 *     around from module to module. Since objects are pointers there's
	 *     no need to return them to modify them.
	 *	5. The firebase methods are complicated and can take a while to figure
	 *	   out how to set up their stub/spies, but once they are set up, they are
	 *	   easy to use. For example, the refSub needs to be on its own object
	 *	   otherwise stubbing doesn't work.
     */
}

const restoreStubs = (stubs) => {
	for (const stub in stubs) {
		if (stubs[stub].restore) stubs[stub].restore()
	}
}

const firebaseConfig = {
	firebase: {
		databaseURL: 'https://not-a-project.firebaseio.com',
		storageBucket: 'not-a-project.appspot.com',
	}
}


export {restoreStubs, createStubs}