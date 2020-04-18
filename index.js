
var request = require("request")

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.application.applicationId !== "amzn1.ask.skill.1f001cc0-dbc9-4a35-9b51-38e5937a4826") {
            context.fail("Invalid Application ID");
        }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {

}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    getWelcomeResponse(callback)
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    var intent = intentRequest.intent
    var intentName = intentRequest.intent.name;

    if (intentName == "CheckAvailIntent") {
        handleCheckAvailIntent(intent, session, callback)
    } else if (intentName == "CheckFireIntent") {
        handleCheckFireIntent(intent, session, callback)
    } else {
         throw "Invalid intent"
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

}

function getWelcomeResponse(callback) {
    var speechOutput = "Welcome to Beneroan Laundry Applications! Would you like to check laundry machine availability?"

    var reprompt = "Would you like to check laundry machine availability?"

    var header = "Check laundy machine availability"

    var shouldEndSession = false

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    }

    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))

}


/**
 * Called when the user invokes the CheckAvailIntent (to check availability of laundry machines).
 */
function handleCheckAvailIntent(intent, session, callback) {

    var speechOutput = "The TAMS magical laundry server pulled an L. Please wait and try again."

    getAvailJSON(function(data) {
        if (data != "ERROR") {
            var speechOutput = data
        }
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true))
    })

}

/**
 * Called when the user invokes the CheckFireIntent (to check if there is a fire).
 */
function handleCheckFireIntent(intent, session, callback) {

    var speechOutput = "The TAMS magical laundry server pulled an L. Please wait and try again."

    getFireJSON(function(data) {
        if (data != "ERROR") {
            var speechOutput = data
        }
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true))
    })

}

/**
 * URL to check for laundry machine availability
 */
function availURL() {
    return "http://nationalpark.fun:5000/status/machine"
}

/**
 * URL to check for fire and smoke
 */
function fireURL() {
    return "http://nationalpark.fun:5000/status/fire"
}

/**
 * Parse JSON data from availURL
 */
function getAvailJSON(callback) {
    request.get(availURL(), function(error, response, body) {
        var d = JSON.parse(body)
        var result = d.free

        if (result != undefined) {
            if (result == true) {
                callback("At least one of the laundry machines are open. Hurry before someone takes it!")
            } else {
                callback("Both of the laundry machines are currently in use. Check again soon.")
            }
        } else {
            callback("ERROR")
        }
    })
}

/**
 * Parse JSON data from fireURL
 */
function getFireJSON(callback) {
    request.get(fireURL(), function(error, response, body) {
        var d = JSON.parse(body)
        var result = d.fire

        if (result != undefined) {
            if (result == true) {
                callback("HURRY UP AND GET OUT. Also, might wanna go to the doctor cuz you should've heard the fire alarm approximately a long time ago.")
            } else {
                callback("Nope. No Fire...yet.")
            }
        } else {
            callback("ERROR")
        }
    })
}



// ------- Helper functions to build responses for Alexa -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}
