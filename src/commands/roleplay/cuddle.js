const {Command} = require('sylphy');
const axios = require('axios');
const findMember = require('../../utils/utils.js').findMember;
const utils = require('../../utils/utils');

class Cuddle extends Command {
    constructor(...args) {
        super(...args, {
            name: 'cuddle',
            description: 'cuddle with someone.',
            group: 'roleplay'
        });
    }

    async handle({msg, client}) {
        let args = msg.content.split(' ');
        args.shift();
        args = args.join(' ');
        if (!args) return msg.channel.createMessage('❎ | Please mention a member to cuddle');

        const member = findMember(msg, args);
        if (!member) return msg.channel.createMessage(`❎ | Couldn't find a member for **${args}**`);

        const base_url = 'https://rra.ram.moe';
        const type = 'cuddle';
        const path = '/i/r?type=' + type;

        const res = await axios.get(base_url + path);
        if (res.data.error) return msg.channel.createMessage(`❎ | Something went wrong while requesting the image.\n\`\`\`${res.data.error}\`\`\``);
        msg.channel.createMessage({
            embed: {
                color: utils.getDefaultColor(msg, client),
                title: `${msg.author.nickname ? msg.author.nickname : msg.author.username} gives ${member.nickname ? member.nickname : member.username} a cuddle`,
                image: {
                    url: base_url + res.data.path
                }
            }
        });
    }
}

module.exports = Cuddle;
