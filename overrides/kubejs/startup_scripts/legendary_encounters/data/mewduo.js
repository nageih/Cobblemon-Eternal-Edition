
global.loadMewDuo = () => {
    
    //Mew
    global.roamingConditionalEncounters.mew = {
        species: 'cobblemon:mew',
        weight: 10,
        spawnSound: {
            event: 'minecraft:block.note_block.bell'
        },
        textColor: 'light_purple',
        properties: {
            level: 50,
            moveSet: [
                'psychic',
                'dazzlinggleam',
                'lifedew',
                'reflecttype'
            ],
            maxedIVs: 3
            //heldItem: Item.of('cobblemoneternal:mewtant_genome')
        },
        condition: (player) => {
            //console.log(`Testing Mew encounter condition, partyLevel is sufficient: ${global.partyLevel(player) >= 40}, inJungleBiome: ${global.playerIsInBiome(player, 'cobblemon:is_jungle')}`)
            if(!global.partyLevel(player) >= 40 || !global.playerIsInBiome(player, 'cobblemon:is_jungle')) return false;

            let highFriendshipMon = 0
            global.partyOf(player).forEach(pokemon => {
                if(pokemon.friendship > 220) highFriendshipMon++
            })
            //console.log(`${player.username} has ${highFriendshipMon} pokemon with high friendship`)
            return highFriendshipMon >= 3;
        }
    }


    //Mewtwo
    global.staticConditionalEncounters.mewtwo = {
        species: 'cobblemon:mewtwo',
        interactWith: 'cobblemoneternal:cloning_machine_core',
        spawnSound: 'minecraft:block.note_block.bell',
        spawnOffset: {
            x: 0,
            y: 1,
            z: 0
        },
        properties: {
            level: 60,
            moveSet: [
                'psystrike',
                'aurasphere',
                'shadowball',
                'recover'
            ],
            maxedIVs: 3
        },
        multiblockName: 'cloning_machine',
        condition: (player, block, rotation) => {
            if(global.validateMultiblock('cloning_machine', block, rotation)) {
                if(global.partyLevel(player) < 50) {
                    player.setStatusMessage(Text.translate('message.cobblemoneternal.fail_party_level', '50'))
                    return 'fail_party_level';
                }
                return 'pass';
            } else {
                player.setStatusMessage(Text.translate('message.cobblemoneternal.missing_multiblock')
                    .color('red')) 
                return 'fail_multiblock';
            }
        }
    }
}
