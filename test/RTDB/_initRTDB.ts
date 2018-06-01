import {init} from '../../RTDB/util'

describe('init', () => {

	it ('init should init and close RTDB', () => {
		const app = init()
		setTimeout( () => {
			app.delete() 
			process.exit()
		}, 10000 )
	})

})
