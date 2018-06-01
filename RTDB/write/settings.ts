import {update, escapeFirebaseKey, getNewFirebaseKey, formatPermalink, escapeUndefineds} from '../util'

const editSettings = async (uid, {name, country, bio, url, image, banner}) => {

	let updates = {}

	updates[`users/${uid}/name`] = name
	updates[`users/${uid}/country`] = country
	updates[`users/${uid}/bio`] = bio
	updates[`users/${uid}/url`] = url
	updates[`users/${uid}/image`] = image
	updates[`users/${uid}/banner`] = banner

	escapeUndefineds(updates)
	await update(updates)

	return 'success'
}

export {editSettings}
