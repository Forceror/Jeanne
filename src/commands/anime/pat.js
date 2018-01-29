const {Command} = require('sylphy');
const reload = require('require-reload');
const config = reload('../../../config.json');
const axios = require('axios');
const findMember = require('../../utils/utils.js').findMember;

class Pat extends Command {
    constructor(...args) {
        super(...args, {
            name: 'pat',
            description: 'give someone a nice pat.',
            group: 'anime'
        });
    }

    async handle({msg}) {
        let args = msg.content.split(' ');
        args.shift();
        args = args.join(' ');
        if (!args) return msg.channel.createMessage('❎ | Please mention a member to pat');

        const member = findMember(msg, args);
        if (!member) return msg.channel.createMessage(`❎ | Couldn't find a member for **${args}**`);

        const base_url = 'https://rra.ram.moe';
        const type = 'pat';
        const path = '/i/r?type=' + type;

        const res = await axios.get(base_url + path);
        if (res.data.error) return msg.channel.createMessage(`❎ | Something went wrong while requesting the image.\n\`\`\`${res.data.error}\`\`\``);
        msg.channel.createMessage({
            embed: {
                color: config.defaultColor,
                title: `${msg.author.nickname ? msg.author.nickname : msg.author.username} gives ${member.nickname ? member.nickname : member.username} a nice pat`,
                image: {
                    url: base_url + res.data.path
                }
            }
        });
    }
}

module.exports = Pat;