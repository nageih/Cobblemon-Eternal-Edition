
const preferencesFilePath = "cobblemon-eternal_preferences-client.json"

const legendarySpawnMessageInChat = "legendarySpawnMessageInChat"

const defaultPreferenceFile = {
    "legendarySpawnMessageInChat_COMMENT": "If Legendary Spawning messages should put into Game Chat instead of over the Hotbar/Action Bar",
    legendarySpawnMessageInChat: false
}


let preferences = JsonIO.readJson(preferencesFilePath)

if(preferences == undefined) {
    JsonIO.write(preferencesFilePath, defaultPreferenceFile)
    preferences = JsonIO.readJson(preferencesFilePath)
}

NetworkEvents.dataReceived('chatMessage', event => {
    let message = event.data.getString('message')
    let speciesName = event.data.getString('species').split(':')
    let color = event.data.getString('color') //global.roamingConditionalEncounters[speciesName[1]].textColor

    console.log(preferences.get(legendarySpawnMessageInChat), color)

    processMessage(
        event.player, 
        preferences.get(legendarySpawnMessageInChat) == 'true' ? true : false, 
        message, 
        Text.translate(`${speciesName[0]}.species.${speciesName[1]}.name`).color(color ? color : 'white')
    )
})


const processMessage = (player, pref, message, arg) => {
    console.log(`preference passed to event: ${pref}`)
    switch (pref) {
        case true:
            player.tell(
                Text.translate(message, arg)
            )
            break;
        case false:
            player.setStatusMessage(
                Text.translate(message, arg)
            )
            break;
        default:
            console.warn(`unaccepted value '${pref}' was passed to processMessage()`)
    }
}