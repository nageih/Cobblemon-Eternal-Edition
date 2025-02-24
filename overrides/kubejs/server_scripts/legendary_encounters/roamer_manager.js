//priority: 5


//spawn a Roaming Legendary pokemon near the player
/**
* @param {PlayerJS} player
* @param {Map<string, string | Function>} spawnDetails
* @param {boolean} bypassChecks whether to bypass spawning conditions and 'alreadyOwns'
*/
const trySpawnRoamingLegendary = (player, spawnDetails, bypassChecks) => {
    let {x, y, z, level} = player
    let pos = level.getBlockRandomPos(x, y, z, 32)
    /*BlockPos.of(
        x + Math.round(Math.random() * 32) - 16,
        y + Math.round(Math.random() * 16) - 8,
        z + Math.round(Math.random() * 32) - 16
    )*/
    bypassChecks = bypassChecks || false // conditions are evaluated before being added to the spawnable list, like loot tables.

    if(spawnDetails == undefined) return;
    
    if(!bypassChecks)
        global.partyOf(player).forEach(pokemon => {
            if(pokemon.species == spawnDetails.species)
                if(spawnDetails.alreadyOwns){
                    spawnDetails.alreadyOwns(player, spawnDetails.species)
                } else {
                    if(Math.random() < roamerRerollSuccessRate) return;
                    trySpawnRoamingLegendary(player, global.selectRoamingLegendary(player, global.registeredRoamers))
                    return;
                }
        })
        

    //if(!bypassConditions) return;

    //set the player's roamer limiter flag, cause at this point, it's getting spawned.
    player.persistentData.dailyRoamerSuccesses = 1 //hardcoded for 1 right now because '+=' with the double to string interpretation makes it concat and eval to NaN

    //console.log('Y position adjustment starting')
    /*
    if(spawnDetails.flyingHeight){
        console.log(`${spawnDetails.species} is a flyer, looking for a surface to spawn above`)
        for (let currentY = 255; currentY < pos.y; currentY--){
            if(level.getBlock(pos.x, currentY, pos.z) != 'minecraft:air'){
                pos = level.getBlock(pos.x, currentY + spawnDetails.flyingHeight, pos.z).pos
                break;
            }
        }
    } else {
     */
        //console.log(`${spawnDetails.species} is not a flyer, looking for a ground position`)
        //if(!spawnDetails.canBeUnderground) pos = level.getBlock(pos.x, 60, pos.z).pos
        let lastBlockWasAir = false
        let upFromPlayer = Math.floor(player.y) + 32
        let downFromPlayer = Math.floor(player.y) - 32
        let iterations = 0;
        for (let currentY = upFromPlayer; currentY > downFromPlayer; currentY--){
            if(iterations == 100) {
                console.warn(`position finding for roamer '${spawnDetails.species}' took more than 100 iterations, emergency breaking!`)
                break;
            }
            let currentBlock = level.getBlock(pos.x, currentY, pos.z)
            //console.log(currentBlock.pos, currentBlock, currentY < -64)
            if(currentBlock == 'minecraft:air'){
                if(currentY < downFromPlayer || currentY < -64) {
                    console.warn(`Roamer ${spawnDetails.species} could not find ground to spawn on! between ${upFromPlayer} and ${downFromPlayer}, at ${pos.x}x ${pos.z}z`)
                    return;
                }

                lastBlockWasAir = true
            } else {
                if(lastBlockWasAir && currentBlock != 'minecraft:air') {
                    pos = currentBlock.pos.mutable()
                    pos.y++
                    console.log(`Valid pos found at ${pos}`)
                    break;
                }
                lastBlockWasAir = false
            }
            iterations++
        }
    //}
    //console.log('Y position adjustment done')

    level.getEntitiesWithin(AABB.ofBlock(pos).inflate(64))
        .filter(entity => entity.type == 'minecraft:player')
        .forEach(player => {
            //console.log(player)
            global.playLegendaryMessage(player, 'message.cobblemoneternal.legendary_spawned_nearby', spawnDetails.species, spawnDetails.textColor ? spawnDetails.textColor : 'white')

            let spawnSound = spawnDetails.spawnSound
            global.playSoundNear(player, null, spawnSound.event, 'neutral', spawnSound.volume ? spawnSound.volume : 1, spawnSound.pitch ? spawnSound.pitch : 1)
        })

    //console.log(spawnDetails)
    let pokemonEntity = new $PokemonEntity(level, createPokemon(spawnDetails.species, spawnDetails.properties), $CobblemonEntities.POKEMON)
    //console.log(pokemonEntity)
        pokemonEntity.x = pos.x
        pokemonEntity.y = pos.y
        pokemonEntity.z = pos.z
        pokemonEntity.spawn()

    console.log(`${spawnDetails.species} created at ${pos.x}x ${pos.y}y ${pos.z}z near ${player.username}. forced: ${bypassChecks}`)
}


//the engine, so to speak
// attempts to spawn a Roamer every (default) 7000 ticks, offset by up to (default) 1000, based on the player's UUID, with a (default) 20% chance of success, if one has not already spawned with in the day
// this does have weight more recently, through "global.selectRoamingLegendary()" but it does not really come into play with the minimal amount of roamers implemented.
PlayerEvents.tick(event => {
    if(!event.level.remote){
        if(event.level.time % roamingLegendaryCheckFrequency == playerRoamerOffsets[event.player.uuid]){
            console.log(`running Roamer check for ${event.player.username} at ${event.level.time}`)
            let rand = Math.random()
            let roamerSuccesses = parseInt(event.player.persistentData.dailyRoamerSuccesses)
            /*
            console.log(
                `successes limit: ${maxRoamersPerDay}`,
                `current successes: ${roamerSuccesses}`,
                `successes not at limit: ${roamerSuccesses < maxRoamersPerDay}`,
                `random value: ${rand}`,
                `sucess rate: ${1.0 - roamerSpawnCheckSuccessRate}`
            )
                */
            if(roamerSuccesses < maxRoamersPerDay
                && rand > (1.0 - roamerSpawnCheckSuccessRate)){
                console.log(`attempting roaming legendary spawn near ${event.player.username}`)
                global.setCopyRoamerGroup()
                trySpawnRoamingLegendary(
                    event.player,
                    global.selectRoamingLegendary(event.player)
                )
            }
        }

        if(event.level.time % dayLength == 0){
            event.player.persistentData.dailyRoamerSuccesses = 0
        }
    }
})


/**
* @param {PlayerJS} player 
* @param {string} species 
* @returns {boolean}
*/
const forceSpawnRoamerNear = (player, species, bypassChecks) => {
    bypassChecks = bypassChecks || true
    trySpawnRoamingLegendary(player, global.roamingConditionalEncounters[species], bypassChecks)
    return 1;
}

ServerEvents.commandRegistry(event => {
    const {commands: Commands, arguments: Arguments, builtinSuggestions: Suggestions} = event

    //Command to force a Roaming legendary to spawn near a player
    // '/forceroaminglegendaryspawn <species> [<player>]'
    // ex: '/forceroaminglegendaryspawn moltres Emmerdog' spawns a Moltres near player Emmerdog
    event.register(
        Commands.literal('forceroaminglegendaryspawn')
            .requires(source => source.hasPermission(2))
            .then(Commands.argument('species', Arguments.WORD.create(event))
                //.suggests(builder => Suggestions.suggests(global.registeredRoamers, builder))
                .executes(ctx => {
                    let player = ctx.source.player
                    let species = Arguments.WORD.getResult(ctx, 'species')
                    player.tell(
                        Text.translate('message.cobblemoneternal.command.force_spawn_success',
                            species, player.username)
                    )
                    return forceSpawnRoamerNear(player, species)
                })
                .then(Commands.argument('player', Arguments.PLAYER.create(event))
                    .executes(ctx => {
                        let player = Arguments.PLAYER.getResult(ctx, 'player')
                        let species = Arguments.WORD.getResult(ctx, 'species')
                        if(ctx.source.player)
                            ctx.source.player.tell(
                                Text.translate('message.cobblemoneternal.command.force_spawn_success',
                                    species, player.username)
                            )
                        return forceSpawnRoamerNear(player, species)
                    })
                    .then(Commands.argument('bypassChecks', Arguments.BOOLEAN.create(event))
                        .executes(ctx => {
                        let player = Arguments.PLAYER.getResult(ctx, 'player')
                        let species = Arguments.WORD.getResult(ctx, 'species')
                        let bypassChecks = Arguments.BOOLEAN.getResult(ctx, 'bypassChecks')
                        if(ctx.source.player)
                            ctx.source.player.tell(
                                Text.translate('message.cobblemoneternal.command.force_spawn_success',
                                    species, player.username)
                            )
                        return forceSpawnRoamerNear(player, species, bypassChecks)
                        })
                    )
                )
            )
    )
})