import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
admin.initializeApp(functions.config().firebase) // this needs to be init once when deploying to firebase functions

// onWrite

const handleFollow = functions.database.ref('/following/{ownUsername}/{usernameToFollow}').onWrite( require('./onWrite').handleFollow )
const handleNewReview = functions.database.ref('/reviewsSent/{ownUsername}/{reviewUid}').onCreate( require('./onWrite').handleNewReview )
const handleReviewEdit = functions.database.ref('/reviewsSent/{ownUsername}/{reviewUid}').onUpdate( require('./onWrite').handleReviewEdit )
const handleNewReply = functions.database.ref('/repliesSent/{ownUsername}/{replyUid}').onCreate( require('./onWrite').handleNewReply )
const handleReplyEdit = functions.database.ref('/repliesSent/{ownUsername}/{replyUid}').onUpdate( require('./onWrite').handleReplyEdit )
export {handleFollow, handleNewReview, handleReviewEdit, handleNewReply, handleReplyEdit}

// authentication

const initializeUser = functions.auth.user().onCreate( require('./authentication').initializeUser )
const handleReferral = functions.https.onRequest( require('./authentication').handleReferral )
const updateUserAlias = functions.database.ref('/users/{uid}').onWrite( require('./authentication').updateUserAlias )
export {updateUserAlias, handleReferral, initializeUser}

// newsfeed

const getNewsfeed = functions.https.onRequest( require('./newsfeed').getNewsfeed )
export {getNewsfeed}