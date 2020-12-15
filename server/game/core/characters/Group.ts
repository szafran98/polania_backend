import Player from './Player';

export default class Group {
    members: Player[] = [];
    groupInitiator: Player;

    constructor(groupInitiator: Player, invitedPlayer: Player) {
        this.members.push(groupInitiator, invitedPlayer);
        this.groupInitiator = groupInitiator;
    }
}
