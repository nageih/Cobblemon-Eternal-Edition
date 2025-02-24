//priority: 4

//(re)Load encounter data on script (re)load
global.reloadEncounterData()

ServerEvents.loaded(event => {
    let seed = event.getServer().worldData.worldGenOptions().seed()
    if(seed < 0)
        seed *= -1.0
    //console.log(seed)
    global.findRegiPuzzles(seed)
    //Object.keys(global.regiPuzzleIndex).forEach(regi => console.log(`${regi} = ${global.regiPuzzleIndex[regi]}`))
})

const playerRoamerOffsets = {}

PlayerEvents.loggedIn(event => {
    if(playerRoamerOffsets[event.player.uuid]) return;

    let player = event.player
    let offset = mangleUUID(player.uuid)
    //console.log(player.uuid, offset)
    playerRoamerOffsets[player.uuid] = offset
})

const mangleUUID = (uuid) => {
    return uuid.hashCode() % roamerOffsetMaximum
}


//Debug event handler for mangleUUID
// how else do you want me to test it in singleplayer?
/*
ItemEvents.entityInteracted(event => {
    console.log(mangleUUID(event.target.uuid))
})
*/